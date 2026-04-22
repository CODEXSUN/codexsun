import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4174",
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
      command: "npm.cmd run db:prepare && npm.cmd run server:dev",
      url: "http://127.0.0.1:3100/health",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        APP_HTTP_PORT: "3100",
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
      command: "npx.cmd vite --host 127.0.0.1 --port 4174",
      url: "http://127.0.0.1:4174",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        APP_HTTP_PORT: "3100",
        APP_PROXY_HOST: "127.0.0.1",
        FRONTEND_HTTP_PORT: "4174",
      },
    },
  ],
})
