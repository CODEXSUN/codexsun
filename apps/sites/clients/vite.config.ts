import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";

const webDirectory = import.meta.dirname;
const repositoryDirectory = resolve(webDirectory, "../../..");

const surfaces = {
  logicx: {
    defaultPort: 7131,
    entry: "src/clients/logicx/site.tsx",
    envKey: "CODEXSUN_SITES_LOGICX_PORT"
  },
  ramutex: {
    defaultPort: 7132,
    entry: "src/clients/ramutex/site.tsx",
    envKey: "CODEXSUN_SITES_RAMUTEX_PORT"
  }
} as const;

type SurfaceId = keyof typeof surfaces;

export default defineConfig(({ command, mode }) => {
  const surfaceId = resolveSurfaceId(mode);
  const surface = surfaces[surfaceId];
  const runtimeEnv = { ...loadEnv(mode, repositoryDirectory, ""), ...process.env };
  const clientSlug = mode === "portfolio" ? runtimeEnv.CODEXSUN_SITES_CLIENT_SLUG : surfaceId;
  if (!clientSlug || !/^[a-z0-9][a-z0-9_-]{0,119}$/.test(clientSlug))
    throw new Error("A valid client slug is required.");
  const port = Number(
    mode === "portfolio"
      ? runtimeEnv.CODEXSUN_SITES_CLIENT_PORT || 7133
      : runtimeEnv[surface.envKey] || surface.defaultPort
  );

  return {
    define: { "import.meta.env.CODEXSUN_SITES_CLIENT_SLUG": JSON.stringify(clientSlug) },
    appType: "spa",
    build: {
      chunkSizeWarningLimit: 1200,
      emptyOutDir: true,
      outDir: resolve(repositoryDirectory, "dist/apps/sites/clients", clientSlug),
      reportCompressedSize: false
    },
    cacheDir: resolve(repositoryDirectory, "dist/.cache/vite", `sites-client-${clientSlug}`),
    envDir: repositoryDirectory,
    plugins: [
      tailwindcss(),
      react(),
      {
        name: "codexsun-sites-client-identity",
        configureServer(server) {
          server.middlewares.use("/__codexsun_sites_identity", (_request, response) => {
            response.setHeader("Content-Type", "application/json");
            response.setHeader("Cache-Control", "no-store");
            response.end(JSON.stringify({ client: clientSlug }));
          });
        }
      }
    ],
    resolve: {
      alias: {
        "@sites-client-entry": resolve(
          webDirectory,
          mode === "portfolio" ? "src/clients/standard/site.tsx" : surface.entry
        )
      },
      dedupe: ["react", "react-dom"]
    },
    root: webDirectory,
    ...(command === "serve"
      ? {
          server: {
            proxy: {
              "/__sites-content": {
                target:
                  runtimeEnv.CODEXSUN_SITES_CONTENT_API_ORIGIN ||
                  `http://127.0.0.1:${runtimeEnv.PLATFORM_API_PORT || "7010"}`,
                changeOrigin: true,
                rewrite: () => `/sites/public/${clientSlug}`
              }
            },
            host: "127.0.0.1",
            port,
            strictPort: true
          }
        }
      : {})
  };
});

function resolveSurfaceId(mode: string): SurfaceId {
  if (mode === "portfolio") return "ramutex";
  if (mode === "development" || mode === "production" || mode === "ramutex") return "ramutex";
  if (mode in surfaces) return mode as SurfaceId;
  throw new Error(`Unknown Sites client surface: ${mode}`);
}
