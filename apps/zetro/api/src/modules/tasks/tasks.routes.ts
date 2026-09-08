import type { FastifyInstance, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { createTaskSchema, taskParametersSchema, updateTaskSchema } from './tasks.schema.js'
import { TaskNotFoundError, type TaskService } from './tasks.service.js'

export async function registerTaskRoutes(server: FastifyInstance, service: TaskService) {
  server.get('/api/v1/tasks', async () => ({ tasks: service.list() }))

  server.post('/api/v1/tasks', async (request, reply) => {
    try {
      const task = await service.create(createTaskSchema.parse(request.body))
      return reply.code(201).send({ task })
    } catch (error) {
      return handleRouteError(error, request, reply)
    }
  })

  server.patch('/api/v1/tasks/:taskId', async (request, reply) => {
    try {
      const { taskId } = taskParametersSchema.parse(request.params)
      const task = await service.update(taskId, updateTaskSchema.parse(request.body))
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

  request.log.error(error)
  return reply.code(500).send({ error: 'Zetro could not save this task.' })
}
