import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'engine',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
});
