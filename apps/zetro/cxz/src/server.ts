import { pathToFileURL } from 'node:url'
import { createApp } from './app.js'
import { readEnvironment } from './config.js'
import { CxzCodexRuntime } from './codex-runtime.js'

export async function startServer() {
  const environment = readEnvironment()
  const codex = new CxzCodexRuntime()
  const server = createApp(codex, environment.ZETRO_API_URL)
  await server.listen({ host: environment.CXZ_HOST, port: environment.CXZ_PORT })
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => void server.close())
  process.on('message', (value) => {
    if (value === 'codexsun:shutdown') void server.close()
  })
  return server
}

const entry = process.argv[1]
if (entry && (pathToFileURL(entry).href === import.meta.url || entry.endsWith('start.mjs'))) {
  startServer().catch((error: unknown) => {
    console.error('CXZ failed to start.', error)
    process.exitCode = 1
  })
}
