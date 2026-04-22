import path from "node:path"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  root: path.resolve(__dirname, "web"),
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 4174,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:4100",
      "/f": "http://127.0.0.1:4100",
      "/p": "http://127.0.0.1:4100",
      "/resize": "http://127.0.0.1:4100",
      "/crop": "http://127.0.0.1:4100",
      "/health": "http://127.0.0.1:4100",
    },
  },
  build: {
    outDir: path.resolve(__dirname, "..", "build", "cxmedia", "web"),
    emptyOutDir: true,
  },
})
