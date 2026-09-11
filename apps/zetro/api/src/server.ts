import cors from '@fastify/cors'
import { PlatformApiObservability } from '@codexsun/platform-core-api'
import Fastify from 'fastify'
import { pathToFileURL } from 'node:url'
import { chatConversationHeaderName } from '@codexsun/zetro-contracts'
import { getProjectRoot, readEnvironment } from './config.js'
import { registerChatModule } from './modules/chat/index.js'

export async function createServer() {
  const environment = readEnvironment()
  const observability = new PlatformApiObservability({
    application: 'zetro',
    component: 'zetro-api',
  })
  observability.start()
  const server = Fastify({ ...observability.fastifyOptions(), bodyLimit: 70 * 1024 })
  observability.register(server)
  server.addHook('onClose', () => observability.shutdown())
  await server.register(cors, {
    allowedHeaders: ['content-type', chatConversationHeaderName],
    methods: ['GET', 'POST', 'OPTIONS'],
    origin: [environment.ZETRO_WEB_ORIGIN],
  })
  const chat = await registerChatModule(server, environment, getProjectRoot())
  server.get('/health', async () => ({ service: 'zetro-api', status: 'ok' }))
  server.get('/health/live', async () => ({ service: 'zetro-api', status: 'ok' }))
  server.get('/health/ready', async (_request, reply) => {
    if (chat.isReady()) return { service: 'zetro-api', status: 'ready', storage: 'sqlite' }
    return reply
      .code(503)
      .send({ service: 'zetro-api', status: 'not-ready', storage: 'unavailable' })
  })
  return { environment, server }
}

export async function startServer() {
  const { environment, server } = await createServer()
  await server.listen({ host: environment.ZETRO_API_HOST, port: environment.ZETRO_API_PORT })
  let closing = false
  const close = async () => {
    if (closing) return
    closing = true
    await server.close()
  }
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => void close())
  process.on('message', (message) => {
    if (message === 'codexsun:shutdown') void close()
  })
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  startServer().catch((error: unknown) => {
    console.error('Zetro API failed to start.', error)
    process.exitCode = 1
  })
}
