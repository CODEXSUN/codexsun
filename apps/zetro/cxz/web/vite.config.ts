import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  cacheDir: fileURLToPath(
    new URL('../../../../node_modules/.cache/vite/zetro-cxz', import.meta.url),
  ),
  plugins: [react(), tailwindcss()],
  build: {
    emptyOutDir: true,
    outDir: fileURLToPath(new URL('../../../../dist/apps/zetro/cxz/public', import.meta.url)),
  },
})
