import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'ai',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
});
