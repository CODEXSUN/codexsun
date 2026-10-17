import { publicMetadataPlugin } from "./seo.plugin.js";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("../../..", import.meta.url));
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "");
  const port = Number(
    process.env.CODEXSUN_TCONNECT_WEB_PORT ?? env.CODEXSUN_TCONNECT_WEB_PORT ?? 7040
  );
  const apiPort = Number(process.env.PLATFORM_API_PORT ?? env.PLATFORM_API_PORT);
  return {
    plugins: [
      react(),
      publicMetadataPlugin(
        process.env.CODEXSUN_TCONNECT_BUILD_API_ORIGIN ??
          env.CODEXSUN_TCONNECT_BUILD_API_ORIGIN ??
          `http://127.0.0.1:${apiPort}`,
        resolve(root, "dist/apps/tconnect/web"),
        mode !== "production",
        process.env.CODEXSUN_TCONNECT_BUILD_HOST ??
          env.CODEXSUN_TCONNECT_BUILD_HOST ??
          (env.NODE_ENV === "development" ? `127.0.0.1:${port}` : "tirupurconnect.com")
      )
    ],
    define: {
      __CODEXSUN_TCONNECT_CORPORATE_ID__: JSON.stringify(
        process.env.CODEXSUN_TCONNECT_CORPORATE_ID ??
          env.CODEXSUN_TCONNECT_CORPORATE_ID ??
          (mode === "production" ? "TIRUPURCONNECT" : "")
      ),
      __CODEXSUN_PLATFORM_WEB_ORIGIN__: JSON.stringify(env.PLATFORM_WEB_ORIGIN),
      __CODEXSUN_PLATFORM_WEB_PORT__: JSON.stringify(Number(env.PLATFORM_WEB_PORT))
    },
    envDir: root,
    cacheDir: resolve(root, "dist/.cache/vite/tconnect"),
    build: { outDir: resolve(root, "dist/apps/tconnect/web"), emptyOutDir: true },
    server: {
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
  };
});
