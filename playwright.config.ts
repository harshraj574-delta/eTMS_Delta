import { defineConfig } from '@playwright/test';

/**
 * Playwright config for eTMS demo recordings.
 * Run:  npx playwright test manageRouteDemo.spec.ts
 *
 * Videos are saved under ./videos/<test-name>/
 */
export default defineConfig({
  testDir: '.',
  testMatch: '**/manageRouteDemo.spec.ts',

  // All test artefacts (videos, screenshots, traces) go here
  outputDir: './videos',

  // Don't run tests in parallel — this is a sequential, headed demo
  fullyParallel: false,
  workers: 1,

  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:5173',

    // ── Browser launch options ──────────────────────────────────────────────
    headless: false, // Headed mode for recorded demo
    launchOptions: {
      slowMo: 800, // 800 ms delay between each action — smooth enterprise-demo pace
    },

    // ── Viewport ────────────────────────────────────────────────────────────
    viewport: { width: 1440, height: 900 },

    // ── Video recording ─────────────────────────────────────────────────────
    video: {
      mode: 'on',
      size: { width: 1440, height: 900 },
    },

    // ── Timeouts ────────────────────────────────────────────────────────────
    actionTimeout:     30_000,
    navigationTimeout: 30_000,

    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium-demo',
      use: {
        browserName: 'chromium',
      },
    },
  ],
});
