import { config } from "dotenv";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

const sourceFiles = /(?:apps[\\/]zuno[\\/]desktop[\\/]src|packages[\\/]ui[\\/]src)[\\/].*\.[jt]sx?$/u;

export default defineConfig({
  cacheDir: "../../../dist/.vite/apps/zuno/desktop",
  plugins: [react({ include: sourceFiles }), tailwindcss()],
  server: { host: process.env.PLATFORM_HOST ?? "127.0.0.1", port: Number(process.env.ZUNO_DESKTOP_PORT ?? 6413), strictPort: true },
  build: { outDir: "../../../dist/apps/zuno/desktop/web", emptyOutDir: true },
});
