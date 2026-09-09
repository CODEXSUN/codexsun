import { PlatformApiObservability } from '@codexsun/platform-core-api'
import Fastify from 'fastify'
import { pathToFileURL } from 'node:url'
import { readEnvironment } from './config.js'
import { registerCrewControlModule } from './modules/crew-control/index.js'

export async function createServer() {
  const environment = readEnvironment()
  const observability = new PlatformApiObservability({
    application: 'agent-crew',
    component: 'agent-crew-api',
  })
  observability.start()
  const server = Fastify(observability.fastifyOptions())
  observability.register(server)
  server.addHook('onClose', () => observability.shutdown())
  const origins = new Set(
    environment.AGENT_CREW_ALLOWED_ORIGINS.split(',').map((value) => value.trim()),
  )
  server.addHook('onSend', async (request, reply) => {
    const origin = request.headers.origin
    if (origin && origins.has(origin)) reply.header('Access-Control-Allow-Origin', origin)
    reply.header('Access-Control-Allow-Headers', 'Content-Type')
    reply.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  })
  server.options('*', async (_request, reply) => reply.code(204).send())
  server.get('/health', async () => ({ service: 'agent-crew-api', status: 'ok' }))
  server.get('/health/live', async () => ({ service: 'agent-crew-api', status: 'ok' }))
  server.get('/health/ready', async (_request, reply) => {
    try {
      const response = await fetch(`${environment.AGENT_CREW_WORKER_URL}/internal/health`, {
        headers: { Authorization: `Bearer ${environment.AGENT_CREW_RUNNER_TOKEN}` },
        signal: AbortSignal.timeout(2_000),
      })
      if (response.ok) return { service: 'agent-crew-api', status: 'ready', worker: 'ready' }
    } catch {
      // The response below reports the bounded worker failure.
    }
    return reply
      .code(503)
      .send({ service: 'agent-crew-api', status: 'not-ready', worker: 'unavailable' })
  })
  await registerCrewControlModule(server, environment)
  return { environment, server }
}

export async function startServer() {
  const { environment, server } = await createServer()
  await server.listen({
    host: environment.AGENT_CREW_API_HOST,
    port: environment.AGENT_CREW_API_PORT,
  })
  let closing = false
  const close = async () => {
    if (!closing) {
      closing = true
      await server.close()
    }
  }
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => void close())
  process.on('message', (message) => {
    if (message === 'codexsun:shutdown') void close()
  })
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  startServer().catch((error: unknown) => {
    console.error('Agent Crew API failed to start.', error)
    process.exitCode = 1
  })
}
