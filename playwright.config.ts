import { defineConfig, devices } from '@playwright/test'

const port = 3400
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: [
      'env',
      'DB_HOST=127.0.0.1',
      'DB_PORT=1',
      'DB_USER=e2e',
      'DB_PASSWORD=e2e',
      'DB_NAME=e2e',
      'ADMIN_PASSWORD=e2e-admin-password',
      'ADMIN_SESSION_SECRET=e2e-session-secret-that-is-longer-than-32-bytes',
      `PUBLIC_SITE_URL=${baseURL}`,
      'NUXT_IGNORE_LOCK=1',
      'bun',
      'run',
      'dev',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
    ].join(' '),
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
