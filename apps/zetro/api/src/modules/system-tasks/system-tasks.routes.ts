import type { FastifyInstance, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { systemTaskListQuerySchema, systemTaskParametersSchema } from './system-tasks.schema.js'
import {
  SystemTaskNotFoundError,
  SystemTaskPolicyError,
  type SystemTaskService,
} from './system-tasks.service.js'

export async function registerSystemTaskRoutes(
  server: FastifyInstance,
  service: SystemTaskService,
): Promise<void> {
  server.get('/api/v1/system-tasks', async (request, reply) =>
    handle(reply, async () => ({
      tasks: await service.list(systemTaskListQuerySchema.parse(request.query).projectId),
    })),
  )
  server.get('/api/v1/system-tasks/:taskId', async (request, reply) =>
    handle(reply, async () => ({
      task: await service.get(systemTaskParametersSchema.parse(request.params).taskId),
    })),
  )
  server.post('/api/v1/system-tasks/:taskId/stop', async (request, reply) =>
    handle(reply, async () => ({
      task: await service.stop(systemTaskParametersSchema.parse(request.params).taskId),
    })),
  )
  server.post('/api/v1/system-tasks/:taskId/retry', async (request, reply) =>
    handle(reply, async () => ({
      task: await service.retry(systemTaskParametersSchema.parse(request.params).taskId),
    })),
  )
}

async function handle(reply: FastifyReply, action: () => Promise<unknown>) {
  try {
    return await action()
  } catch (error) {
    if (error instanceof ZodError || error instanceof SystemTaskPolicyError) {
      return reply.code(400).send({ error: error.message })
    }
    if (error instanceof SystemTaskNotFoundError) {
      return reply.code(404).send({ error: error.message })
    }
    throw error
  }
}
