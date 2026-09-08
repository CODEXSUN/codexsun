import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const projectRoot = fileURLToPath(new URL('../../../', import.meta.url))

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, projectRoot, '')
  const webHost = environment.PLATFORM_WEB_HOST || '127.0.0.1'
  const webPort = Number(environment.PLATFORM_WEB_PORT || 6021)

  return {
    cacheDir: '../../../node_modules/.cache/vite/platform-web',
    envDir: projectRoot,
    plugins: [react(), tailwindcss()],
    server: {
      host: webHost,
      port: webPort,
      strictPort: true,
    },
    preview: {
      host: webHost,
      port: webPort,
      strictPort: true,
    },
    build: {
      outDir: '../../../dist/apps/platform/web',
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
    resolve: {
      alias: [
        {
          find: /^@\//,
          replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/`,
        },
        {
          find: /^@codexsun\/ui$/,
          replacement: fileURLToPath(new URL('../../../packages/ui/src/index.ts', import.meta.url)),
        },
        {
          find: /^@codexsun\/platform-core-web$/,
          replacement: fileURLToPath(
            new URL('../../../packages/platform-core/web/src/index.ts', import.meta.url),
          ),
        },
        {
          find: /^@codexsun\/platform-contracts$/,
          replacement: fileURLToPath(
            new URL(
              '../../../packages/platform-core/shared/contracts/src/index.ts',
              import.meta.url,
            ),
          ),
        },
      ],
    },
  }
})
