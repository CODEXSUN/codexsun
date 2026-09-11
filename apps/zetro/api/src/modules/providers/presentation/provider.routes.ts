import {
  providerConnectionParamsSchema,
  providerConnectionTestResponseSchema,
  providerDeviceLoginResponseSchema,
  providerModelListResponseSchema,
  providerSelectionRequestSchema,
  providerSettingsResponseSchema,
} from '@codexsun/zetro-contracts'
import type { FastifyInstance } from 'fastify'
import type { ProviderService } from '../application/provider.service.js'

export async function registerProviderRoutes(server: FastifyInstance, service: ProviderService) {
  server.get('/api/zetro/v1/providers', () =>
    providerSettingsResponseSchema.parse(service.getSettings()),
  )

  server.patch('/api/zetro/v1/providers/default', async (request, reply) => {
    const parsed = providerSelectionRequestSchema.safeParse(request.body)
    if (!parsed.success)
      return reply.code(400).send({ error: 'A valid provider selection is required.' })
    try {
      return providerSettingsResponseSchema.parse(await service.select(parsed.data))
    } catch (error) {
      return reply.code(404).send({ error: errorMessage(error) })
    }
  })

  server.get('/api/zetro/v1/providers/:connectionId/models', async (request, reply) => {
    const params = providerConnectionParamsSchema.safeParse(request.params)
    if (!params.success) return reply.code(400).send({ error: 'A valid provider ID is required.' })
    try {
      return providerModelListResponseSchema.parse({
        models: await service.listModels(params.data.connectionId),
      })
    } catch (error) {
      return reply.code(503).send({ error: errorMessage(error) })
    }
  })

  server.get('/api/zetro/v1/providers/codex/account', async (_request, reply) => {
    try {
      return providerSettingsResponseSchema.parse(await service.refreshAccount())
    } catch (error) {
      return reply.code(503).send({ error: errorMessage(error) })
    }
  })

  server.post('/api/zetro/v1/providers/codex/device-login', async (_request, reply) => {
    try {
      return providerDeviceLoginResponseSchema.parse(await service.startDeviceLogin())
    } catch (error) {
      return reply.code(503).send({ error: errorMessage(error) })
    }
  })

  server.get('/api/zetro/v1/providers/:connectionId/account', async (request, reply) => {
    const params = providerConnectionParamsSchema.safeParse(request.params)
    if (!params.success) return reply.code(400).send({ error: 'A valid provider ID is required.' })
    try {
      return providerSettingsResponseSchema.parse(
        await service.refreshAccount(params.data.connectionId),
      )
    } catch (error) {
      return reply.code(503).send({ error: errorMessage(error) })
    }
  })

  server.post('/api/zetro/v1/providers/:connectionId/device-login', async (request, reply) => {
    const params = providerConnectionParamsSchema.safeParse(request.params)
    if (!params.success) return reply.code(400).send({ error: 'A valid provider ID is required.' })
    try {
      return providerDeviceLoginResponseSchema.parse(
        await service.startDeviceLogin(params.data.connectionId),
      )
    } catch (error) {
      return reply.code(503).send({ error: errorMessage(error) })
    }
  })

  server.post('/api/zetro/v1/providers/:connectionId/test', async (request, reply) => {
    const params = providerConnectionParamsSchema.safeParse(request.params)
    if (!params.success) return reply.code(400).send({ error: 'A valid provider ID is required.' })
    try {
      return providerConnectionTestResponseSchema.parse(
        await service.testConnection(params.data.connectionId),
      )
    } catch (error) {
      return reply.code(503).send({ error: errorMessage(error) })
    }
  })
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Provider request failed.'
}
