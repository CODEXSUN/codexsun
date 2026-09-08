import type { FastifyInstance } from 'fastify'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildPlatformApi } from './app.js'

const shutdownMessage = 'codexsun:shutdown'

export async function startPlatformApi(): Promise<FastifyInstance> {
  const { environment, server } = await buildPlatformApi()
  const shutdown = createShutdown(server, environment.SHUTDOWN_GRACE_MS)

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => void shutdown(signal))
  }

  process.on('message', (message) => {
    if (isShutdownMessage(message)) {
      void shutdown('IPC')
    }
  })

  await server.listen({
    host: environment.PLATFORM_API_HOST,
    port: environment.PLATFORM_API_PORT,
  })

  server.log.info(
    {
      host: environment.PLATFORM_API_HOST,
      port: environment.PLATFORM_API_PORT,
    },
    'platform API ready',
  )

  return server
}

function createShutdown(server: FastifyInstance, graceMilliseconds: number) {
  let stopping = false

  return async (reason: string) => {
    if (stopping) return
    stopping = true

    server.log.info({ reason }, 'platform API shutdown requested')
    const forceTimer = setTimeout(() => {
      server.log.fatal({ reason }, 'platform API shutdown timed out')
      process.exit(1)
    }, graceMilliseconds)
    forceTimer.unref()

    try {
      await server.close()
      clearTimeout(forceTimer)
      server.log.info({ reason }, 'platform API shutdown complete')
      if (process.connected && typeof process.disconnect === 'function') {
        process.disconnect()
      }
      process.exitCode = 0
    } catch (error) {
      clearTimeout(forceTimer)
      server.log.error({ err: error, reason }, 'platform API shutdown failed')
      process.exitCode = 1
    }
  }
}

function isShutdownMessage(message: unknown): boolean {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === shutdownMessage
  )
}

function isMainModule(): boolean {
  const entry = process.argv[1]
  return Boolean(entry) && pathToFileURL(resolve(entry)).href === import.meta.url
}

if (isMainModule()) {
  startPlatformApi().catch((error: unknown) => {
    process.stderr.write(
      `${JSON.stringify({
        level: 'fatal',
        message: 'platform API startup failed',
        error: error instanceof Error ? error.message : String(error),
      })}\n`,
    )
    process.exitCode = 1
  })
}
