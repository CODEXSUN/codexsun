import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import {
  ChatConversationNotArchivedError,
  ChatConversationNotFoundError,
  type ChatConversationService,
} from './chat.conversation.service.js'
import { ChatProviderError } from './chat.provider.js'
import {
  chatTurnRequestSchema,
  conversationListQuerySchema,
  conversationParametersSchema,
  createConversationSchema,
  updateConversationSchema,
} from './chat.schema.js'
import type { ChatService } from './chat.service.js'
import { ProjectNotFoundError, type ProjectService } from '../projects/index.js'

export async function registerChatRoutes(
  server: FastifyInstance,
  service: ChatService,
  conversations: ChatConversationService,
  projects: ProjectService,
) {
  server.post('/api/v1/chat/responses', async (request, reply) => {
    try {
      const input = chatTurnRequestSchema.parse(request.body)
      const project = projects.get(input.projectId)
      const conversation = conversations.get(input.conversationId)
      if (conversation.projectId !== project.id) {
        return reply.code(409).send({ error: 'Conversation does not belong to this project.' })
      }
      return await service.respond({ ...input, projectRoot: project.repositoryPath })
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

  server.get('/api/v1/chat/conversations', async (request, reply) => {
    try {
      const { archived, projectId } = conversationListQuerySchema.parse(request.query)
      projects.get(projectId)
      return { conversations: conversations.list(projectId, archived) }
    } catch (error) {
      return handleConversationError(error, request, reply)
    }
  })

  server.delete('/api/v1/chat/conversations/archived', async (request, reply) => {
    try {
      const { projectId } = conversationListQuerySchema.parse(request.query)
      projects.get(projectId)
      return { deletedCount: await conversations.deleteArchived(projectId) }
    } catch (error) {
      return handleConversationError(error, request, reply)
    }
  })

  server.get('/api/v1/chat/conversations/:conversationId', async (request, reply) => {
    try {
      const { conversationId } = conversationParametersSchema.parse(request.params)
      const { projectId } = conversationListQuerySchema.parse(request.query)
      projects.get(projectId)
      const conversation = conversations.get(conversationId)
      if (conversation.projectId !== projectId)
        return reply.code(404).send({ error: 'Conversation not found.' })
      return { conversation }
    } catch (error) {
      return handleConversationError(error, request, reply)
    }
  })

  server.post('/api/v1/chat/conversations', async (request, reply) => {
    try {
      const { messages, projectId } = createConversationSchema.parse(request.body)
      projects.get(projectId)
      return reply.code(201).send({ conversation: await conversations.create(projectId, messages) })
    } catch (error) {
      return handleConversationError(error, request, reply)
    }
  })

  server.patch('/api/v1/chat/conversations/:conversationId', async (request, reply) => {
    try {
      const { conversationId } = conversationParametersSchema.parse(request.params)
      const { projectId } = conversationListQuerySchema.parse(request.query)
      projects.get(projectId)
      if (conversations.get(conversationId).projectId !== projectId) {
        return reply.code(404).send({ error: 'Conversation not found.' })
      }
      const update = updateConversationSchema.parse(request.body)
      return { conversation: await conversations.update(conversationId, update) }
    } catch (error) {
      return handleConversationError(error, request, reply)
    }
  })

  server.delete('/api/v1/chat/conversations/:conversationId', async (request, reply) => {
    try {
      const { conversationId } = conversationParametersSchema.parse(request.params)
      const { projectId } = conversationListQuerySchema.parse(request.query)
      projects.get(projectId)
      if (conversations.get(conversationId).projectId !== projectId) {
        return reply.code(404).send({ error: 'Conversation not found.' })
      }
      await conversations.delete(conversationId)
      return { deletedId: conversationId }
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
  if (error instanceof ChatConversationNotArchivedError) {
    return reply.code(409).send({ error: error.message })
  }
  if (error instanceof ProjectNotFoundError) return reply.code(404).send({ error: error.message })
  request.log.error(error)
  return reply.code(500).send({ error: 'Zetro could not save conversation history.' })
}
