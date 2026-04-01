import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '../../ecommerce/web/src'),
      '@admin-web': path.resolve(import.meta.dirname, '../../ecommerce/web/src'),
      '@ecommerce-web': path.resolve(import.meta.dirname, '../../ecommerce/web/src'),
      '@billing-web': path.resolve(import.meta.dirname, './src'),
      '@framework-core': path.resolve(import.meta.dirname, '../../framework/src'),
      '@billing-core': path.resolve(import.meta.dirname, '../core/src'),
      '@shared': path.resolve(import.meta.dirname, '../../core/shared/src'),
    },
  },
  server: {
    port: 5174,
  },
})
