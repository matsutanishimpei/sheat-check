import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@my-app/shared': path.resolve(__dirname, './packages/shared/src/index.ts'),
    },
  },
});
