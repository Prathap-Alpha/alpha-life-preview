import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests',
  timeout: 60000,
  use: { baseURL: process.env.BASE_URL || 'http://localhost:8077' },
  webServer: process.env.BASE_URL ? undefined : { command: 'python -m http.server 8077', url: 'http://localhost:8077', reuseExistingServer: true },
});
