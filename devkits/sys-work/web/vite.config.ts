import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

const root = fileURLToPath(new URL("../../..", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "");
  const webPort = Number(
    process.env.CODEXSUN_SYS_WORK_WEB_PORT ?? env.CODEXSUN_SYS_WORK_WEB_PORT ?? 7060
  );
  const apiPort = Number(
    process.env.CODEXSUN_SYS_WORK_API_PORT ?? env.CODEXSUN_SYS_WORK_API_PORT ?? 7061
  );
  return {
    plugins: [tailwindcss(), react()],
    cacheDir: resolve(root, "dist/.cache/vite/sys-work"),
    build: { outDir: resolve(root, "dist/devkits/sys-work/web"), emptyOutDir: true },
    server: {
      host: "127.0.0.1",
      port: webPort,
      strictPort: true,
      proxy: { "/api": { target: `http://127.0.0.1:${apiPort}`, changeOrigin: false } }
    }
  };
});
