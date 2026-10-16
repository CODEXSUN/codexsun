import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";

const root = fileURLToPath(new URL("../../..", import.meta.url));

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, root, "");
  const port = Number(
    process.env.CODEXSUN_PROJECT_MANAGER_WEB_PORT ?? env.CODEXSUN_PROJECT_MANAGER_WEB_PORT
  );
  const apiPort = Number(process.env.PLATFORM_API_PORT ?? env.PLATFORM_API_PORT);
  if (command === "serve" && (!Number.isInteger(port) || port < 1 || port > 65535))
    throw new Error("CODEXSUN_PROJECT_MANAGER_WEB_PORT is required");
  if (command === "serve" && (!Number.isInteger(apiPort) || apiPort < 1 || apiPort > 65535))
    throw new Error("PLATFORM_API_PORT is required");
  return {
    plugins: [tailwindcss(), react()],
    envDir: root,
    cacheDir: resolve(root, "dist/.cache/vite/project-manager-web"),
    define: { __CODEXSUN_PLATFORM_WEB_PORT__: JSON.stringify(Number(env.PLATFORM_WEB_PORT)) },
    build: { outDir: resolve(root, "dist/devkits/project-manager/web"), emptyOutDir: true },
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
                rewrite: (path: string) => path.replace(/^\/api\/platform/u, "") || "/"
              },
              "/api/project-manager": {
                target: `http://127.0.0.1:${apiPort}`,
                changeOrigin: false,
                rewrite: (path: string) =>
                  `/project-manager${path.replace(/^\/api\/project-manager/u, "") || "/"}`
              }
            }
          }
        : undefined
  };
});
