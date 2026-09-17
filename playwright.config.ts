import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_PLATFORM_URL;
if (!baseURL) throw new Error("Set PLAYWRIGHT_PLATFORM_URL before running Playwright checks.");

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL, trace: "retain-on-failure" },
  reporter: "list",
});
