import type { FastifyInstance, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { connectedAppMetricSchema, operationsSettingsSchema } from './operations.schema.js'
import type { OperationsService } from './operations.service.js'

export async function registerOperationsRoutes(
  server: FastifyInstance,
  service: OperationsService,
): Promise<void> {
  server.get('/api/v1/operations/settings', async () => ({ settings: service.getSettings() }))
  server.patch('/api/v1/operations/settings', async (request, reply) =>
    handle(reply, async () => ({
      settings: await service.setSettings(operationsSettingsSchema.parse(request.body)),
    })),
  )
  server.get('/api/v1/operations/metrics', async () => service.metrics())
  server.get('/api/v1/operations/diagnostics', async (_request, reply) => {
    const payload = JSON.stringify(await service.diagnostics(), null, 2)
    return reply
      .header('Content-Disposition', `attachment; filename="zetro-diagnostics-${Date.now()}.json"`)
      .type('application/json')
      .send(payload)
  })
  server.post('/api/v1/connected-apps/metrics', async (request, reply) =>
    handle(reply, async () => {
      const metric = await service.receiveMetric(connectedAppMetricSchema.parse(request.body))
      return reply.code(202).send({ metric })
    }),
  )
}

async function handle(reply: FastifyReply, action: () => Promise<unknown>) {
  try {
    return await action()
  } catch (error) {
    if (error instanceof ZodError) return reply.code(400).send({ error: error.message })
    throw error
  }
}
