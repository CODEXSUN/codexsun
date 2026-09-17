import { config } from "dotenv";
import { resolve } from "node:path";
import { readWebRuntimeConfig } from "@codexsun/platform-core/runtime-config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

const runtimeConfig = readWebRuntimeConfig(process.env);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@codexsun/contracts": resolve(import.meta.dirname, "../../../packages/contracts/src/index.ts") },
  },
  server: { host: runtimeConfig.PLATFORM_HOST, port: runtimeConfig.PLATFORM_WEB_PORT, strictPort: true },
  build: { outDir: "../../../dist/platform/web", emptyOutDir: true },
});
