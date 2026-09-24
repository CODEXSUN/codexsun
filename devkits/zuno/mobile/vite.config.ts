import { config } from "dotenv";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

export default defineConfig({
  cacheDir: "../../../dist/.vite/devkits/zuno/mobile",
  plugins: [react()],
  server: { allowedHosts: [".tmnext.in"],  host: process.env.PLATFORM_HOST ?? "127.0.0.1", port: Number(process.env.ZUNO_MOBILE_PORT ?? 6414), strictPort: true },
  build: { outDir: "../../../dist/devkits/zuno/mobile/web", emptyOutDir: true },
});
