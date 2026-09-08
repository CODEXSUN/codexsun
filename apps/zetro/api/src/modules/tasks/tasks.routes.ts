import type { FastifyInstance, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import {
  createTaskSchema,
  taskListQuerySchema,
  taskParametersSchema,
  updateTaskSchema,
} from './tasks.schema.js'
import { TaskNotFoundError, type TaskService } from './tasks.service.js'
import { ProjectNotFoundError, type ProjectService } from '../projects/index.js'

export async function registerTaskRoutes(
  server: FastifyInstance,
  service: TaskService,
  projects: ProjectService,
) {
  server.get('/api/v1/tasks', async (request, reply) => {
    try {
      const { archived, projectId } = taskListQuerySchema.parse(request.query)
      projects.get(projectId)
      return { tasks: service.list(projectId, archived) }
    } catch (error) {
      return handleRouteError(error, request, reply)
    }
  })

  server.post('/api/v1/tasks', async (request, reply) => {
    try {
      const input = createTaskSchema.parse(request.body)
      projects.get(input.projectId)
      const task = await service.create(input)
      return reply.code(201).send({ task })
    } catch (error) {
      return handleRouteError(error, request, reply)
    }
  })

  server.patch('/api/v1/tasks/:taskId', async (request, reply) => {
    try {
      const { taskId } = taskParametersSchema.parse(request.params)
      const { projectId } = taskListQuerySchema.parse(request.query)
      projects.get(projectId)
      const task = await service.update(taskId, projectId, updateTaskSchema.parse(request.body))
      return { task }
    } catch (error) {
      return handleRouteError(error, request, reply)
    }
  })
}

function handleRouteError(
  error: unknown,
  request: { log: { error(value: unknown): void } },
  reply: FastifyReply,
) {
  if (error instanceof ZodError) {
    return reply.code(400).send({ error: 'Invalid task request.', issues: error.issues })
  }

  if (error instanceof TaskNotFoundError) {
    return reply.code(404).send({ error: error.message })
  }
  if (error instanceof ProjectNotFoundError) return reply.code(404).send({ error: error.message })

  request.log.error(error)
  return reply.code(500).send({ error: 'Zetro could not save this task.' })
}
