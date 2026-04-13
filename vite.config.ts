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
  const backendProxyHost = env.APP_PROXY_HOST || "127.0.0.1"
  const allowedHosts = [env.FRONTEND_DOMAIN, env.APP_DOMAIN].filter(Boolean)

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: frontendHost,
      port: frontendPort,
      strictPort: true,
      allowedHosts,
      proxy: {
        "/internal": `http://${backendProxyHost}:${backendPort}`,
        "/api": `http://${backendProxyHost}:${backendPort}`,
        "/public": `http://${backendProxyHost}:${backendPort}`,
        "/storage": `http://${backendProxyHost}:${backendPort}`,
        "/health": `http://${backendProxyHost}:${backendPort}`,
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
        '@demo': path.resolve(__dirname, './apps/demo'),
        '@ecommerce': path.resolve(__dirname, './apps/ecommerce'),
        '@task': path.resolve(__dirname, './apps/task'),
        '@crm': path.resolve(__dirname, './apps/crm'),
        '@zetro': path.resolve(__dirname, './apps/zetro'),
        '@frappe': path.resolve(__dirname, './apps/frappe'),
        '@tally': path.resolve(__dirname, './apps/tally'),
        '@cli': path.resolve(__dirname, './apps/cli'),
        'next/image': path.resolve(__dirname, './apps/ui/src/compat/next-image.tsx'),
        'next/link': path.resolve(__dirname, './apps/ui/src/compat/next-link.tsx'),
      },
    },
    build: {
      outDir: 'build/app/cxapp/web',
      // Preserve previous hashed chunks so already-open shells can finish lazy imports after a deploy.
      emptyOutDir: false,
      chunkSizeWarningLimit: 1400,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replaceAll('\\', '/')

            if (
              normalizedId.includes('/apps/ui/src/registry/') ||
              normalizedId.includes('/apps/ui/src/docs/data/')
            ) {
              return 'ui-catalog'
            }

            if (normalizedId.includes('/apps/cxapp/web/src/desk/')) {
              return 'desk-core'
            }

            if (
              normalizedId.includes('/apps/ui/src/features/dashboard/pages/') ||
              normalizedId.includes('/apps/ui/src/features/dashboard/dashboard-shell.tsx')
            ) {
              return 'dashboard-pages'
            }

            if (normalizedId.includes('/apps/ui/src/features/dashboard/')) {
              return 'dashboard-core'
            }

            if (
              normalizedId.endsWith('/app-manifest.ts') ||
              normalizedId.endsWith('/workspace-items.ts') ||
              normalizedId.endsWith('/common-module-navigation.ts') ||
              normalizedId.endsWith('/module-registry.ts') ||
              normalizedId.includes('/apps/framework/src/application/')
            ) {
              return 'app-suite'
            }

            if (!normalizedId.includes('/node_modules/')) {
              return undefined
            }

            if (
              normalizedId.includes('react-router-dom') ||
              normalizedId.includes('react-dom') ||
              normalizedId.includes('/react/')
            ) {
              return 'react-core'
            }

            if (
              normalizedId.includes('@radix-ui') ||
              normalizedId.includes('@base-ui') ||
              normalizedId.includes('cmdk') ||
              normalizedId.includes('vaul') ||
              normalizedId.includes('react-day-picker') ||
              normalizedId.includes('input-otp')
            ) {
              return 'ui-kit'
            }

            if (normalizedId.includes('lucide-react')) {
              return 'icons'
            }

            if (
              normalizedId.includes('zod') ||
              normalizedId.includes('react-hook-form') ||
              normalizedId.includes('@hookform/resolvers')
            ) {
              return 'forms'
            }

            if (
              normalizedId.includes('framer-motion') ||
              normalizedId.includes('/motion/') ||
              normalizedId.includes('embla-carousel-react')
            ) {
              return 'motion'
            }

            if (
              normalizedId.includes('@tanstack/react-table') ||
              normalizedId.includes('recharts') ||
              normalizedId.includes('date-fns')
            ) {
              return 'data'
            }

            return 'vendor'
          },
        },
      },
    },
  }
})
