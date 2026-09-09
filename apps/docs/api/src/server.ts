import cors from '@fastify/cors'
import { PlatformApiObservability } from '@codexsun/platform-core-api'
import Fastify from 'fastify'
import { getProjectRoot, readEnvironment } from './config.js'
import { createDatabase } from './database.js'
import { registerDocsLibraryModule } from './modules/docs-library/index.js'

async function start(): Promise<void> {
  const observability = new PlatformApiObservability({
    application: 'docs',
    component: 'docs-api',
  })
  observability.start()
  try {
    const environment = readEnvironment()
    const database = createDatabase(environment)
    const server = Fastify(observability.fastifyOptions())
    observability.register(server)

    await server.register(cors, { origin: [`http://127.0.0.1:${environment.DOCS_WEB_PORT}`] })
    await registerDocsLibraryModule(server, environment, database, getProjectRoot())
    server.get('/', async (_request, reply) => {
      return reply.redirect(`http://127.0.0.1:${environment.DOCS_WEB_PORT}`, 307)
    })
    server.get('/favicon.ico', async (_request, reply) => reply.code(204).send())
    server.get('/health', async () => ({ mode: environment.DOCS_INDEX_MODE, status: 'ok' }))
    server.addHook('onClose', async () => {
      await database.destroy()
      await observability.shutdown()
    })
    await server.listen({ host: environment.DOCS_API_HOST, port: environment.DOCS_API_PORT })

    let stopping = false
    const shutdown = async (signal: string) => {
      if (stopping) return
      stopping = true
      server.log.info({ signal }, 'Closing Docs API and database connections.')
      await server.close()
    }

    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.once(signal, () => void shutdown(signal))
    }

    process.on('message', (message) => {
      if (
        typeof message === 'object' &&
        message !== null &&
        'type' in message &&
        message.type === 'codexsun:shutdown'
      ) {
        void shutdown('IPC')
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
