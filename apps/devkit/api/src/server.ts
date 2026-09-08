import cors from '@fastify/cors'
import Fastify from 'fastify'
import { getProjectRoot, readEnvironment } from './config.js'
import { registerProjectRegistryModule } from './modules/project-registry/index.js'

async function start(): Promise<void> {
  const environment = readEnvironment()
  const server = Fastify({ logger: true })
  await server.register(cors, { origin: [`http://127.0.0.1:${environment.DEVKIT_WEB_PORT}`] })
  await registerProjectRegistryModule(server, environment, getProjectRoot())
  server.get('/health', async () => ({ service: 'devkit-api', status: 'ok', storage: 'json' }))
  server.get('/health/live', async () => ({ service: 'devkit-api', status: 'ok' }))
  server.get('/health/ready', async () => ({ service: 'devkit-api', status: 'ready' }))
  await server.listen({ host: environment.DEVKIT_API_HOST, port: environment.DEVKIT_API_PORT })

  const shutdown = async () => server.close()
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => void shutdown())
  process.on(
    'message',
    (message) =>
      message &&
      typeof message === 'object' &&
      'type' in message &&
      message.type === 'codexsun:shutdown' &&
      void shutdown(),
  )
}

start().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
