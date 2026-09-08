import Fastify from 'fastify'
import { getProjectRoot, readEnvironment } from './config.js'
import { registerChatModule } from './modules/chat/index.js'
import { registerCodexConnectionModule } from './modules/codex-connection/index.js'
import { registerTasksModule } from './modules/tasks/index.js'
import { registerProjectsModule } from './modules/projects/index.js'

export async function createServer() {
  const environment = readEnvironment()
  const server = Fastify({
    bodyLimit: 25_000_000,
    logger: true,
  })

  server.addHook('onSend', async (_request, reply) => {
    reply.header('Access-Control-Allow-Headers', 'Content-Type')
    reply.header('Access-Control-Allow-Methods', 'DELETE,GET,POST,PATCH,OPTIONS')
    reply.header('Access-Control-Allow-Origin', `http://127.0.0.1:${environment.ZETRO_WEB_PORT}`)
  })
  server.options('*', async (_request, reply) => reply.code(204).send())

  const projectRoot = getProjectRoot()
  const codexConnection = await registerCodexConnectionModule(server, environment, projectRoot)
  const projects = await registerProjectsModule(server, environment, projectRoot)

  server.get('/health', async () => {
    const connection = await codexConnection.service.getStatus()
    return {
      codex: connection.state === 'connected' ? 'configured' : 'configuration-required',
      service: 'zetro-api',
      status: 'ok',
      storage: 'ready',
    }
  })
  server.get('/health/live', async () => ({ service: 'zetro-api', status: 'ok' }))
  server.get('/health/ready', async () => ({ service: 'zetro-api', status: 'ready' }))

  await registerChatModule(server, environment, codexConnection.client, projectRoot, projects)
  await registerTasksModule(server, environment, projectRoot, projects)

  return { environment, server }
}

async function start() {
  const { environment, server } = await createServer()
  await server.listen({ host: environment.HOST, port: environment.ZETRO_API_PORT })

  let stopping = false
  const shutdown = async (signal: string) => {
    if (stopping) return
    stopping = true
    server.log.info({ signal }, 'Closing Zetro API resources.')
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

if (process.env.NODE_ENV !== 'test') {
  start().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}
