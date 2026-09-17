import { config } from "dotenv";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

const port = Number(process.env.PLATFORM_WEB_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("Set PLATFORM_WEB_PORT in .env or apps/platform/web/.app.env.");
}

const host = process.env.PLATFORM_HOST?.trim();
if (!host) {
  throw new Error("Set PLATFORM_HOST in .env or apps/platform/web/.app.env.");
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host, port, strictPort: true },
  build: { outDir: "../../../dist/platform/web", emptyOutDir: true },
});
