import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "../../../dist/apps/platform/windows/web"
  },
  cacheDir: "../../../dist/.cache/vite/platform-windows",
  plugins: [react()],
  server: {
    port: 7060,
    strictPort: true
  }
});
