import { PlatformApiObservability } from '@codexsun/platform-core-api'
import Fastify from 'fastify'
import { pathToFileURL } from 'node:url'
import { getProjectRoot, readEnvironment } from './config.js'
import { registerChatModule } from './modules/chat/index.js'
import { registerCodexConnectionModule } from './modules/codex-connection/index.js'
import { registerTasksModule } from './modules/tasks/index.js'
import { registerProjectsModule } from './modules/projects/index.js'
import { registerDeveloperToolsModule } from './modules/developer-tools/index.js'
import { registerGitDeliveryModule } from './modules/git-delivery/index.js'
import { registerSystemTasksModule } from './modules/system-tasks/index.js'
import { registerWorktreesModule } from './modules/worktrees/index.js'
import { registerOperationsModule } from './modules/operations/index.js'
import { registerDesktopSessionAuth } from './infrastructure/desktop-session-auth.js'
import { ZetroDatabase } from './infrastructure/zetro-database.js'

export async function createServer() {
  const observability = new PlatformApiObservability({
    application: 'zetro',
    component: 'zetro-api',
  })
  observability.start()
  try {
    const environment = readEnvironment()
    const server = Fastify({
      ...observability.fastifyOptions(),
      bodyLimit: 25_000_000,
    })
    observability.register(server)
    server.addHook('onClose', () => observability.shutdown())
    registerDesktopSessionAuth(server, environment)

    const allowedOrigins = new Set(
      environment.ZETRO_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
    )
    server.addHook('onSend', async (request, reply) => {
      const origin = request.headers.origin
      reply.header(
        'Access-Control-Allow-Headers',
        'Content-Type, X-Zetro-App-Token, X-Zetro-Session-Token',
      )
      reply.header('Access-Control-Allow-Methods', 'DELETE,GET,POST,PATCH,OPTIONS')
      if (origin && allowedOrigins.has(origin)) reply.header('Access-Control-Allow-Origin', origin)
    })
    server.options('*', async (_request, reply) => reply.code(204).send())

    const projectRoot = getProjectRoot()
    const database = await ZetroDatabase.open(environment, projectRoot)
    server.addHook('onClose', () => database.close())
    const systemTasks = await registerSystemTasksModule(server, environment, database)
    const codexConnection = await registerCodexConnectionModule(server, environment, projectRoot)
    await registerWorktreesModule(server, codexConnection.worktrees)
    const projects = await registerProjectsModule(server, environment, projectRoot, database)
    const developerTools = await registerDeveloperToolsModule(
      server,
      environment,
      projectRoot,
      projects,
      database,
      systemTasks,
    )
    await registerGitDeliveryModule(
      server,
      environment,
      projectRoot,
      projects,
      developerTools,
      database,
      systemTasks,
    )

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
    server.get('/health/ready', async (_request, reply) => {
      try {
        await database.check()
        return { database: environment.DB_DRIVER, service: 'zetro-api', status: 'ready' }
      } catch {
        return reply
          .code(503)
          .send({ database: 'unavailable', service: 'zetro-api', status: 'not-ready' })
      }
    })

    await registerChatModule(
      server,
      environment,
      codexConnection.client,
      projectRoot,
      projects,
      database,
    )
    await registerTasksModule(server, environment, projectRoot, projects, database)
    await registerOperationsModule(
      server,
      environment,
      projectRoot,
      database,
      systemTasks,
      codexConnection.service,
      codexConnection.worktrees,
    )
    await systemTasks.start()

    return { environment, server }
  } catch (error) {
    observability.reportStartupFailure(error)
    await observability.shutdown()
    throw error
  }
}

export async function startServer() {
  const { environment, server } = await createServer()
  try {
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
    watchDesktopParent(() => void shutdown('desktop-parent-exit'))
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
    server.log.fatal({ err: error }, 'zetro-api startup failed')
    await server.close()
    throw error
  }
}

if (isMainModule()) {
  startServer().catch((error: unknown) => {
    console.error('Zetro API failed to start.', error)
    process.exitCode = 1
  })
}

function isMainModule(): boolean {
  const entry = process.argv[1]
  return Boolean(entry && pathToFileURL(entry).href === import.meta.url)
}

function watchDesktopParent(onExit: () => void): void {
  const value = process.env.ZETRO_DESKTOP_PARENT_PID
  if (!value) return
  const parentPid = Number(value)
  if (!Number.isSafeInteger(parentPid) || parentPid <= 0) return
  const timer = setInterval(() => {
    try {
      process.kill(parentPid, 0)
    } catch {
      clearInterval(timer)
      onExit()
    }
  }, 2_000)
  timer.unref()
}
