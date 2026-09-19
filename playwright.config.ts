import { defineConfig } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_PLATFORM_URL;
const baseURL = externalBaseUrl ?? "http://127.0.0.1:6101";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL, trace: "retain-on-failure" },
  reporter: "list",
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm.cmd run dev --workspace @codexsun/platform-web",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
