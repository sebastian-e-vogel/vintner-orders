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
});
