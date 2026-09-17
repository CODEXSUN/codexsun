import { config } from "dotenv";
import { resolve } from "node:path";
import { readUiuxWebRuntimeConfig } from "@codexsun/platform-core/runtime-config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

const runtimeConfig = readUiuxWebRuntimeConfig(process.env);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: runtimeConfig.PLATFORM_HOST, port: runtimeConfig.UIUX_WEB_PORT, strictPort: true },
  build: { outDir: "../../../dist/uiux/web", emptyOutDir: true },
});
