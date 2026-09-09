import { PlatformApiObservability } from '@codexsun/platform-core-api'
import { buildOrshipApi } from './app.js'
import { readEnvironment } from './config.js'

async function start(): Promise<void> {
  const observability = new PlatformApiObservability({
    application: 'orship',
    component: 'orship-api',
  })
  try {
    const environment = readEnvironment()
    const server = await buildOrshipApi(environment, observability)
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
  } catch (error) {
    observability.reportStartupFailure(error)
    await observability.shutdown()
    throw error
  }
}

start().catch(() => {
  process.exitCode = 1
})
