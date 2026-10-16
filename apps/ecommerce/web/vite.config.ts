import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("../../..", import.meta.url));
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, root, "");
  const port = Number(process.env.CODEXSUN_ECOMMERCE_WEB_PORT ?? env.CODEXSUN_ECOMMERCE_WEB_PORT);
  if (command === "serve" && (!Number.isInteger(port) || port < 1 || port > 65535))
    throw new Error("CODEXSUN_ECOMMERCE_WEB_PORT is required");
  const apiPort = Number(process.env.PLATFORM_API_PORT ?? env.PLATFORM_API_PORT);
  if (command === "serve" && (!Number.isInteger(apiPort) || apiPort < 1))
    throw new Error("PLATFORM_API_PORT is required");
  return {
    plugins: [react(), tailwindcss()],
    envDir: root,
    cacheDir: resolve(root, "dist/.cache/vite/ecommerce-web"),
    define: {
      __CODEXSUN_PLATFORM_WEB_PORT__: JSON.stringify(Number(env.PLATFORM_WEB_PORT))
    },
    build: { outDir: resolve(root, "dist/apps/ecommerce/web"), emptyOutDir: true },
    server:
      command === "serve"
        ? {
            host: "127.0.0.1",
            port,
            strictPort: true,
            proxy: {
              "/api/platform": {
                target: `http://127.0.0.1:${apiPort}`,
                changeOrigin: false,
                rewrite: (path) => path.replace(/^\/api\/platform/, "")
              }
            }
          }
        : undefined
  };
});
