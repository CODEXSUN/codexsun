import { config } from "dotenv";
import { resolve } from "node:path";
import { readZetroWebRuntimeConfig } from "@codexsun/platform-core/runtime-config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

const runtimeConfig = readZetroWebRuntimeConfig(process.env);
const reactSourceFiles = /(?:apps[\\/]zetro[\\/]web[\\/]src|packages[\\/]ui[\\/]src)[\\/].*\.[jt]sx?$/u;

export default defineConfig({
  cacheDir: "../../../dist/.vite/zetro/web",
  plugins: [react({ include: reactSourceFiles }), tailwindcss()],
  server: {
    host: runtimeConfig.PLATFORM_HOST,
    port: runtimeConfig.ZETRO_WEB_PORT,
    strictPort: true,
    proxy: { "/api": runtimeConfig.VITE_ZETRO_API_URL },
  },
  build: { outDir: "../../../dist/zetro/web", emptyOutDir: true },
});
