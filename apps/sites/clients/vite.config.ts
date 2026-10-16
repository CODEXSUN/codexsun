import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";

const webDirectory = import.meta.dirname;
const repositoryDirectory = resolve(webDirectory, "../../..");

const surfaces = {
  codexsun: {
    defaultPort: 7130,
    entry: "src/clients/codexsun/site.tsx",
    envKey: "CODEXSUN_SITES_CODEXSUN_PORT"
  },
  logicx: {
    defaultPort: 7131,
    entry: "src/clients/logicx/site.tsx",
    envKey: "CODEXSUN_SITES_LOGICX_PORT"
  },
  techmedia: {
    defaultPort: 7132,
    entry: "src/clients/techmedia/site.tsx",
    envKey: "CODEXSUN_SITES_TECHMEDIA_PORT"
  }
} as const;

type SurfaceId = keyof typeof surfaces;

export default defineConfig(({ command, mode }) => {
  const surfaceId = resolveSurfaceId(mode);
  const surface = surfaces[surfaceId];
  const runtimeEnv = { ...loadEnv(mode, repositoryDirectory, ""), ...process.env };
  const port = Number(runtimeEnv[surface.envKey] || surface.defaultPort);

  return {
    appType: "spa",
    build: {
      chunkSizeWarningLimit: 1200,
      emptyOutDir: true,
      outDir: resolve(repositoryDirectory, "dist/apps/sites/clients", surfaceId),
      reportCompressedSize: false
    },
    cacheDir: resolve(repositoryDirectory, "dist/.cache/vite", `sites-client-${surfaceId}`),
    envDir: repositoryDirectory,
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        "@sites-client-entry": resolve(webDirectory, surface.entry)
      },
      dedupe: ["react", "react-dom"]
    },
    root: webDirectory,
    ...(command === "serve"
      ? {
          server: {
            host: "127.0.0.1",
            port,
            strictPort: true
          }
        }
      : {})
  };
});

function resolveSurfaceId(mode: string): SurfaceId {
  if (mode === "development" || mode === "production" || mode === "codexsun") return "codexsun";
  if (mode in surfaces) return mode as SurfaceId;
  throw new Error(`Unknown Sites client surface: ${mode}`);
}
