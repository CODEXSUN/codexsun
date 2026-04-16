import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /storefront-performance\.spec\.ts/,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: [
    {
      command:
        'powershell -NoLogo -NoProfile -Command "npm.cmd run build; npm.cmd run db:prepare; npm.cmd run start"',
      url: "http://127.0.0.1:3000/health",
      reuseExistingServer: true,
      timeout: 240_000,
      env: {
        APP_HTTP_PORT: "3000",
        DB_DRIVER: "mariadb",
        DB_HOST: "127.0.0.1",
        DB_PORT: "3307",
        DB_NAME: "codexsun_db",
        DB_USER: "root",
        DB_PASSWORD: "DbPass1@@",
        PAYMENT_TEST: "true",
        RAZORPAY_ENABLED: "false",
      },
    },
    {
      command: "npm.cmd run preview -- --host 127.0.0.1 --port 4173",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        APP_HTTP_PORT: "3000",
        APP_PROXY_HOST: "127.0.0.1",
        FRONTEND_HTTP_PORT: "4173",
      },
    },
  ],
})
