import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  cacheDir: '../../../node_modules/.cache/vite/agent-crew-web',
  plugins: [react(), tailwindcss()],
  server: {
    port: Number(process.env.AGENT_CREW_WEB_PORT ?? 6110),
    proxy: {
      '/api': `http://127.0.0.1:${process.env.AGENT_CREW_API_PORT ?? 6100}`,
      '/health': `http://127.0.0.1:${process.env.AGENT_CREW_API_PORT ?? 6100}`,
    },
  },
  build: {
    outDir: '../../../dist/apps/agent-crew/web',
    emptyOutDir: true,
    chunkSizeWarningLimit: 400,
  },
})
