import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from '../src/database/database.config.js';
import {
  Customer,
  HistoricalOrder,
  HistoricalOrderItem,
  OrderRequest,
  OrderRequestItem,
  SalesRep,
  Wine,
} from '../src/database/entities/index.js';
import { InventoryPolicy } from '../src/database/entities/order-request.entity.js';

describe('phase 1 schema constraints', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18').start();
    dataSource = new DataSource(
      createDataSourceOptions({
        POSTGRES_HOST: container.getHost(),
        POSTGRES_PORT: container.getPort(),
        POSTGRES_USER: container.getUsername(),
        POSTGRES_PASSWORD: container.getPassword(),
        POSTGRES_DB: container.getDatabase(),
      }),
    );
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    await container?.stop();
  });

  const newWine = (overrides: Partial<Wine> = {}) =>
    dataSource.getRepository(Wine).save({
      name: 'Barolo',
      producer: 'Conterno',
      vintage: 2019,
      format: '750 ml',
      sku: `SKU-${randomUUID()}`,
      available: 10,
      ...overrides,
    });

  async function newRequest(idempotencyKey = randomUUID()) {
    const customer = await dataSource.getRepository(Customer).save({
      name: 'Cellar Door',
      contactName: 'Ana',
      email: 'ana@example.com',
      phone: '555-0100',
    });
    const salesRep = await dataSource.getRepository(SalesRep).save({
      name: 'Rep',
      email: `rep-${randomUUID()}@example.com`,
    });
    return dataSource.getRepository(OrderRequest).save({
      idempotencyKey,
      requestHash: 'hash',
      customerId: customer.id,
      salesRepId: salesRep.id,
      contactName: 'Ana',
      phone: '555-0100',
      inventoryPolicy: InventoryPolicy.Strict,
    });
  }

  it('generates uuid keys and defaults notes to empty', async () => {
    const request = await newRequest();
    expect(request.id).toMatch(/^[0-9a-f-]{36}$/);
    const saved = await dataSource
      .getRepository(OrderRequest)
      .findOneByOrFail({ id: request.id });
    expect(saved.notes).toBe('');
  });

  it('rejects a duplicate sku', async () => {
    const wine = await newWine();
    await expect(newWine({ sku: wine.sku })).rejects.toMatchObject({
      driverError: { code: '23505' },
    });
  });

  it('rejects a negative available stock', async () => {
    await expect(newWine({ available: -1 })).rejects.toMatchObject({
      driverError: { code: '23514' },
    });
    await expect(newWine({ available: 0 })).resolves.toBeDefined();
  });

  it('rejects a duplicate idempotency key', async () => {
    const request = await newRequest();
    await expect(newRequest(request.idempotencyKey)).rejects.toMatchObject({
      driverError: { code: '23505' },
    });
  });

  it('rejects the same wine twice in one request', async () => {
    const request = await newRequest();
    const wine = await newWine();
    const items = dataSource.getRepository(OrderRequestItem);
    const item = {
      requestId: request.id,
      wineId: wine.id,
      quantity: 1,
      availableAtSave: 10,
    };
    await items.insert(item);
    await expect(items.insert(item)).rejects.toMatchObject({
      driverError: { code: '23505' },
    });
  });

  it('rejects a zero quantity on request and past order items', async () => {
    const request = await newRequest();
    const wine = await newWine();
    await expect(
      dataSource.getRepository(OrderRequestItem).save({
        requestId: request.id,
        wineId: wine.id,
        quantity: 0,
        availableAtSave: 10,
      }),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });

    const order = await dataSource.getRepository(HistoricalOrder).save({
      customerId: request.customerId,
      salesRepId: request.salesRepId,
      orderedAt: new Date(),
    });
    await expect(
      dataSource.getRepository(HistoricalOrderItem).save({
        orderId: order.id,
        wineId: wine.id,
        quantity: 0,
      }),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
  });

  it('deletes request items with their request', async () => {
    const request = await newRequest();
    const wine = await newWine();
    await dataSource.getRepository(OrderRequestItem).save({
      requestId: request.id,
      wineId: wine.id,
      quantity: 2,
      availableAtSave: 10,
    });
    await dataSource.getRepository(OrderRequest).delete({ id: request.id });
    expect(
      await dataSource
        .getRepository(OrderRequestItem)
        .countBy({ requestId: request.id }),
    ).toBe(0);
  });
});
