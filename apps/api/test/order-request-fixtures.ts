import { DataSource } from 'typeorm';
import {
  Customer,
  SalesRep,
  Settings,
  Wine,
} from '../src/database/entities/index.js';
import { CURRENT_SALES_REP_ID } from '../src/sales-reps/current-sales-rep.js';
import { InventoryPolicy } from '../src/database/entities/order-request.entity.js';

// The only place that knows the wine columns, so the schema change in #47
// (format to size_ml, region) is a one-line fix here.
const wineRow = (sku: string, available: number) => ({
  name: `Wine ${sku}`,
  producer: 'Conterno',
  vintage: 2019,
  format: '750 ml',
  sku,
  available,
});

// Resets the tables a save touches and inserts one rep, one customer and
// three wines: 10 available, 3 available and 0 available.
export async function seedOrderData(
  dataSource: DataSource,
  policy: 'strict' | 'flexible' = 'strict',
) {
  await dataSource.query(
    'TRUNCATE order_request_item, order_request, wine, customer, sales_rep, settings CASCADE',
  );
  await dataSource.getRepository(SalesRep).insert({
    id: CURRENT_SALES_REP_ID,
    name: 'Rep',
    email: 'rep@example.com',
  });
  const customer = await dataSource.getRepository(Customer).save({
    name: 'Wine Bar',
    contactName: 'Ana',
    email: 'ana@example.com',
    phone: '555-0100',
  });
  const [plenty, few, none] = await dataSource
    .getRepository(Wine)
    .save([wineRow('A', 10), wineRow('B', 3), wineRow('C', 0)]);
  await dataSource
    .getRepository(Settings)
    .insert({ inventoryPolicy: policy as InventoryPolicy });
  return { customer, plenty, few, none };
}

export const validBody = (
  customerId: string,
  lines: { wineId: string; quantity: number }[],
) => ({
  customerId,
  contactName: 'Ana',
  phone: '+34 600 111 222',
  notes: 'Call back',
  lines,
});
