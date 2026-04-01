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
      command: "npm.cmd run db:prepare && npm.cmd run dev:server",
      url: "http://127.0.0.1:3000/health",
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        APP_HTTP_PORT: "3000",
        DB_DRIVER: "sqlite",
        SQLITE_FILE: "storage/playwright/codexsun.sqlite",
        OFFLINE_SUPPORT_ENABLED: "false",
      },
    },
    {
      command: "npx.cmd vite --host 127.0.0.1 --port 4173",
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
