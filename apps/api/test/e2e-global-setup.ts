import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from '../src/database/database.config.js';

// Runs once in the main process; test workers started afterwards inherit process.env.
export default async function setup() {
  const container = await new PostgreSqlContainer('postgres:18').start();
  try {
    const env = {
      POSTGRES_HOST: container.getHost(),
      POSTGRES_PORT: container.getPort(),
      POSTGRES_USER: container.getUsername(),
      POSTGRES_PASSWORD: container.getPassword(),
      POSTGRES_DB: container.getDatabase(),
    };
    const dataSource = new DataSource(createDataSourceOptions(env));
    await dataSource.initialize();
    try {
      await dataSource.runMigrations({ transaction: 'each' });
    } finally {
      await dataSource.destroy();
    }
    Object.assign(process.env, env, {
      POSTGRES_PORT: String(env.POSTGRES_PORT),
    });
  } catch (error) {
    await container.stop();
    throw error;
  }
  return async () => {
    await container.stop();
  };
}
