import { resolve } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import type { DatabaseEnv } from './database.env.js';
import * as entities from './entities/index.js';

export const createDataSourceOptions = (
  env: DatabaseEnv,
): DataSourceOptions => ({
  type: 'postgres',
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  entities: Object.values(entities),
  migrations: [resolve(import.meta.dirname, 'migrations/*.{ts,js}')],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  migrationsRun: false,
});
