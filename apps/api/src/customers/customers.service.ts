import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  Customer as CustomerResponse,
  LastTime,
  Wine as WineResponse,
} from '@vintner/contracts';
import { EntityManager, Repository } from 'typeorm';
import { Customer } from '../database/entities/index.js';

type ItemRow = WineResponse & { quantity: number };

// Same order as GET /wines, so the lines read like the catalog.
const itemsSql = (table: string, foreignKey: string) => `
  SELECT i.quantity, w.id, w.name, w.producer, w.vintage, w.region, w.size_ml AS "sizeMl", w.sku, w.available
  FROM ${table} i JOIN wine w ON w.id = i.wine_id
  WHERE i.${foreignKey} = $1
  ORDER BY w.name, w.vintage NULLS LAST, w.size_ml, w.sku`;
const orderItemsSql = itemsSql('historical_order_item', 'order_id');
const requestItemsSql = itemsSql('order_request_item', 'request_id');

// Each source takes its own newest row through its (customer_id, date) index; then the order
// wins a tie (rank), then the lowest id. The sales rep is looked up only for the winner.
const newestSql = `
  SELECT a.kind, a.id, a.at, a.contact_name,
    (SELECT name FROM sales_rep WHERE id = a.sales_rep_id) AS sales_rep_name
  FROM (
    (SELECT 'order' AS kind, 0 AS rank, id, ordered_at AS at, sales_rep_id,
      NULL::text AS contact_name
     FROM historical_order WHERE customer_id = $1
     ORDER BY ordered_at DESC, id LIMIT 1)
    UNION ALL
    (SELECT 'request', 1, id, created_at, NULL::uuid, contact_name
     FROM order_request WHERE customer_id = $1
     ORDER BY created_at DESC, id LIMIT 1)
  ) a
  ORDER BY a.at DESC, a.rank, a.id
  LIMIT 1`;

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
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
    const [newest] = await this.customers.query<
      {
        kind: 'order' | 'request';
        id: string;
        at: Date;
        sales_rep_name: string | null;
        contact_name: string | null;
      }[]
    >(newestSql, [customerId]);
    if (!newest) return null;

    const rows = await this.customers.query<ItemRow[]>(
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
