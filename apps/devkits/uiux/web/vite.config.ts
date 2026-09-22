import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { loadComponentEnvironment, readRequiredHost, readRequiredPort } from "../../../tools/vite-environment.mjs";

const projectRoot = fileURLToPath(new URL("../../../", import.meta.url));
const reactSourceFiles = /(?:apps[\\/]uiux[\\/]web[\\/]src|packages[\\/]ui[\\/]src)[\\/].*\.[jt]sx?$/u;

function vendorChunk(id: string) {
  const packageMatch = id.replaceAll("\\", "/").match(/\/node_modules\/((?:@[^/]+\/)?[^/]+)/);
  if (!packageMatch) return undefined;

  return `vendor-${packageMatch[1].replace("@", "").replace("/", "-")}`;
}

export default defineConfig(() => {
  const environment = loadComponentEnvironment(projectRoot, "apps/devkits/uiux/web/.app.env");
  const webHost = readRequiredHost(environment, "WEB_HOST");
  const webPort = readRequiredPort(environment, "WEB_PORT");

  return {
    cacheDir: "../../../../../dist/.vite/apps/devkits/uiux/web",
    envDir: projectRoot,
    plugins: [react({ include: reactSourceFiles }), tailwindcss()],
    server: { host: webHost, port: webPort, strictPort: true },
    preview: { host: webHost, port: webPort, strictPort: true },
    build: {
      outDir: "../../../../../dist/apps/devkits/uiux/web",
      emptyOutDir: true,
      chunkSizeWarningLimit: 400,
      rollupOptions: {
        output: {
          manualChunks: vendorChunk,
        },
      },
    },
    resolve: {
      alias: [
        { find: /^@\//, replacement: `${fileURLToPath(new URL("./src", import.meta.url))}/` },
        {
          find: /^@codexsun\/ui$/,
          replacement: fileURLToPath(new URL("../../../../packages/ui/src/index.ts", import.meta.url)),
        },
      ],
    },
  };
});
