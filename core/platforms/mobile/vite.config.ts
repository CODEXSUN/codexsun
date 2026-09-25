import { config } from "dotenv";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

if (!process.env.PLATFORM_MOBILE_API_URL) throw new Error("PLATFORM_MOBILE_API_URL is required.");

const reactSourceFiles = /(?:apps[\\/]platform[\\/]mobile[\\/]src|packages[\\/]ui[\\/]src)[\\/].*\.[jt]sx?$/u;

export default defineConfig({
  server: {
    allowedHosts: [".tmnext.in"],
    host: process.env.PLATFORM_HOST ?? "127.0.0.1",
    port: Number(process.env.PLATFORM_MOBILE_PORT ?? 6104),
    strictPort: true,
  },
  cacheDir: "../../../dist/.vite/platform/mobile",
  plugins: [react({ include: reactSourceFiles })],
  resolve: {
    alias: { "@codexsun/contracts": resolve(import.meta.dirname, "../../../packages/contracts/src/index.ts") },
  },
  build: { outDir: "../../../dist/core/platforms/mobile/web", emptyOutDir: true },
});
