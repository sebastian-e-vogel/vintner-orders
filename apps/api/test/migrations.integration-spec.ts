import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from '../src/database/database.config.js';

describe('migrations', () => {
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
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    await container?.stop();
  });

  async function userTables(): Promise<string[]> {
    const rows: { table_name: string }[] = await dataSource.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name <> 'migrations'`,
    );
    return rows.map((row) => row.table_name);
  }

  it('applies every migration and reverts them one by one to an empty schema', async () => {
    const applied = await dataSource.runMigrations({ transaction: 'each' });
    expect(applied).toHaveLength(dataSource.migrations.length);
    expect(await dataSource.showMigrations()).toBe(false);

    for (let i = 0; i < applied.length; i++) {
      await dataSource.undoLastMigration({ transaction: 'each' });
    }

    expect(await userTables()).toEqual([]);
  });
  describe('wine region and size_ml', () => {
    const insertLegacy = (sku: string, format: string) =>
      dataSource.query(
        `INSERT INTO wine (name, producer, vintage, format, sku, available)
         VALUES ('Barolo', 'Conterno', 2019, $1, $2, 1)`,
        [format, sku],
      );

    async function revertToBeforeWineChange() {
      await dataSource.runMigrations({ transaction: 'each' });
      await dataSource.undoLastMigration({ transaction: 'each' }); // settings
      await dataSource.undoLastMigration({ transaction: 'each' }); // wine change
    }

    afterEach(async () => {
      await dataSource.dropDatabase();
    });

    it('converts format to size_ml, backfills region and reverts format', async () => {
      await revertToBeforeWineChange();
      await insertLegacy('a', '750 ml');
      await insertLegacy('b', '1.5 L');
      await insertLegacy('c', '375 ml');
      await insertLegacy('d', '500 ml');
      await insertLegacy('e', '75cl');

      await dataSource.runMigrations({ transaction: 'each' });
      const rows: { sku: string; size_ml: number; region: string }[] =
        await dataSource.query(
          'SELECT sku, size_ml, region FROM wine ORDER BY sku',
        );
      expect(rows).toEqual([
        { sku: 'a', size_ml: 750, region: 'Unknown' },
        { sku: 'b', size_ml: 1500, region: 'Unknown' },
        { sku: 'c', size_ml: 375, region: 'Unknown' },
        { sku: 'd', size_ml: 500, region: 'Unknown' },
        { sku: 'e', size_ml: 750, region: 'Unknown' },
      ]);

      await dataSource.undoLastMigration({ transaction: 'each' });
      await dataSource.undoLastMigration({ transaction: 'each' });
      const back: { sku: string; format: string }[] = await dataSource.query(
        'SELECT sku, format FROM wine ORDER BY sku',
      );
      expect(back.map((r) => r.format)).toEqual([
        '750 ml',
        '1.5 L',
        '375 ml',
        '500 ml',
        '750 ml',
      ]);
    });

    it('fails and changes nothing when a format cannot be parsed', async () => {
      await revertToBeforeWineChange();
      await insertLegacy('a', '750 ml');
      await insertLegacy('b', 'magnum');

      await expect(
        dataSource.runMigrations({ transaction: 'each' }),
      ).rejects.toThrow(/magnum/);

      const columns: { column_name: string }[] = await dataSource.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = 'wine' AND column_name IN ('format', 'size_ml', 'region')`,
      );
      expect(columns.map((c) => c.column_name)).toEqual(['format']);
    });
  });
});
