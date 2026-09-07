import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    globals: true,
    // jsdom a11y tests opt in via `/** @vitest-environment jsdom */` per file.
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
