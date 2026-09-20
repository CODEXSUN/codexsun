import { config } from "dotenv";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

const reactSourceFiles = /(?:apps[\\/]himsx[\\/]web[\\/]src|packages[\\/]ui[\\/]src)[\\/].*\.[jt]sx?$/u;

export default defineConfig({
  cacheDir: "../../../dist/.vite/apps/himsx/web",
  plugins: [react({ include: reactSourceFiles }), tailwindcss()],
  server: {
    host: process.env.PLATFORM_HOST ?? "127.0.0.1",
    port: Number(process.env.HIMSX_WEB_PORT ?? 6241),
    proxy: { "/api": process.env.VITE_HIMSX_API_URL ?? "http://127.0.0.1:6240" },
    strictPort: true,
  },
  build: { outDir: "../../../dist/apps/himsx/web", emptyOutDir: true },
});
