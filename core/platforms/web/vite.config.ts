import { config } from "dotenv";
import { resolve } from "node:path";
import { readWebRuntimeConfig } from "@codexsun/platform-core/runtime-config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

const runtimeConfig = readWebRuntimeConfig(process.env);
const reactSourceFiles = /(?:core[\\/]platforms[\\/]web[\\/]src|packages[\\/]ui[\\/]src)[\\/].*\.[jt]sx?$/u;

export default defineConfig({
  cacheDir: "../../../dist/.vite/platform/web",
  plugins: [react({ include: reactSourceFiles }), tailwindcss()],
  resolve: {
    alias: {
      "@codexsun/contracts": resolve(import.meta.dirname, "../../../packages/contracts/src/index.ts"),
    },
  },
  server: { host: runtimeConfig.PLATFORM_HOST, port: runtimeConfig.PLATFORM_WEB_PORT, strictPort: true },
  build: { outDir: "../../../dist/core/platforms/web", emptyOutDir: true },
});
