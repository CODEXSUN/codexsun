import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { loadComponentEnvironment, readRequiredHost, readRequiredPort } from "../../../tools/vite-environment.mjs";

const projectRoot = fileURLToPath(new URL("../../../", import.meta.url));

export default defineConfig(() => {
  const environment = loadComponentEnvironment(projectRoot, "apps/uiux/web/.app.env");
  const webHost = readRequiredHost(environment, "WEB_HOST");
  const webPort = readRequiredPort(environment, "WEB_PORT");

  return {
    cacheDir: "../../../node_modules/.cache/vite/uiux-web",
    envDir: projectRoot,
    plugins: [react(), tailwindcss()],
    server: { host: webHost, port: webPort, strictPort: true },
    preview: { host: webHost, port: webPort, strictPort: true },
    build: {
      outDir: "../../../dist/apps/uiux/web",
      emptyOutDir: true,
      chunkSizeWarningLimit: 400,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [{ name: "vendor", test: /node_modules/, maxSize: 400_000 }],
          },
        },
      },
    },
    resolve: {
      alias: [
        { find: /^@\//, replacement: `${fileURLToPath(new URL("./src", import.meta.url))}/` },
        {
          find: /^@codexsun\/ui$/,
          replacement: fileURLToPath(new URL("../../../packages/ui/src/index.ts", import.meta.url)),
        },
      ],
    },
  };
});
