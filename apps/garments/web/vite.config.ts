import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { loadComponentEnvironment, readRequiredHost, readRequiredPort } from "../../../tools/vite-environment.mjs";

const projectRoot = fileURLToPath(new URL("../../../", import.meta.url));

export default defineConfig(() => {
  const environment = loadComponentEnvironment(projectRoot, "apps/garments/web/.app.env");
  const webHost = readRequiredHost({ ...environment, WEB_HOST: environment.WEB_HOST ?? environment.PLATFORM_HOST }, "WEB_HOST");
  const webPort = readRequiredPort({ ...environment, WEB_PORT: environment.WEB_PORT ?? environment.GARMENTS_WEB_PORT }, "WEB_PORT");

  return {
    cacheDir: "../../../node_modules/.cache/vite/garments-web",
    plugins: [react(), tailwindcss()],
    build: {
      outDir: "../../../dist/apps/garments/web",
      emptyOutDir: true,
      chunkSizeWarningLimit: 400,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name(moduleId) {
                  const packagePath = moduleId.match(/node_modules[\\/]((?:@[^\\/]+[\\/])?[^\\/]+)/)?.[1];
                  return packagePath ? `vendor-${packagePath.replaceAll("/", "-").replaceAll("\\", "-")}` : null;
                },
                test: /node_modules/,
                maxSize: 360_000,
              },
            ],
          },
        },
      },
    },
    resolve: {
      alias: [
        { find: /^@\//, replacement: `${fileURLToPath(new URL("./src", import.meta.url))}/` },
        {
          find: /^@codexsun\/garments-contracts$/,
          replacement: fileURLToPath(new URL("../../../packages/garments-contracts/src/index.ts", import.meta.url)),
        },
        {
          find: /^@codexsun\/ui$/,
          replacement: fileURLToPath(new URL("../../../packages/ui/src/index.ts", import.meta.url)),
        },
      ],
    },
    server: {
      host: webHost,
      hmr: false,
      port: webPort,
      strictPort: true,
      watch: null,
    },
  };
});
