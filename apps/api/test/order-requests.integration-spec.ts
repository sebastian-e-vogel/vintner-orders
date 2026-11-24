import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { orderRequestSchema } from '@vintner/contracts';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from '../src/database/database.config.js';
import { CustomersService } from '../src/customers/customers.service.js';
import {
  Customer,
  OrderRequest,
  OrderRequestItem,
  SalesRep,
  Settings,
  Wine,
} from '../src/database/entities/index.js';
import { SalesRepsService } from '../src/sales-reps/sales-reps.service.js';
import { WinesService } from '../src/wines/wines.service.js';
import { OrderRequestsService } from '../src/order-requests/order-requests.service.js';
import { InventoryPolicyService } from '../src/settings/inventory-policy.service.js';
import { seedOrderData, validBody } from './order-request-fixtures.js';

describe('order requests service', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let policies: InventoryPolicyService;
  let service: OrderRequestsService;
  let data: Awaited<ReturnType<typeof seedOrderData>>;

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
    policies = new InventoryPolicyService(dataSource.getRepository(Settings));
    service = new OrderRequestsService(
      dataSource,
      dataSource.getRepository(OrderRequest),
      dataSource.getRepository(OrderRequestItem),
      policies,
      new CustomersService(dataSource.getRepository(Customer)),
      new WinesService(dataSource.getRepository(Wine)),
      new SalesRepsService(dataSource.getRepository(SalesRep)),
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    await container?.stop();
  });

  beforeEach(async () => {
    data = await seedOrderData(dataSource);
  });

  const parse = (lines: { wineId: string; quantity: number }[]) =>
    orderRequestSchema.parse(validBody(data.customer.id, lines));
  const count = async () =>
    Number(
      (await dataSource.query('SELECT count(*) FROM order_request'))[0].count,
    );

  it('creates one row for many parallel saves with the same key', async () => {
    const key = randomUUID();
    const body = parse([{ wineId: data.plenty.id, quantity: 2 }]);

    const results = await Promise.all(
      Array.from({ length: 30 }, () => service.save(key, body)),
    );

    expect(results.filter((r) => !r.duplicate)).toHaveLength(1);
    expect(new Set(results.map((r) => r.id)).size).toBe(1);
    expect(await count()).toBe(1);
  });

  it('treats the same key in another letter case as the same key', async () => {
    const key = randomUUID();
    const body = parse([{ wineId: data.plenty.id, quantity: 2 }]);
    await service.save(key, body);
    const again = await service.save(key.toUpperCase(), body);
    expect(again.duplicate).toBe(true);
  });

  it('saves different keys in parallel as separate requests', async () => {
    const body = parse([{ wineId: data.plenty.id, quantity: 2 }]);
    await Promise.all(
      Array.from({ length: 10 }, () => service.save(randomUUID(), body)),
    );
    expect(await count()).toBe(10);
  });

  it('keeps the policy row from changing until a save transaction ends', async () => {
    let changed = false;
    await dataSource.transaction(async (manager) => {
      await policies.get(manager, 'pessimistic_read');
      const update = policies.set('flexible').then(() => {
        changed = true;
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(changed).toBe(false);
      // Another reader is not blocked by the share lock.
      expect((await policies.get()).policy).toBe('strict');
      // The update runs once this transaction commits.
      queueMicrotask(() => void update);
    });
    await vi.waitFor(() => expect(changed).toBe(true));
    expect((await policies.get()).policy).toBe('flexible');
  });

  it('lists and counts saved requests, newest first, each with its lines', async () => {
    expect(await service.list()).toEqual([]);
    expect(await service.count()).toEqual({ count: 0 });

    const lines = [
      { wineId: data.plenty.id, quantity: 2 },
      { wineId: data.few.id, quantity: 1 },
    ];
    const saved = [];
    for (let i = 0; i < 5; i++)
      saved.push(await service.save(randomUUID(), parse(lines)));

    const list = await service.list();
    expect(list.map((r) => r.id)).toEqual(saved.map((r) => r.id).reverse());
    expect(list.every((r) => r.lines.length === 2)).toBe(true);
    expect(await service.count()).toEqual({ count: 5 });
  });
});
