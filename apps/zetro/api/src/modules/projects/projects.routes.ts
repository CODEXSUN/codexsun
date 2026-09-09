import type { FastifyInstance, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import {
  createProjectSchema,
  projectDirectoryQuerySchema,
  projectListQuerySchema,
  projectParametersSchema,
  updateProjectSchema,
} from './projects.schema.js'
import {
  InvalidProjectRepositoryError,
  LastActiveProjectError,
  ProjectNotFoundError,
  ProjectRepositoryAlreadyExistsError,
  type ProjectService,
} from './projects.service.js'

export async function registerProjectRoutes(server: FastifyInstance, service: ProjectService) {
  server.get('/api/v1/projects', async (request, reply) => {
    try {
      const { archived } = projectListQuerySchema.parse(request.query)
      return { projects: service.list(archived) }
    } catch (error) {
      return handleProjectError(error, request, reply)
    }
  })

  server.get('/api/v1/projects/directories', async (request, reply) => {
    try {
      const { path } = projectDirectoryQuerySchema.parse(request.query)
      return await service.browseDirectories(path)
    } catch (error) {
      return handleProjectError(error, request, reply)
    }
  })

  server.get('/api/v1/projects/:projectId', async (request, reply) => {
    try {
      const { projectId } = projectParametersSchema.parse(request.params)
      return { project: service.get(projectId) }
    } catch (error) {
      return handleProjectError(error, request, reply)
    }
  })

  server.post('/api/v1/projects', async (request, reply) => {
    try {
      const project = await service.create(createProjectSchema.parse(request.body))
      return reply.code(201).send({ project })
    } catch (error) {
      return handleProjectError(error, request, reply)
    }
  })

  server.patch('/api/v1/projects/:projectId', async (request, reply) => {
    try {
      const { projectId } = projectParametersSchema.parse(request.params)
      const project = await service.update(projectId, updateProjectSchema.parse(request.body))
      return { project }
    } catch (error) {
      return handleProjectError(error, request, reply)
    }
  })
}

function handleProjectError(
  error: unknown,
  request: { log: { error(value: unknown): void } },
  reply: FastifyReply,
) {
  if (error instanceof ZodError || error instanceof InvalidProjectRepositoryError) {
    return reply.code(400).send({ error: error.message })
  }
  if (error instanceof ProjectNotFoundError) return reply.code(404).send({ error: error.message })
  if (error instanceof ProjectRepositoryAlreadyExistsError) {
    return reply.code(409).send({ error: error.message })
  }
  if (error instanceof LastActiveProjectError) return reply.code(409).send({ error: error.message })
  request.log.error(error)
  return reply.code(500).send({ error: 'Zetro could not save this project.' })
}
