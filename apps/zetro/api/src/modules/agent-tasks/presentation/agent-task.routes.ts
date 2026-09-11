import {
  agentTaskDraftSchema,
  agentTaskFromChatRequestSchema,
  agentTaskListResponseSchema,
  agentTaskParamsSchema,
} from '@codexsun/zetro-contracts'
import type { FastifyInstance, FastifyReply } from 'fastify'
import { AgentTaskNotFoundError, AgentTaskService } from '../application/agent-task.service.js'

export async function registerAgentTaskRoutes(server: FastifyInstance, service: AgentTaskService) {
  server.get('/api/zetro/v1/agent-tasks', async () =>
    agentTaskListResponseSchema.parse({ tasks: service.list() }),
  )

  server.get('/api/zetro/v1/agent-tasks/:taskId', async (request, reply) => {
    const params = agentTaskParamsSchema.safeParse(request.params)
    if (!params.success) return reply.code(400).send({ error: 'A valid task ID is required.' })
    try {
      return agentTaskDraftSchema.parse(service.get(params.data.taskId))
    } catch (error) {
      return sendAgentTaskError(reply, error)
    }
  })

  server.post('/api/zetro/v1/agent-tasks/from-chat', async (request, reply) => {
    const input = agentTaskFromChatRequestSchema.safeParse(request.body)
    if (!input.success) {
      return reply.code(400).send({ error: 'A valid conversation and turn are required.' })
    }
    try {
      return reply.code(201).send(agentTaskDraftSchema.parse(service.createFromChat(input.data)))
    } catch (error) {
      return reply.code(409).send({ error: errorMessage(error) })
    }
  })
}

function sendAgentTaskError(reply: FastifyReply, error: unknown) {
  if (error instanceof AgentTaskNotFoundError) return reply.code(404).send({ error: error.message })
  return reply.code(500).send({ error: 'The agent task registry failed.' })
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The chat response could not become a task draft.'
}
