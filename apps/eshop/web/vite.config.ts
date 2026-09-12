import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  cacheDir: '../../../node_modules/.cache/vite/eshop-web',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../../../dist/apps/eshop/web',
    emptyOutDir: true,
    chunkSizeWarningLimit: 400,
  },
  resolve: {
    alias: [
      {
        find: /^@codexsun\/ui$/,
        replacement: fileURLToPath(new URL('../../../packages/ui/src/index.ts', import.meta.url)),
      },
    ],
  },
  server: {
    host: process.env.ESHOP_WEB_HOST ?? '127.0.0.1',
    hmr: false,
    port: Number(process.env.ESHOP_WEB_PORT ?? 6100),
    strictPort: true,
    watch: null,
  },
})
