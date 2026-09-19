import { config } from "dotenv";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

if (!process.env.PLATFORM_MOBILE_API_URL) throw new Error("PLATFORM_MOBILE_API_URL is required.");

export default defineConfig({
  cacheDir: "../../../dist/.vite/platform/mobile",
  plugins: [react()],
  resolve: {
    alias: { "@codexsun/contracts": resolve(import.meta.dirname, "../../../packages/contracts/src/index.ts") },
  },
  build: { outDir: "../../../dist/platform/mobile/web", emptyOutDir: true },
});
