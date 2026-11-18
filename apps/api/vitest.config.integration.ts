import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.integration-spec.ts'],
    // Pulling the image on the first run can take a while.
    hookTimeout: 120_000,
    testTimeout: 60_000,
  },
});
