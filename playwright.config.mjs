import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests',
  timeout: 60000,
  use: { baseURL: process.env.BASE_URL || 'http://localhost:8077/', launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} },
  webServer: process.env.BASE_URL ? undefined : { command: 'python -m http.server 8077', url: 'http://localhost:8077', reuseExistingServer: true },
});
