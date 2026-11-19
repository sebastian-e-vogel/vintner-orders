import { DataSource } from 'typeorm';
import {
  Customer,
  HistoricalOrder,
  HistoricalOrderItem,
  SalesRep,
  Settings,
  Wine,
} from '../entities/index.js';
import { InventoryPolicy } from '../entities/order-request.entity.js';
import { customers, orders, salesRep, wines } from './seed-data.js';

// Every app table, never the migrations table. One statement, so FK order does not matter.
const appTables = [
  'order_request_item',
  'order_request',
  'historical_order_item',
  'historical_order',
  'wine',
  'customer',
  'sales_rep',
  'settings',
];

export async function seedDatabase(dataSource: DataSource) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed: NODE_ENV is production.');
  }

  await dataSource.transaction(async (manager) => {
    await manager.query(
      `TRUNCATE ${appTables.map((t) => `"${t}"`).join(', ')}`,
    );
    await manager.insert(SalesRep, salesRep);
    await manager.insert(Customer, customers);
    await manager.insert(Wine, wines);
    await manager.insert(
      HistoricalOrder,
      orders.map(({ items: _items, ...order }) => order),
    );
    await manager.insert(
      HistoricalOrderItem,
      orders.flatMap((order) =>
        order.items.map((item) => ({ ...item, orderId: order.id })),
      ),
    );
    await manager.insert(Settings, { inventoryPolicy: InventoryPolicy.Strict });
  });

  return {
    salesReps: 1,
    wines: wines.length,
    customers: customers.length,
    orders: orders.length,
    orderLines: orders.reduce((sum, o) => sum + o.items.length, 0),
  };
}
