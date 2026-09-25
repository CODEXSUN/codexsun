import { defineConfig } from "@playwright/test";

const apiPort = 6230;
const webPort = 6231;
const tmp = "C:/Users/sunda/AppData/Local/Temp/opencode/qcafe-e2e";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm.cmd exec -- tsx src/server.ts",
      cwd: "../api",
      env: {
        APP_MODE: "development",
        PATH: process.env.PATH ?? "",
        PLATFORM_HOST: "127.0.0.1",
        QCAFE_API_PORT: String(apiPort),
        QCAFE_IDENTITY_DATABASE_PATH: `${tmp}/qcafe-e2e-identity.sqlite`,
        QCAFE_SQLITE_PATH: `${tmp}/qcafe-e2e.sqlite`,
        QCAFE_STORAGE_ROOT: `${tmp}/storage`,
      },
      reuseExistingServer: false,
      stderr: "pipe",
      stdout: "pipe",
      timeout: 120_000,
      url: `http://127.0.0.1:${apiPort}/api/v1/qcafe/health`,
    },
    {
      command: "npm.cmd run dev -- --port 6231 --strictPort",
      env: {
        PATH: process.env.PATH ?? "",
        PLATFORM_HOST: "127.0.0.1",
        QCAFE_WEB_PORT: String(webPort),
        VITE_QCAFE_API_URL: `http://127.0.0.1:${apiPort}`,
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: `http://127.0.0.1:${webPort}/`,
    },
  ],
});
