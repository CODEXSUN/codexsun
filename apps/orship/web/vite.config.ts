import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  cacheDir: '../../../node_modules/.cache/vite/orship-web',
  envDir: '../../../',
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
    proxy: {
      '/api': {
        target: process.env.ORSHIP_API_PROXY_URL ?? 'http://127.0.0.1:6090',
      },
    },
    strictPort: true,
  },
  build: {
    outDir: '../../../dist/apps/orship/web',
    emptyOutDir: true,
    chunkSizeWarningLimit: 400,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules\/(react|react-dom|scheduler|use-sync-external-store)\//,
            },
            { name: 'query', test: /node_modules\/@tanstack\// },
            { name: 'icons', test: /node_modules\/lucide-react\// },
            { name: 'radix', test: /node_modules\/@radix-ui\// },
            { name: 'base-ui', test: /node_modules\/@base-ui\// },
            { name: 'mdi', test: /packages\/ui\/src\/layouts\/mdi-main\// },
            { name: 'topology', test: /packages\/ui\/src\/features\/interface-topology\// },
            { name: 'sidebar', test: /packages\/ui\/src\/components\/sidebar\// },
          ],
        },
      },
    },
  },
})
