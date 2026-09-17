import { config } from "dotenv";
import { resolve } from "node:path";
import { readZetroWebRuntimeConfig } from "@codexsun/platform-core/runtime-config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

const runtimeConfig = readZetroWebRuntimeConfig(process.env);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: runtimeConfig.PLATFORM_HOST,
    port: runtimeConfig.ZETRO_WEB_PORT,
    strictPort: true,
    proxy: { "/api": runtimeConfig.VITE_ZETRO_API_URL },
  },
  build: { outDir: "../../../dist/zetro/web", emptyOutDir: true },
});
