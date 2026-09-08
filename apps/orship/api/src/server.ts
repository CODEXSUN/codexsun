import { buildOrshipApi } from './app.js'
import { readEnvironment } from './config.js'

async function start(): Promise<void> {
  const environment = readEnvironment()
  const server = await buildOrshipApi(environment)
  await server.listen({ host: environment.ORSHIP_API_HOST, port: environment.ORSHIP_API_PORT })

  let stopping = false
  const shutdown = async (reason: string) => {
    if (stopping) return
    stopping = true
    server.log.info({ reason }, 'Orship API shutdown requested')
    await server.close()
    server.log.info('Orship API shutdown complete')
  }
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => void shutdown(signal))
  }
  process.on('message', (message) => {
    if (message && typeof message === 'object' && 'type' in message) {
      if (message.type === 'codexsun:shutdown') void shutdown('supervisor IPC')
    }
  })
}

start().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
