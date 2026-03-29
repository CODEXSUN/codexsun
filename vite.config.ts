import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/ui/src'),
      '@frontend': path.resolve(__dirname, './apps/frontend'),
    },
  },
  build: {
    outDir: 'build/app/codexsun/web',
    emptyOutDir: true,
  },
})
