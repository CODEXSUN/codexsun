import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const frontendHost = env.FRONTEND_HOST || "0.0.0.0"
  const frontendPort = Number(env.FRONTEND_HTTP_PORT || 5173)
  const backendPort = Number(env.APP_HTTP_PORT || env.APP_PORT || 3000)
  const allowedHosts = [env.FRONTEND_DOMAIN, env.APP_DOMAIN].filter(Boolean)

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: frontendHost,
      port: frontendPort,
      strictPort: true,
      allowedHosts,
      proxy: {
        "/internal": `http://localhost:${backendPort}`,
        "/api": `http://localhost:${backendPort}`,
        "/public": `http://localhost:${backendPort}`,
        "/health": `http://localhost:${backendPort}`,
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './apps/ui/src'),
        '@ui': path.resolve(__dirname, './apps/ui/src'),
        '@framework': path.resolve(__dirname, './apps/framework/src'),
        '@cxapp': path.resolve(__dirname, './apps/cxapp'),
        '@site': path.resolve(__dirname, './apps/site'),
        '@core': path.resolve(__dirname, './apps/core'),
        '@api': path.resolve(__dirname, './apps/api'),
        '@billing': path.resolve(__dirname, './apps/billing'),
        '@ecommerce': path.resolve(__dirname, './apps/ecommerce'),
        '@task': path.resolve(__dirname, './apps/task'),
        '@frappe': path.resolve(__dirname, './apps/frappe'),
        '@tally': path.resolve(__dirname, './apps/tally'),
        '@cli': path.resolve(__dirname, './apps/cli'),
        'next/image': path.resolve(__dirname, './apps/ui/src/compat/next-image.tsx'),
        'next/link': path.resolve(__dirname, './apps/ui/src/compat/next-link.tsx'),
      },
    },
    build: {
      outDir: 'build/app/cxapp/web',
      emptyOutDir: true,
    },
  }
})
