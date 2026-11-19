import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CustomersService } from '../src/customers/customers.service.js';
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
import { CURRENT_SALES_REP_ID } from '../src/sales-reps/current-sales-rep.js';
import { SalesRepsService } from '../src/sales-reps/sales-reps.service.js';
import { RecentWinesService } from '../src/wines/recent-wines.service.js';

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const day = (d: number) => new Date(Date.UTC(2026, 0, d));
const OTHER_REP = uuid(900);
const CUSTOMER = uuid(800);

describe('last time and recent wines queries', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let customers: CustomersService;
  let recent: RecentWinesService;
  let nextId = 1000;

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
    customers = new CustomersService(dataSource.getRepository(Customer));
    recent = new RecentWinesService(
      new SalesRepsService(dataSource.getRepository(SalesRep)),
      dataSource,
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    await container?.stop();
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE order_request_item, order_request, historical_order_item, historical_order, wine, customer, sales_rep CASCADE',
    );
    await dataSource.getRepository(SalesRep).save([
      { id: CURRENT_SALES_REP_ID, name: 'Marta', email: 'm@example.com' },
      { id: OTHER_REP, name: 'Other', email: 'o@example.com' },
    ]);
    await dataSource.getRepository(Customer).save({
      id: CUSTOMER,
      name: 'Taverna',
      contactName: 'Ana',
      email: 'a@example.com',
      phone: '555-0100',
    });
  });

  const addWine = (n: number, overrides: Partial<Wine> = {}) =>
    dataSource.getRepository(Wine).save({
      id: uuid(n),
      name: `Wine ${n}`,
      producer: 'Conterno',
      vintage: 2019,
      format: '750 ml',
      sku: `SKU-${n}`,
      available: 5,
      ...overrides,
    });

  const addOrder = async (
    at: Date,
    lines: [number, number][],
    { id = uuid(nextId++), repId = CURRENT_SALES_REP_ID } = {},
  ) => {
    await dataSource
      .getRepository(HistoricalOrder)
      .save({ id, customerId: CUSTOMER, salesRepId: repId, orderedAt: at });
    await dataSource.getRepository(HistoricalOrderItem).save(
      lines.map(([wine, quantity]) => ({
        id: uuid(nextId++),
        orderId: id,
        wineId: uuid(wine),
        quantity,
      })),
    );
  };

  const addRequest = async (
    at: Date,
    lines: [number, number][],
    { id = uuid(nextId++), repId = CURRENT_SALES_REP_ID } = {},
  ) => {
    await dataSource.getRepository(OrderRequest).save({
      id,
      idempotencyKey: uuid(nextId++),
      requestHash: 'h',
      customerId: CUSTOMER,
      salesRepId: repId,
      contactName: 'Caller',
      phone: '555-0101',
      inventoryPolicy: InventoryPolicy.Strict,
      createdAt: at,
    });
    await dataSource.getRepository(OrderRequestItem).save(
      lines.map(([wine, quantity]) => ({
        id: uuid(nextId++),
        requestId: id,
        wineId: uuid(wine),
        quantity,
        availableAtSave: 0,
      })),
    );
  };

  describe('lastTime', () => {
    beforeEach(async () => {
      await addWine(1);
      await addWine(2);
    });

    it('returns null for a customer without history', async () => {
      await expect(customers.lastTime(CUSTOMER)).resolves.toBeNull();
    });

    it('throws NotFound for an unknown customer', async () => {
      await expect(customers.lastTime(uuid(1))).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the order when it is newer than the request', async () => {
      await addRequest(day(1), [[1, 1]]);
      await addOrder(day(2), [[2, 3]]);

      const result = await customers.lastTime(CUSTOMER);

      expect(result).toMatchObject({
        kind: 'order',
        at: day(2).toISOString(),
        salesRepName: 'Marta',
        items: [{ quantity: 3, wine: { id: uuid(2) } }],
      });
    });

    it('returns the request when it is newer than the order', async () => {
      await addOrder(day(1), [[1, 1]]);
      await addRequest(day(2), [[2, 4]]);

      const result = await customers.lastTime(CUSTOMER);

      expect(result).toMatchObject({
        kind: 'request',
        contactName: 'Caller',
        items: [{ quantity: 4, wine: { id: uuid(2) } }],
      });
    });

    it('prefers the order when both have the same timestamp', async () => {
      await addRequest(day(1), [[1, 1]], { id: uuid(1) });
      await addOrder(day(1), [[2, 1]], { id: uuid(2) });

      expect((await customers.lastTime(CUSTOMER))?.kind).toBe('order');
    });

    it('takes the lowest id among orders with the same timestamp', async () => {
      await addOrder(day(1), [[1, 7]], { id: uuid(20) });
      await addOrder(day(1), [[2, 9]], { id: uuid(10) });

      const result = await customers.lastTime(CUSTOMER);

      expect(result?.items).toMatchObject([{ quantity: 9 }]);
    });

    it('reports the current stock, not the stock when saved', async () => {
      await addRequest(day(1), [[1, 1]]);
      await dataSource.getRepository(Wine).update(uuid(1), { available: 42 });

      const result = await customers.lastTime(CUSTOMER);

      expect(result?.items[0]?.wine.available).toBe(42);
    });
  });

  describe('recent wines', () => {
    it('fails clearly when the current rep is missing', async () => {
      await dataSource.query('TRUNCATE sales_rep CASCADE');
      await expect(recent.list()).rejects.toThrow(/Run the seed/);
    });

    it('returns an empty list without history', async () => {
      await expect(recent.list()).resolves.toEqual([]);
    });

    it('returns fewer than 10 wines when there are fewer', async () => {
      await addWine(1);
      await addWine(2);
      await addOrder(day(1), [[1, 1]]);
      await addRequest(day(2), [[2, 1]]);

      const result = await recent.list();

      expect(result.map((w) => w.id)).toEqual([uuid(2), uuid(1)]);
      expect(result[0]).toEqual({
        id: uuid(2),
        name: 'Wine 2',
        producer: 'Conterno',
        vintage: 2019,
        format: '750 ml',
        sku: 'SKU-2',
        available: 5,
      });
    });

    it('lists a repeated wine once, at its newest date', async () => {
      for (const n of [1, 2, 3]) await addWine(n);
      await addOrder(day(1), [[1, 1]]);
      await addOrder(day(2), [[2, 1]]);
      await addRequest(day(3), [[3, 1]]);
      await addOrder(day(4), [[1, 1]]);

      const result = await recent.list();

      expect(result.map((w) => w.id)).toEqual([uuid(1), uuid(3), uuid(2)]);
    });

    it('breaks ties on the date by lowest wine id', async () => {
      for (const n of [1, 2]) await addWine(n);
      await addOrder(day(1), [
        [2, 1],
        [1, 1],
      ]);

      const result = await recent.list();

      expect(result.map((w) => w.id)).toEqual([uuid(1), uuid(2)]);
    });

    it('limits to 10 distinct wines after removing repeats', async () => {
      for (let n = 1; n <= 12; n++) await addWine(n);
      // Wines 1 and 2 repeat many times late; wines 3..12 are older single uses.
      for (let n = 3; n <= 12; n++) await addOrder(day(n), [[n, 1]]);
      await addOrder(day(20), [[1, 1]]);
      await addRequest(day(21), [[1, 1]]);
      await addOrder(day(22), [[2, 1]]);
      await addRequest(day(23), [[2, 1]]);

      const result = await recent.list();

      expect(result).toHaveLength(10);
      expect(result.map((w) => w.id)).toEqual(
        [2, 1, 12, 11, 10, 9, 8, 7, 6, 5].map(uuid),
      );
    });

    it("ignores other reps' orders and requests", async () => {
      for (const n of [1, 2, 3]) await addWine(n);
      await addOrder(day(1), [[1, 1]]);
      await addOrder(day(5), [[2, 1]], { repId: OTHER_REP });
      await addRequest(day(6), [[3, 1]], { repId: OTHER_REP });

      const result = await recent.list();

      expect(result.map((w) => w.id)).toEqual([uuid(1)]);
    });
  });
});
