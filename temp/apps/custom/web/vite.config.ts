import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

function normalizeApiBaseUrl(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return 'http://127.0.0.1:4101'
  }

  try {
    const url = new URL(normalized)
    if (url.hostname === 'localhost') {
      url.hostname = '127.0.0.1'
    }

    return url.toString().replace(/\/$/, '')
  } catch {
    return normalized
  }
}

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(import.meta.dirname, '../../..')
  const workspaceRoot = path.resolve(import.meta.dirname, '../../..')
  const env = loadEnv(mode, envDir, '')
  const apiBaseUrl = normalizeApiBaseUrl(String(env.VITE_CUSTOM_API_URL ?? 'http://localhost:4101'))

  return {
    root: path.resolve(import.meta.dirname),
    envDir,
    publicDir: path.resolve(import.meta.dirname, '../../../public'),
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
    define: {
      'import.meta.env.VITE_CUSTOM_API_URL': JSON.stringify(apiBaseUrl),
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
        '@custom-domain': path.resolve(import.meta.dirname, '../domain/src'),
        '@framework-core': path.resolve(import.meta.dirname, '../../framework/src'),
        '@ui': path.resolve(import.meta.dirname, '../../ui/src'),
      },
    },
    server: {
      port: 5175,
      fs: {
        allow: [
          workspaceRoot,
          path.resolve(import.meta.dirname, '../domain/src'),
          path.resolve(import.meta.dirname, '../../framework/src'),
          path.resolve(import.meta.dirname, '../../ui/src'),
        ],
      },
    },
  }
})
