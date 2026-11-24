import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from '../src/database/database.config.js';
import type { DatabaseEnv } from '../src/database/database.env.js';
import {
  createPerfDatabaseIfMissing,
  seedScale,
} from '../src/database/seed/scale-seed.js';
import { CURRENT_SALES_REP_ID } from '../src/sales-reps/current-sales-rep.js';

const tiny = {
  wines: 60,
  customers: 20,
  salesReps: 5,
  orders: 600,
  requests: 80,
};

describe('scale seed', () => {
  let container: StartedPostgreSqlContainer;
  let env: DatabaseEnv;
  let dataSource: DataSource;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18').start();
    env = {
      POSTGRES_HOST: container.getHost(),
      POSTGRES_PORT: container.getPort(),
      POSTGRES_USER: container.getUsername(),
      POSTGRES_PASSWORD: container.getPassword(),
      POSTGRES_DB: container.getDatabase(),
    };
    dataSource = new DataSource(createDataSourceOptions(env));
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    await container?.stop();
  });

  const snapshot = async () => {
    const tables = [
      'sales_rep',
      'customer',
      'wine',
      'historical_order',
      'historical_order_item',
      'order_request',
      'order_request_item',
    ];
    const data: Record<string, unknown[]> = {};
    for (const table of tables) {
      data[table] = await dataSource.query(
        `SELECT * FROM "${table}" ORDER BY 1`,
      );
    }
    // Settings keeps an updated_at timestamp, so only the policy is compared.
    data.settings = await dataSource.query(
      'SELECT inventory_policy FROM settings',
    );
    return data;
  };

  it('produces identical data for the same seed and different data for another', async () => {
    await seedScale(dataSource, { sizes: tiny, seed: 7 });
    const first = await snapshot();
    await seedScale(dataSource, { sizes: tiny, seed: 7 });
    expect(await snapshot()).toEqual(first);

    await seedScale(dataSource, { sizes: tiny, seed: 8 });
    expect(await snapshot()).not.toEqual(first);
  });

  it('fills every table with valid, consistent rows', async () => {
    await seedScale(dataSource, { sizes: tiny, seed: 7 });
    const count = async (sql: string) =>
      (await dataSource.query<{ n: number }[]>(sql))[0].n;

    expect(await count('SELECT count(*)::int n FROM sales_rep')).toBe(5);
    expect(await count('SELECT count(*)::int n FROM wine')).toBe(60);
    expect(await count('SELECT count(*)::int n FROM historical_order')).toBe(
      600,
    );
    expect(await count('SELECT count(*)::int n FROM order_request')).toBe(80);
    expect(await count('SELECT count(*)::int n FROM settings')).toBe(1);
    expect(
      await count(
        `SELECT count(*)::int n FROM sales_rep WHERE id = '${CURRENT_SALES_REP_ID}'`,
      ),
    ).toBe(1);
    // Every order and request has at least one line.
    expect(
      await count(
        `SELECT count(*)::int n FROM historical_order o WHERE NOT EXISTS (SELECT 1 FROM historical_order_item i WHERE i.order_id = o.id)`,
      ),
    ).toBe(0);
    expect(
      await count(
        `SELECT count(*)::int n FROM order_request r WHERE NOT EXISTS (SELECT 1 FROM order_request_item i WHERE i.request_id = r.id)`,
      ),
    ).toBe(0);
    // Strict requests never ask for more than was available.
    expect(
      await count(
        `SELECT count(*)::int n FROM order_request_item i JOIN order_request r ON r.id = i.request_id
         WHERE r.inventory_policy = 'strict' AND i.quantity > i.available_at_save`,
      ),
    ).toBe(0);
    expect(
      await count(
        `SELECT count(*)::int n FROM order_request WHERE inventory_policy = 'flexible'`,
      ),
    ).toBeGreaterThan(0);
  });

  it('skews wines, customers and reps', async () => {
    await seedScale(dataSource, { sizes: tiny, seed: 7 });
    const sorted = async (sql: string) =>
      (await dataSource.query<{ n: number }[]>(sql)).map((r) => r.n);

    const wines = await sorted(
      `SELECT count(i.id)::int n FROM wine w LEFT JOIN historical_order_item i ON i.wine_id = w.id GROUP BY w.id ORDER BY n DESC`,
    );
    expect(wines[0]).toBeGreaterThanOrEqual(
      5 * Math.max(wines[wines.length >> 1], 1),
    );

    const customers = await sorted(
      `SELECT count(o.id)::int n FROM customer c LEFT JOIN historical_order o ON o.customer_id = c.id GROUP BY c.id ORDER BY n DESC`,
    );
    expect(customers[0]).toBeGreaterThanOrEqual(
      2 * customers[customers.length >> 1],
    );

    const [current] = await dataSource.query<{ share: string }[]>(
      `SELECT avg((sales_rep_id = '${CURRENT_SALES_REP_ID}')::int) share FROM historical_order`,
    );
    expect(Number(current.share)).toBeGreaterThan(0.2);
    expect(Number(current.share)).toBeLessThan(0.3);
  });

  it('refuses to run in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    try {
      await expect(seedScale(dataSource, { sizes: tiny })).rejects.toThrow(
        'NODE_ENV is production',
      );
      await expect(createPerfDatabaseIfMissing(env, 'perf_x')).rejects.toThrow(
        'NODE_ENV is production',
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });

  describe('createPerfDatabaseIfMissing', () => {
    const exists = async (name: string) =>
      (
        await dataSource.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [
          name,
        ])
      ).length === 1;

    it('creates the database once and accepts an existing one', async () => {
      expect(await exists('perf_created')).toBe(false);
      await createPerfDatabaseIfMissing(env, 'perf_created');
      expect(await exists('perf_created')).toBe(true);
      await createPerfDatabaseIfMissing(env, 'perf_created');
    });

    it('rejects the dev database and unsafe names', async () => {
      await expect(
        createPerfDatabaseIfMissing(env, env.POSTGRES_DB),
      ).rejects.toThrow('must not be the dev database');
      await expect(
        createPerfDatabaseIfMissing(env, 'x"; DROP DATABASE test; --'),
      ).rejects.toThrow('Invalid perf database name');
    });
  });
});
