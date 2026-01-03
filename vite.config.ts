import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts', // I will create this file next
    css: true, // Enable CSS processing for tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
} as UserConfig);
