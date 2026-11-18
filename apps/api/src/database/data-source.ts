import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from './database.config.js';
import { envFilePath, validateEnv } from './database.env.js';

// Entry point for the TypeORM CLI. Real environment variables win over .env.
if (existsSync(envFilePath)) process.loadEnvFile(envFilePath);

export default new DataSource(
  createDataSourceOptions(validateEnv(process.env)),
);
