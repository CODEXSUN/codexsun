import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  cacheDir: '../../../node_modules/.cache/vite/docs-web',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../../../dist/apps/docs/web',
    emptyOutDir: true,
    chunkSizeWarningLimit: 400,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name(moduleId) {
                const packagePath = moduleId.match(
                  /node_modules[\\/]((?:@[^\\/]+[\\/])?[^\\/]+)/,
                )?.[1]
                return packagePath
                  ? `vendor-${packagePath.replaceAll('/', '-').replaceAll('\\', '-')}`
                  : null
              },
              test: /node_modules/,
              maxSize: 360_000,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/` },
      {
        find: /^@codexsun\/docs-contracts$/,
        replacement: fileURLToPath(new URL('../contracts/src/index.ts', import.meta.url)),
      },
      {
        find: /^@codexsun\/ui$/,
        replacement: fileURLToPath(new URL('../../../packages/ui/src/index.ts', import.meta.url)),
      },
    ],
  },
  server: {
    host: process.env.DOCS_WEB_HOST ?? '127.0.0.1',
    hmr: false,
    port: Number(process.env.DOCS_WEB_PORT ?? 6040),
    strictPort: true,
    watch: null,
  },
})
