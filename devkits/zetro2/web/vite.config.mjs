import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const envPath = fileURLToPath(new URL("./.app.env", import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

export default defineConfig({
  cacheDir: "../../../dist/.vite/devkits/zetro2/web",
  server: {
    allowedHosts: [".tmnext.in"],
    host: process.env.PLATFORM_HOST ?? "127.0.0.1",
    port: Number(process.env.ZETRO2_WEB_PORT ?? 6310),
    strictPort: true,
    proxy: { "/api": process.env.VITE_ZETRO2_API_URL ?? "http://127.0.0.1:6300" },
  },
  build: { outDir: "../../../dist/devkits/zetro2/web", emptyOutDir: true },
});
