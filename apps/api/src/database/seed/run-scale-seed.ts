import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from '../database.config.js';
import { envFilePath, validateEnv } from '../database.env.js';
import {
  countRows,
  createPerfDatabaseIfMissing,
  DEFAULT_PERF_DB,
  seedScale,
} from './scale-seed.js';

// Entry point for `pnpm db:seed:scale`. Real environment variables win over .env.
if (existsSync(envFilePath)) process.loadEnvFile(envFilePath);

let dataSource: DataSource | undefined;

try {
  const env = validateEnv(process.env);
  const perfDb = process.env.POSTGRES_PERF_DB || DEFAULT_PERF_DB;
  const started = Date.now();
  await createPerfDatabaseIfMissing(env, perfDb);
  dataSource = new DataSource(
    createDataSourceOptions({ ...env, POSTGRES_DB: perfDb }),
  );
  await dataSource.initialize();
  await dataSource.runMigrations();
  await seedScale(dataSource);
  const counts = await countRows(dataSource);
  console.log(`Seeded database "${perfDb}":`);
  for (const [table, n] of Object.entries(counts)) {
    console.log(`  ${table}: ${n}`);
  }
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)} s.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (dataSource?.isInitialized) await dataSource.destroy();
}
