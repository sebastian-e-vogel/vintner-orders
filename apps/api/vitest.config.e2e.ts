import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/e2e-global-setup.ts'],
    // Pulling the image on the first run can take a while.
    hookTimeout: 120_000,
  },
});
