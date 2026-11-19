import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from '../database.config.js';
import { envFilePath, validateEnv } from '../database.env.js';
import { seedDatabase } from './seed.js';

// Entry point for `pnpm db:seed`. Real environment variables win over .env.
if (existsSync(envFilePath)) process.loadEnvFile(envFilePath);

const dataSource = new DataSource(
  createDataSourceOptions(validateEnv(process.env)),
);

try {
  await dataSource.initialize();
  const c = await seedDatabase(dataSource);
  console.log(
    `Seeded ${c.salesReps} sales rep, ${c.wines} wines, ${c.customers} customers, ${c.orders} orders (${c.orderLines} lines), inventory policy strict.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (dataSource.isInitialized) await dataSource.destroy();
}
