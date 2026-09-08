import {
  confirmationRequestSchema,
  confirmationResponseSchema,
  registryNodeCreateSchema,
  registryNodeResponseSchema,
  registryNodeUpdateSchema,
  registryProfileEntryUpsertSchema,
  registryProfileSectionSchema,
  registryResponseSchema,
} from '@codexsun/devkit-contracts'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { ProjectRegistryService } from './project-registry.service.js'

const nodeParamsSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
})
const profileParamsSchema = nodeParamsSchema.extend({ section: registryProfileSectionSchema })

export async function registerProjectRegistryRoutes(
  server: FastifyInstance,
  service: ProjectRegistryService,
): Promise<void> {
  server.get('/api/devkit/v1/project-registry', async () =>
    registryResponseSchema.parse(await service.getRegistry()),
  )
  server.post('/api/devkit/v1/project-registry/nodes', async (request, reply) => {
    const input = registryNodeCreateSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'Invalid registry node.' })
    return sendNode(reply, await service.createNode(input.data))
  })
  server.put('/api/devkit/v1/project-registry/nodes/:id', async (request, reply) => {
    const params = nodeParamsSchema.safeParse(request.params)
    const input = registryNodeUpdateSchema.safeParse(request.body)
    if (!params.success || !input.success)
      return reply.code(400).send({ error: 'Invalid registry node.' })
    return sendNode(reply, await service.updateNode(params.data.id, input.data))
  })
  server.post('/api/devkit/v1/project-registry/:id/confirm', async (request, reply) => {
    const params = nodeParamsSchema.safeParse(request.params)
    const input = confirmationRequestSchema.safeParse(request.body)
    if (!params.success || !input.success)
      return reply.code(400).send({ error: 'Invalid confirmation.' })
    const result = await service.confirm(params.data.id, input.data.confirmation)
    return result
      ? confirmationResponseSchema.parse(result)
      : reply.code(404).send({ error: 'Registry node not found.' })
  })
  server.post(
    '/api/devkit/v1/project-registry/nodes/:id/profile/:section',
    async (request, reply) => {
      const params = profileParamsSchema.safeParse(request.params)
      const input = registryProfileEntryUpsertSchema.safeParse(request.body)
      if (!params.success || !input.success)
        return reply.code(400).send({ error: 'Invalid profile entry.' })
      return sendNode(
        reply,
        await service.upsertProfileEntry(params.data.id, params.data.section, input.data),
      )
    },
  )
}

function sendNode(
  reply: { code: (statusCode: number) => { send: (body: unknown) => unknown } },
  result: unknown,
) {
  return result
    ? registryNodeResponseSchema.parse(result)
    : reply.code(404).send({ error: 'Registry node or parent not found.' })
}
