import type { FastifyInstance, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { DeveloperToolCommandError } from '../developer-tools/index.js'
import { ProjectNotFoundError } from '../projects/index.js'
import {
  gitDeliveryFlowSchema,
  gitDeliverySettingsSchema,
  projectGitDeliverySettingsSchema,
  projectParametersSchema,
} from './git-delivery.schema.js'
import { GitDeliveryCommandError } from './git-delivery.runner.js'
import { GitDeliveryPolicyError, type GitDeliveryService } from './git-delivery.service.js'

export async function registerGitDeliveryRoutes(
  server: FastifyInstance,
  service: GitDeliveryService,
) {
  server.get('/api/v1/git-delivery/settings', async (_request, reply) =>
    reply.send(service.getGlobalSettings()),
  )
  server.patch('/api/v1/git-delivery/settings', async (request, reply) =>
    handle(reply, () => service.setGlobalSettings(gitDeliverySettingsSchema.parse(request.body))),
  )
  server.get('/api/v1/projects/:projectId/git-delivery/settings', async (request, reply) =>
    handle(reply, () => service.getProjectSettings(projectId(request.params))),
  )
  server.patch('/api/v1/projects/:projectId/git-delivery/settings', async (request, reply) =>
    handle(reply, () =>
      service.setProjectSettings(
        projectId(request.params),
        projectGitDeliverySettingsSchema.parse(request.body),
      ),
    ),
  )
  server.get('/api/v1/projects/:projectId/git-delivery/preview', async (request, reply) =>
    handle(reply, () => {
      const query = request.query as { title?: string }
      return service.preview(projectId(request.params), query.title?.trim())
    }),
  )
  server.get('/api/v1/projects/:projectId/git-delivery/flows', async (request, reply) =>
    handle(reply, () => service.list(projectId(request.params))),
  )
  server.post('/api/v1/projects/:projectId/git-delivery/flows', async (request, reply) =>
    handle(reply, () =>
      service.run(projectId(request.params), gitDeliveryFlowSchema.parse(request.body)),
    ),
  )
}

function projectId(params: unknown): string {
  return projectParametersSchema.parse(params).projectId
}

async function handle(reply: FastifyReply, action: () => unknown | Promise<unknown>) {
  try {
    return await action()
  } catch (error) {
    if (error instanceof ZodError || error instanceof GitDeliveryPolicyError)
      return reply.code(400).send({ error: error.message })
    if (error instanceof ProjectNotFoundError) return reply.code(404).send({ error: error.message })
    if (error instanceof GitDeliveryCommandError || error instanceof DeveloperToolCommandError)
      return reply.code(409).send({ error: error.message })
    throw error
  }
}
