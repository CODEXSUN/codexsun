import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

function normalizeLocalDevelopmentApiBaseUrl(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return normalized
  }

  try {
    const url = new URL(normalized)
    if (url.hostname === 'localhost') {
      url.hostname = '127.0.0.1'
      return url.toString().replace(/\/$/, '')
    }
  } catch {
    return normalized
  }

  return normalized
}

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(import.meta.dirname, '../../..')
  const workspaceRoot = path.resolve(import.meta.dirname, '../../..')
  const env = loadEnv(mode, envDir, '')
  const siblingSourceRoots = [
    path.resolve(import.meta.dirname, '../../billing/web/src'),
    path.resolve(import.meta.dirname, '../../billing/core/src'),
    path.resolve(import.meta.dirname, '../../framework/src'),
    path.resolve(import.meta.dirname, '../../core/domain/src'),
    path.resolve(import.meta.dirname, '../domain/src'),
    path.resolve(import.meta.dirname, '../../frappe/domain/src'),
    path.resolve(import.meta.dirname, '../../task/domain/src'),
    path.resolve(import.meta.dirname, '../../task/web/src'),
    path.resolve(import.meta.dirname, '../../mcp/web/src'),
    path.resolve(import.meta.dirname, '../../core/shared/src'),
    path.resolve(import.meta.dirname, '../../ui/src'),
  ]
  const isDevelopmentMode = mode === 'development'
  const rawAppTarget = String(env.VITE_APP_TARGET ?? '').trim().toLowerCase()
  const appTarget = rawAppTarget === 'app' ? 'billing' : rawAppTarget
  const frontendTarget = appTarget === 'site'
    ? 'web'
    : appTarget === 'ecommerce'
      ? 'shop'
      : appTarget === 'billing'
        ? 'app'
        : env.VITE_FRONTEND_TARGET || 'shop'
  const configuredApiBaseUrl = String(env.VITE_API_BASE_URL ?? '').trim()
  const apiBaseUrl = configuredApiBaseUrl || (isDevelopmentMode
    ? normalizeLocalDevelopmentApiBaseUrl(String(env.CODEXSUN_API_URL ?? 'http://localhost:4000'))
    : '')
  const appDebug = ['1', 'true', 'yes', 'on'].includes(String(env.APP_DEBUG ?? '').trim().toLowerCase())
  const appSkipSetupCheck = ['1', 'true', 'yes', 'on'].includes(
    String(env.APP_SKIP_SETUP_CHECK ?? '').trim().toLowerCase(),
  )

  return {
    root: path.resolve(import.meta.dirname),
    envDir,
    publicDir: path.resolve(import.meta.dirname, '../../../public'),
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined
            }

            if (id.includes('react-dom') || id.includes('react-router') || id.includes(`${path.sep}react${path.sep}`)) {
              return 'react-vendor'
            }

            if (id.includes('@radix-ui') || id.includes('radix-ui')) {
              return 'radix-vendor'
            }

            if (id.includes('motion')) {
              return 'motion-vendor'
            }

            if (id.includes('@tanstack')) {
              return 'query-vendor'
            }

            return 'vendor'
          },
        },
      },
    },
    define: {
      __FRONTEND_TARGET__: JSON.stringify(frontendTarget),
      __APP_MODE__: JSON.stringify(frontendTarget),
      __APP_DEBUG__: JSON.stringify(appDebug),
      __APP_SKIP_SETUP_CHECK__: JSON.stringify(appSkipSetupCheck),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
        '@admin-web': path.resolve(import.meta.dirname, './src'),
        '@ecommerce-web': path.resolve(import.meta.dirname, './src'),
        '@billing-web': path.resolve(import.meta.dirname, '../../billing/web/src'),
        '@billing-core': path.resolve(import.meta.dirname, '../../billing/core/src'),
        '@framework-core': path.resolve(import.meta.dirname, '../../framework/src'),
        '@core-domain': path.resolve(import.meta.dirname, '../../core/domain/src'),
        '@ecommerce-domain': path.resolve(import.meta.dirname, '../domain/src'),
        '@frappe-domain': path.resolve(import.meta.dirname, '../../frappe/domain/src'),
        '@task-domain': path.resolve(import.meta.dirname, '../../task/domain/src'),
        '@task-web': path.resolve(import.meta.dirname, '../../task/web/src'),
        '@mcp-web': path.resolve(import.meta.dirname, '../../mcp/web/src'),
        '@shared': path.resolve(import.meta.dirname, '../../core/shared/src'),
        '@ui': path.resolve(import.meta.dirname, '../../ui/src'),
      },
    },
    server: {
      port: 5173,
      fs: {
        allow: [workspaceRoot, ...siblingSourceRoots],
      },
    },
  }
})
