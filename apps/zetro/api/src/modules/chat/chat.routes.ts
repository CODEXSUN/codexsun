import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import {
  ChatConversationNotFoundError,
  type ChatConversationService,
} from './chat.conversation.service.js'
import { ChatProviderError } from './chat.provider.js'
import {
  chatTurnRequestSchema,
  conversationParametersSchema,
  createConversationSchema,
  updateConversationSchema,
} from './chat.schema.js'
import type { ChatService } from './chat.service.js'

export async function registerChatRoutes(
  server: FastifyInstance,
  service: ChatService,
  conversations: ChatConversationService,
) {
  server.post('/api/v1/chat/responses', async (request, reply) => {
    try {
      const input = chatTurnRequestSchema.parse(request.body)
      return await service.respond(input)
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ error: 'Invalid chat request.', issues: error.issues })
      }

      if (error instanceof ChatProviderError) {
        return reply.code(error.statusCode).send({ error: error.message })
      }

      request.log.error(error)
      return reply.code(500).send({ error: 'Zetro could not complete this turn.' })
    }
  })

  server.get('/api/v1/chat/conversations', async () => ({
    conversations: conversations.list(),
  }))

  server.get('/api/v1/chat/conversations/:conversationId', async (request, reply) => {
    try {
      const { conversationId } = conversationParametersSchema.parse(request.params)
      return { conversation: conversations.get(conversationId) }
    } catch (error) {
      return handleConversationError(error, request, reply)
    }
  })

  server.post('/api/v1/chat/conversations', async (request, reply) => {
    try {
      const { messages } = createConversationSchema.parse(request.body)
      return reply.code(201).send({ conversation: await conversations.create(messages) })
    } catch (error) {
      return handleConversationError(error, request, reply)
    }
  })

  server.patch('/api/v1/chat/conversations/:conversationId', async (request, reply) => {
    try {
      const { conversationId } = conversationParametersSchema.parse(request.params)
      const update = updateConversationSchema.parse(request.body)
      return { conversation: await conversations.update(conversationId, update) }
    } catch (error) {
      return handleConversationError(error, request, reply)
    }
  })
}

function handleConversationError(
  error: unknown,
  request: { log: { error(value: unknown): void } },
  reply: import('fastify').FastifyReply,
) {
  if (error instanceof ZodError) {
    return reply.code(400).send({ error: 'Invalid conversation request.', issues: error.issues })
  }
  if (error instanceof ChatConversationNotFoundError) {
    return reply.code(404).send({ error: error.message })
  }
  request.log.error(error)
  return reply.code(500).send({ error: 'Zetro could not save conversation history.' })
}
