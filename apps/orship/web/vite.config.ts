import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  cacheDir: '../../../node_modules/.cache/vite/orship-web',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^@codexsun\/orship-contracts$/,
        replacement: fileURLToPath(new URL('../contracts/src/index.ts', import.meta.url)),
      },
      {
        find: /^@codexsun\/ui$/,
        replacement: fileURLToPath(new URL('../../../packages/ui/src/index.ts', import.meta.url)),
      },
    ],
  },
  server: {
    host: process.env.ORSHIP_WEB_HOST ?? '127.0.0.1',
    port: Number(process.env.ORSHIP_WEB_PORT ?? 6091),
    strictPort: true,
  },
  build: {
    outDir: '../../../dist/apps/orship/web',
    emptyOutDir: true,
    chunkSizeWarningLimit: 400,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'vendor', test: /node_modules/, maxSize: 400_000 }],
        },
      },
    },
  },
})
