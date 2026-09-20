import { config } from "dotenv";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readDesktopRuntimeConfig } from "@codexsun/platform-core/runtime-config";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

const runtimeConfig = readDesktopRuntimeConfig(process.env);
const reactSourceFiles = /(?:apps[\\/]platform[\\/]desktop[\\/]src|packages[\\/]ui[\\/]src)[\\/].*\.[jt]sx?$/u;

export default defineConfig({
  cacheDir: "../../../dist/.vite/platform/desktop",
  plugins: [react({ include: reactSourceFiles }), tailwindcss()],
  resolve: {
    alias: { "@codexsun/contracts": resolve(import.meta.dirname, "../../../packages/contracts/src/index.ts") },
  },
  server: { host: runtimeConfig.PLATFORM_HOST, port: runtimeConfig.PLATFORM_DESKTOP_PORT, strictPort: true },
  build: { outDir: "../../../dist/platform/desktop/web", emptyOutDir: true },
});
