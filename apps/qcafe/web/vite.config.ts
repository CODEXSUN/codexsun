import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

const qCafeVersion = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../version.json"), "utf8")
).version;

export default defineConfig(({ command, mode }) => {
  const runtime = loadEnv(mode, resolve(import.meta.dirname, "../../.."), "");
  const apiPort = Number(runtime.CODEXSUN_QCAFE_API_PORT);
  const webPort = Number(runtime.CODEXSUN_QCAFE_WEB_PORT);
  if (command === "serve" && (!Number.isInteger(apiPort) || !Number.isInteger(webPort))) {
    throw new Error(
      "CODEXSUN_QCAFE_API_PORT and CODEXSUN_QCAFE_WEB_PORT must be set in the root environment."
    );
  }
  return {
    base: mode === "desktop" ? "/" : "/qcafe/",
    build: { outDir: "../../../dist/apps/qcafe/web", emptyOutDir: true },
    cacheDir: "../../../dist/.cache/vite/qcafe-web",
    define: { __QCAFE_VERSION__: JSON.stringify(qCafeVersion) },
    plugins: [react(), tailwind()],
    server:
      command === "serve"
        ? {
            host: "127.0.0.1",
            port: webPort,
            strictPort: true,
            proxy: { "/api/v1/qcafe": `http://127.0.0.1:${apiPort}` }
          }
        : undefined
  };
});
