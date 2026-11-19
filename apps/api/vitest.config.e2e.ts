import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/e2e-global-setup.ts'],
    // Test files share one database and reset its tables, so they run one at a time.
    fileParallelism: false,
    // Pulling the image on the first run can take a while.
    hookTimeout: 120_000,
  },
});
