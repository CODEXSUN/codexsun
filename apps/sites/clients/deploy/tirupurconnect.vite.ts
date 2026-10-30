import { textilePublicationPlugin } from "./tirupurconnect.content.js";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import type { UserConfig } from "vite";
import { publicMetadataPlugin } from "./tirupurconnect.metadata.js";
export function tirupurconnectConfig(
  root: string,
  env: Record<string, string | undefined>,
  command: string
): UserConfig {
  const port = Number(
    env.CODEXSUN_SITES_TIRUPURCONNECT_PORT ?? env.CODEXSUN_TCONNECT_WEB_PORT ?? 7040
  );
  const output = resolve(root, "dist/apps/sites/clients/tirupurconnect");
  return {
    root: resolve(root, "apps/sites/clients/src/clients/tirupurconnect"),
    publicDir: resolve(root, "apps/sites/clients/public/tirupurconnect"),
    envDir: root,
    cacheDir: resolve(root, "dist/.cache/vite/sites-client-tirupurconnect"),
    define: {
      __CODEXSUN_PLATFORM_WEB_ORIGIN__: JSON.stringify("https://codexsun.com"),
      __CODEXSUN_PLATFORM_WEB_PORT__: JSON.stringify(Number(env.PLATFORM_WEB_PORT ?? 7020)),
      __CODEXSUN_TCONNECT_CORPORATE_ID__: JSON.stringify("TIRUPURCONNECT"),
      __CODEXSUN_TCONNECT_PUBLIC_REMOTE__: "true"
    },
    plugins: [
      react(),
      textilePublicationPlugin(env.CODEXSUN_SITES_TIRUPURCONNECT_SNAPSHOT, command),
      publicMetadataPlugin(
        "https://tirupurconnect.com/api/platform",
        output,
        command === "serve",
        "tirupurconnect.com"
      ),
      {
        name: "sites-tirupurconnect-identity",
        configureServer(server) {
          server.middlewares.use("/__codexsun_sites_identity", (_request, response) => {
            response.setHeader("Content-Type", "application/json");
            response.end(
              JSON.stringify({
                client: "tirupurconnect",
                ...(env.CODEXSUN_SITES_RUNTIME_KEY
                  ? { runtimeKey: env.CODEXSUN_SITES_RUNTIME_KEY }
                  : {})
              })
            );
          });
        }
      }
    ],
    build: { outDir: output, emptyOutDir: true },
    server: {
      host: "127.0.0.1",
      port,
      strictPort: true,
      proxy: {
        "/__sites-content": {
          target:
            env.CODEXSUN_SITES_CONTENT_API_ORIGIN ||
            `http://127.0.0.1:${env.PLATFORM_API_PORT || "7010"}`,
          changeOrigin: true,
          rewrite: () => "/sites/public/tirupurconnect"
        },
        "/api/platform": {
          target: "https://tirupurconnect.com",
          changeOrigin: true,
          configure(proxy) {
            proxy.on("proxyReq", (outgoing, request) => {
              if (
                /^((127\.0\.0\.1)|localhost):\d+$/.test(request.headers.host ?? "") &&
                request.headers.origin === `http://${request.headers.host}`
              )
                outgoing.setHeader("Origin", "https://tirupurconnect.com");
            });
          }
        }
      }
    },
    resolve: { dedupe: ["react", "react-dom"] }
  };
}
