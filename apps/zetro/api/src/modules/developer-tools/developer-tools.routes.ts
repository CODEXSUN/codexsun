import type { FastifyInstance, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { ProjectNotFoundError } from '../projects/index.js'
import { DeveloperToolCommandError } from './developer-tools.git.js'
import { DeveloperToolLaunchError } from './developer-tools.launcher.js'
import {
  compareQuerySchema,
  gitActionSchema,
  launchActionSchema,
  projectParametersSchema,
  projectToolSettingsSchema,
  toolSettingsSchema,
} from './developer-tools.schema.js'
import { DeveloperToolsPolicyError, type DeveloperToolsService } from './developer-tools.service.js'

export async function registerDeveloperToolRoutes(
  server: FastifyInstance,
  service: DeveloperToolsService,
) {
  server.get('/api/v1/developer-tools/settings', async (_request, reply) =>
    reply.send(await service.getGlobalSettings()),
  )
  server.patch('/api/v1/developer-tools/settings', async (request, reply) =>
    handle(reply, () => service.setGlobalSettings(toolSettingsSchema.parse(request.body))),
  )

  server.get('/api/v1/projects/:projectId/developer-tools/settings', async (request, reply) =>
    handle(reply, () =>
      service.getProjectSettings(projectParametersSchema.parse(request.params).projectId),
    ),
  )
  server.patch('/api/v1/projects/:projectId/developer-tools/settings', async (request, reply) =>
    handle(reply, () =>
      service.setProjectSettings(
        projectParametersSchema.parse(request.params).projectId,
        projectToolSettingsSchema.parse(request.body),
      ),
    ),
  )
  server.get('/api/v1/projects/:projectId/developer-tools/status', async (request, reply) =>
    handle(reply, () => service.status(projectParametersSchema.parse(request.params).projectId)),
  )
  server.get('/api/v1/projects/:projectId/developer-tools/compare', async (request, reply) =>
    handle(reply, () =>
      service.compare(
        projectParametersSchema.parse(request.params).projectId,
        compareQuerySchema.parse(request.query).base,
      ),
    ),
  )
  server.post('/api/v1/projects/:projectId/developer-tools/actions', async (request, reply) =>
    handle(reply, () =>
      service.runAction(
        projectParametersSchema.parse(request.params).projectId,
        gitActionSchema.parse(request.body),
      ),
    ),
  )
  server.post('/api/v1/projects/:projectId/developer-tools/launch', async (request, reply) =>
    handle(reply, () =>
      service.launch(
        projectParametersSchema.parse(request.params).projectId,
        launchActionSchema.parse(request.body).target,
      ),
    ),
  )
}

async function handle(reply: FastifyReply, action: () => unknown | Promise<unknown>) {
  try {
    return await action()
  } catch (error) {
    if (error instanceof ZodError || error instanceof DeveloperToolsPolicyError)
      return reply.code(400).send({ error: error.message })
    if (error instanceof ProjectNotFoundError) return reply.code(404).send({ error: error.message })
    if (error instanceof DeveloperToolCommandError || error instanceof DeveloperToolLaunchError)
      return reply.code(409).send({ error: error.message })
    throw error
  }
}
