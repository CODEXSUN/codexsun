import { config } from "dotenv";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

export default defineConfig({
  cacheDir: "../../../dist/.vite/apps/orship/web",
  plugins: [react(), tailwindcss()],
  server: {
    host: process.env.PLATFORM_HOST ?? "127.0.0.1",
    port: Number(process.env.ORSHIP_WEB_PORT ?? 6301),
    proxy: { "/api": process.env.VITE_ORSHIP_API_URL ?? "http://127.0.0.1:6300" },
    strictPort: true,
  },
  build: { outDir: "../../../dist/apps/orship/web", emptyOutDir: true },
});
