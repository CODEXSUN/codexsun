import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string }

export default defineConfig({
  cacheDir: '../../../node_modules/.cache/vite/zetro-web',
  define: {
    'import.meta.env.VITE_ZETRO_BUILD_VERSION': JSON.stringify(packageJson.version),
  },
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
              name: 'react-runtime',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            },
            {
              name: 'base-ui',
              test: /node_modules[\\/]@base-ui[\\/]/,
            },
            {
              name: 'motion',
              test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/,
            },
            {
              name: 'icons',
              test: /node_modules[\\/](lucide-react|@tabler)[\\/]/,
            },
            {
              name: 'validation',
              test: /node_modules[\\/]zod[\\/]/,
            },
            {
              name: 'tauri',
              test: /node_modules[\\/]@tauri-apps[\\/]/,
            },
          ],
        },
      },
    },
  },
})
