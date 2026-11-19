import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  Customer as CustomerResponse,
  LastTime,
  Wine as WineResponse,
} from '@vintner/contracts';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Customer } from '../database/entities/index.js';

type ItemRow = WineResponse & { quantity: number };

// Same order as GET /wines, so the lines read like the catalog.
const itemsSql = (table: string, foreignKey: string) => `
  SELECT i.quantity, w.id, w.name, w.producer, w.vintage, w.format, w.sku, w.available
  FROM ${table} i JOIN wine w ON w.id = i.wine_id
  WHERE i.${foreignKey} = $1
  ORDER BY w.name, w.vintage NULLS LAST, w.format, w.sku`;
const orderItemsSql = itemsSql('historical_order_item', 'order_id');
const requestItemsSql = itemsSql('order_request_item', 'request_id');

// The newest of the two sources; on a tie the order wins (rank), then the lowest id.
const newestSql = `
  SELECT kind, id, at, sales_rep_name, contact_name FROM (
    SELECT 'order' AS kind, 0 AS rank, o.id, o.ordered_at AS at,
      (SELECT name FROM sales_rep WHERE id = o.sales_rep_id) AS sales_rep_name,
      NULL AS contact_name
    FROM historical_order o WHERE o.customer_id = $1
    UNION ALL
    SELECT 'request', 1, r.id, r.created_at, NULL, r.contact_name
    FROM order_request r WHERE r.customer_id = $1
  ) activity
  ORDER BY at DESC, rank, id
  LIMIT 1`;

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    private readonly dataSource: DataSource,
  ) {}

  list(): Promise<CustomerResponse[]> {
    return this.customers.find({
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
      },
      order: { name: 'ASC', id: 'ASC' },
    });
  }

  // Pass the manager of an open transaction to check inside it.
  exists(id: string, manager?: EntityManager): Promise<boolean> {
    return (manager?.getRepository(Customer) ?? this.customers).existsBy({
      id,
    });
  }

  async lastTime(customerId: string): Promise<LastTime | null> {
    if (!(await this.exists(customerId))) {
      throw new NotFoundException('Customer not found.');
    }
    const [newest] = await this.dataSource.query<
      {
        kind: 'order' | 'request';
        id: string;
        at: Date;
        sales_rep_name: string | null;
        contact_name: string | null;
      }[]
    >(newestSql, [customerId]);
    if (!newest) return null;

    const rows = await this.dataSource.query<ItemRow[]>(
      newest.kind === 'order' ? orderItemsSql : requestItemsSql,
      [newest.id],
    );
    const items = rows.map(({ quantity, ...wine }) => ({ quantity, wine }));
    const at = newest.at.toISOString();
    return newest.kind === 'order'
      ? { kind: 'order', at, salesRepName: newest.sales_rep_name!, items }
      : { kind: 'request', at, contactName: newest.contact_name!, items };
  }
}
