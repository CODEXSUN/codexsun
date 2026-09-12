import { defineConfig } from 'vite'
import { copyFileSync, createReadStream, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string }

function localMermaidAsset(): Plugin {
  const source = fileURLToPath(new URL('../../../node_modules/mermaid/dist/mermaid.min.js', import.meta.url))
  const assetPath = '/vendor/mermaid.min.js'

  return {
    name: 'zetro-local-mermaid-asset',
    configureServer(server) {
      server.middlewares.use(assetPath, (_request, response) => {
        response.setHeader('Content-Type', 'text/javascript; charset=utf-8')
        createReadStream(source).pipe(response)
      })
    },
    closeBundle() {
      const targetDirectory = resolve(fileURLToPath(new URL('../../../dist/apps/zetro/web/vendor', import.meta.url)))
      if (!existsSync(targetDirectory)) mkdirSync(targetDirectory, { recursive: true })
      copyFileSync(source, resolve(targetDirectory, 'mermaid.min.js'))
    },
  }
}

export default defineConfig({
  cacheDir: '../../../node_modules/.cache/vite/zetro-web',
  define: {
    'import.meta.env.VITE_ZETRO_BUILD_VERSION': JSON.stringify(packageJson.version),
  },
  plugins: [react(), tailwindcss(), localMermaidAsset()],
  resolve: {
    alias: [
      {
        find: /^@codexsun\/zetro-contracts$/,
        replacement: fileURLToPath(new URL('../contracts/src/index.ts', import.meta.url)),
      },
    ],
  },
  server: {
    host: process.env.ZETRO_WEB_HOST ?? '127.0.0.1',
    port: Number(process.env.ZETRO_WEB_PORT ?? 6060),
    strictPort: true,
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
          ],
        },
      },
    },
  },
})
