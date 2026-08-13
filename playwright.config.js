const { defineConfig } = require('@playwright/test');

const port = Number(process.env.PLAYWRIGHT_PORT || 48733);
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL || `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/gameplay.spec.js',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['line'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL,
    browserName: 'chromium',
    serviceWorkers: 'block',
    colorScheme: 'dark',
    locale: 'fr-FR',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'desktop-chromium', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'portrait-chromium', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'landscape-chromium', use: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } }
  ],
  webServer: externalBaseURL ? undefined : {
    command: 'node tests/e2e/server.cjs',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
    env: { PLAYWRIGHT_PORT: String(port) }
  }
});
