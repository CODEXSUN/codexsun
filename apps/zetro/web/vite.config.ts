import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  cacheDir: '../../../node_modules/.cache/vite/zetro-web',
  plugins: [react(), tailwindcss()],
  server: {
    port: Number(process.env.ZETRO_WEB_PORT ?? 6060),
    proxy: {
      '/api': `http://127.0.0.1:${process.env.ZETRO_API_PORT ?? 6050}`,
      '/health': `http://127.0.0.1:${process.env.ZETRO_API_PORT ?? 6050}`,
    },
  },
  build: {
    outDir: '../../../dist/apps/zetro/web',
    emptyOutDir: true,
    chunkSizeWarningLimit: 400,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules/,
              maxSize: 400_000,
            },
          ],
        },
      },
    },
  },
})
