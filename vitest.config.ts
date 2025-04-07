import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    exclude: ['node_modules', '.nuxt', '.output', 'amplify', 'dashboard-example', '.amplify'],
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 60000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        '.nuxt/**',
        '.output/**',
        'amplify/**',
        '.amplify/**',
        'dashboard-example/**',
        '**/*.d.ts',
        'cypress/**',
        'cypress.config.js',
        'tests/**',
        'app.config.ts',
        'nuxt.config.ts',
        'eslint.config.mjs',
        'sentry.client.config.ts',
        'sentry.server.config.ts',
        'vitest.config.ts',
      ],
      // Include specific code sections that we want to measure coverage for
      include: [
        'stores/**',
        'components/**',
        'composables/**',
        'pages/**',
      ],
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname),
      '@': resolve(__dirname),
      '#app': resolve(__dirname, '.nuxt/app'),
      '#components': resolve(__dirname, '.nuxt/components'),
    },
  },
});
