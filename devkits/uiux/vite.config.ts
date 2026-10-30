import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig(({ mode }) => ({
  build: {
    emptyOutDir: true,
    outDir: "../../dist/devkits/uiux"
  },
  cacheDir: "../../dist/.cache/vite/uiux",
  plugins: [tailwindcss(), react()],
  server: {
    host: "127.0.0.1",
    port: Number(process.env.CODEXSUN_UIUX_WEB_PORT ?? loadEnv(mode, root, "").CODEXSUN_UIUX_WEB_PORT),
    strictPort: true
  }
}));
