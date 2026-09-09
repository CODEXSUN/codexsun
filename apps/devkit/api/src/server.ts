import cors from '@fastify/cors'
import { PlatformApiObservability } from '@codexsun/platform-core-api'
import Fastify from 'fastify'
import { getProjectRoot, readEnvironment } from './config.js'
import { registerProjectRegistryModule } from './modules/project-registry/index.js'

async function start(): Promise<void> {
  const observability = new PlatformApiObservability({
    application: 'devkit',
    component: 'devkit-api',
  })
  observability.start()
  try {
    const environment = readEnvironment()
    const server = Fastify(observability.fastifyOptions())
    observability.register(server)
    server.addHook('onClose', () => observability.shutdown())
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
  } catch (error) {
    observability.reportStartupFailure(error)
    await observability.shutdown()
    throw error
  }
}

start().catch(() => {
  process.exitCode = 1
})
