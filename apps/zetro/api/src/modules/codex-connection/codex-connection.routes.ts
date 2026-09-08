import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { activateDeviceCodeSchema, disconnectCodexSchema } from './codex-connection.schema.js'
import type { CodexConnectionService } from './codex-connection.service.js'

export async function registerCodexConnectionRoutes(
  server: FastifyInstance,
  service: CodexConnectionService,
) {
  server.get('/api/v1/settings/codex', async () => ({ connection: await service.getStatus() }))

  server.post('/api/v1/settings/codex/device-code', async (request, reply) => {
    try {
      return { deviceCode: await service.startDeviceLogin() }
    } catch (error) {
      request.log.error(error)
      return reply.code(503).send({ error: toMessage(error) })
    }
  })

  server.post('/api/v1/settings/codex/activate', async (request, reply) => {
    try {
      const input = activateDeviceCodeSchema.parse(request.body)
      return { connection: await service.confirmDeviceLogin(input.loginId, input.userCode) }
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ error: 'Invalid activation request.', issues: error.issues })
      }

      request.log.error(error)
      return reply.code(503).send({ error: toMessage(error) })
    }
  })

  server.post('/api/v1/settings/codex/disconnect', async (request, reply) => {
    try {
      disconnectCodexSchema.parse(request.body)
      return { connection: await service.disconnect() }
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ error: 'Disconnect confirmation is required.' })
      }

      request.log.error(error)
      return reply.code(503).send({ error: toMessage(error) })
    }
  })
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Codex connection failed.'
}
