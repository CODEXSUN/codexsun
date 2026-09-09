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
  repositoryScriptSchema,
  branchDeleteSchema,
  conflictResolutionSchema,
  diffQuerySchema,
  pullRequestSchema,
  repositoryPathSchema,
  stageSchema,
  stashActionSchema,
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
  server.get('/api/v1/projects/:projectId/developer-tools/scripts', async (request, reply) =>
    handle(reply, async () => ({
      scripts: await service.scripts(projectParametersSchema.parse(request.params).projectId),
    })),
  )
  server.post('/api/v1/projects/:projectId/developer-tools/script-tasks', async (request, reply) =>
    handle(reply, async () => {
      const projectId = projectParametersSchema.parse(request.params).projectId
      const input = repositoryScriptSchema.parse(request.body)
      return { task: await service.runScript(projectId, input.script) }
    }),
  )
  server.get('/api/v1/projects/:projectId/developer-tools/changes', async (request, reply) =>
    handle(reply, async () => ({
      files: await service.changes(projectParametersSchema.parse(request.params).projectId),
    })),
  )
  server.get('/api/v1/projects/:projectId/developer-tools/diff', async (request, reply) =>
    handle(reply, () => {
      const projectId = projectParametersSchema.parse(request.params).projectId
      const query = diffQuerySchema.parse(request.query)
      return service.diff(projectId, query.path, query.staged)
    }),
  )
  server.post('/api/v1/projects/:projectId/developer-tools/stage', async (request, reply) =>
    handle(reply, () => {
      const projectId = projectParametersSchema.parse(request.params).projectId
      const input = stageSchema.parse(request.body)
      return service.stage(projectId, input.path, input.staged, input.hunk)
    }),
  )
  server.get('/api/v1/projects/:projectId/developer-tools/history', async (request, reply) =>
    handle(reply, async () => ({
      history: await service.history(
        projectParametersSchema.parse(request.params).projectId,
        repositoryPathSchema.parse(request.query).path,
      ),
    })),
  )
  server.get('/api/v1/projects/:projectId/developer-tools/blame', async (request, reply) =>
    handle(reply, async () => ({
      lines: await service.blame(
        projectParametersSchema.parse(request.params).projectId,
        repositoryPathSchema.parse(request.query).path,
      ),
    })),
  )
  server.get('/api/v1/projects/:projectId/developer-tools/conflicts', async (request, reply) =>
    handle(reply, async () => ({
      files: await service.conflicts(projectParametersSchema.parse(request.params).projectId),
    })),
  )
  server.post('/api/v1/projects/:projectId/developer-tools/conflicts', async (request, reply) =>
    handle(reply, () => {
      const projectId = projectParametersSchema.parse(request.params).projectId
      const input = conflictResolutionSchema.parse(request.body)
      return service.resolveConflict(projectId, input.path, input.resolution, input.content)
    }),
  )
  server.get('/api/v1/projects/:projectId/developer-tools/branches', async (request, reply) =>
    handle(reply, async () => ({
      branches: await service.branches(projectParametersSchema.parse(request.params).projectId),
    })),
  )
  server.delete('/api/v1/projects/:projectId/developer-tools/branches', async (request, reply) =>
    handle(reply, async () => ({
      branches: await service.deleteBranch(
        projectParametersSchema.parse(request.params).projectId,
        branchDeleteSchema.parse(request.body).branch,
      ),
    })),
  )
  server.get('/api/v1/projects/:projectId/developer-tools/stashes', async (request, reply) =>
    handle(reply, async () => ({
      stashes: await service.stashes(projectParametersSchema.parse(request.params).projectId),
    })),
  )
  server.post('/api/v1/projects/:projectId/developer-tools/stashes', async (request, reply) =>
    handle(reply, async () => {
      const projectId = projectParametersSchema.parse(request.params).projectId
      const input = stashActionSchema.parse(request.body)
      return {
        stashes: await service.stash(
          projectId,
          input.action,
          'index' in input ? input.index : undefined,
          'message' in input ? input.message : undefined,
        ),
      }
    }),
  )
  server.post('/api/v1/projects/:projectId/developer-tools/pull-requests', async (request, reply) =>
    handle(reply, () =>
      service.pullRequest(
        projectParametersSchema.parse(request.params).projectId,
        pullRequestSchema.parse(request.body),
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
