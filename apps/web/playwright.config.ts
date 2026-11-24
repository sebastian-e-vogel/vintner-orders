import { defineConfig, devices } from '@playwright/test';

// Not the dev ports (3000/3001) and not the dev database: running e2e must never touch them.
const WEB_PORT = 3100;
const API_PORT = 3101;
const E2E_DATABASE = 'vintner_orders_e2e';

export default defineConfig({
  testDir: './e2e',
  // One shared database and one global policy, so specs run one at a time.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Build, migrate and seed on every run, so each run starts from the same data.
      command: [
        'pnpm --filter @vintner/api build',
        'pnpm --filter @vintner/api exec typeorm migration:run -d dist/database/data-source.js',
        'pnpm --filter @vintner/api exec node dist/database/seed/run-seed.js',
        'pnpm --filter @vintner/api start:prod',
      ].join(' && '),
      cwd: '../..',
      url: `http://localhost:${API_PORT}/health`,
      env: { PORT: String(API_PORT), POSTGRES_DB: E2E_DATABASE },
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: `pnpm build && pnpm exec next start -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_URL: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
});
