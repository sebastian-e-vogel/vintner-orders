import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from '../src/database/database.config.js';
import { seedDatabase } from '../src/database/seed/seed.js';

describe('development seed', () => {
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

  const snapshot = async () => ({
    counts: (
      await dataSource.query(`SELECT
        (SELECT count(*) FROM sales_rep)::int AS sales_reps,
        (SELECT count(*) FROM wine)::int AS wines,
        (SELECT count(*) FROM customer)::int AS customers,
        (SELECT count(*) FROM historical_order)::int AS orders,
        (SELECT count(*) FROM historical_order_item)::int AS lines,
        (SELECT count(*) FROM order_request)::int AS requests,
        (SELECT count(*) FROM settings)::int AS settings`)
    )[0],
    policy: (
      await dataSource.query(`SELECT inventory_policy FROM settings`)
    )[0],
    wines: await dataSource.query(`SELECT * FROM wine ORDER BY sku`),
    customers: await dataSource.query(`SELECT * FROM customer ORDER BY id`),
    orders: await dataSource.query(
      `SELECT o.id, o.customer_id, o.ordered_at, i.id AS item_id, i.wine_id, i.quantity
       FROM historical_order o JOIN historical_order_item i ON i.order_id = o.id
       ORDER BY o.id, i.id`,
    ),
  });

  it('gives identical data when run twice, and clears other app data first', async () => {
    const summary = await seedDatabase(dataSource);
    const first = await snapshot();

    await dataSource.query(
      `INSERT INTO customer (name, contact_name, email, phone) VALUES ('Extra', 'X', 'x@x.example', '1')`,
    );
    expect(await seedDatabase(dataSource)).toEqual(summary);
    const second = await snapshot();

    expect(second).toEqual(first);
    expect(first.counts).toEqual({
      sales_reps: 1,
      wines: 18,
      customers: 4,
      orders: 6,
      lines: summary.orderLines,
      requests: 0,
      settings: 1,
    });
    expect(first.policy.inventory_policy).toBe('strict');
    expect(
      first.wines.filter((w: any) => w.available === 0).length,
    ).toBeGreaterThan(0);
    expect(
      new Set(first.orders.map((o: any) => o.customer_id)).size,
    ).toBeGreaterThanOrEqual(2);
    expect(first.orders[0].ordered_at.toISOString()).toBe(
      '2026-01-12T10:15:00.000Z',
    );
  });

  it('refuses to run when NODE_ENV is production and leaves data alone', async () => {
    await seedDatabase(dataSource);
    const before = await snapshot();
    vi.stubEnv('NODE_ENV', 'production');
    try {
      await expect(seedDatabase(dataSource)).rejects.toThrow(/production/);
    } finally {
      vi.unstubAllEnvs();
    }
    expect(await snapshot()).toEqual(before);
  });
});
