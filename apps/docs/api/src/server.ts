import cors from '@fastify/cors'
import Fastify from 'fastify'
import { getProjectRoot, readEnvironment } from './config.js'
import { createDatabase } from './database.js'
import { registerDocsLibraryModule } from './modules/docs-library/index.js'

async function start(): Promise<void> {
  const environment = readEnvironment()
  const database = createDatabase(environment)
  const server = Fastify({ logger: true })

  await server.register(cors, { origin: [`http://127.0.0.1:${environment.DOCS_WEB_PORT}`] })
  await registerDocsLibraryModule(server, environment, database, getProjectRoot())
  server.get('/', async (_request, reply) => {
    return reply.redirect(`http://127.0.0.1:${environment.DOCS_WEB_PORT}`, 307)
  })
  server.get('/favicon.ico', async (_request, reply) => reply.code(204).send())
  server.get('/health', async () => ({ mode: environment.DOCS_INDEX_MODE, status: 'ok' }))
  server.addHook('onClose', async () => database.destroy())
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
}

start().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
