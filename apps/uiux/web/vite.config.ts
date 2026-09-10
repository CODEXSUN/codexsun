import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

const projectRoot = fileURLToPath(new URL('../../../', import.meta.url))

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, projectRoot, '')
  const webHost = environment.UIUX_WEB_HOST || '127.0.0.1'
  const webPort = Number(environment.UIUX_WEB_PORT || 6130)

  return {
    cacheDir: '../../../node_modules/.cache/vite/uiux-web',
    envDir: projectRoot,
    plugins: [react(), tailwindcss()],
    server: { host: webHost, port: webPort, strictPort: true },
    preview: { host: webHost, port: webPort, strictPort: true },
    build: {
      outDir: '../../../dist/apps/uiux/web',
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
    resolve: {
      alias: [
        { find: /^@\//, replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/` },
        {
          find: /^@codexsun\/ui$/,
          replacement: fileURLToPath(new URL('../../../packages/ui/src/index.ts', import.meta.url)),
        },
      ],
    },
  }
})
