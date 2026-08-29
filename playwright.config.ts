import { defineConfig, devices } from '@playwright/test';

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  // The local suite exercises the same Rust server and real static 404 that
  // production uses; Vite's development fallback cannot cover that response.
  use: { baseURL: externalBaseURL ?? 'http://127.0.0.1:8080', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
  ],
  webServer: externalBaseURL
    ? undefined
    : { command: 'npm run build && cargo run', port: 8080, reuseExistingServer: true }
});
