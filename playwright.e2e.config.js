import { defineConfig } from '@playwright/test';

/**
 * Headless end-to-end tests (npm run test:e2e). Separate from playwright.config.ts,
 * which records headed demo videos.
 *
 * Expects the dev server on E2E_BASE_URL (default http://localhost:5173).
 * The specs block every write endpoint, so they are safe against shared data.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  timeout: 90_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    headless: true,
    viewport: { width: 1600, height: 900 },
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
