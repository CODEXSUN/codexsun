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
  validateWorkspaceScopeSchema,
} from './chat.schema.js'
import type { ChatService } from './chat.service.js'
import { streamChatTurn } from './chat.stream.js'
import { InvalidChatWorkspaceScopeError, validateChatWorkspaceScope } from './chat.scope.js'
import { ProjectNotFoundError, type ProjectService } from '../projects/index.js'

export async function registerChatRoutes(
  server: FastifyInstance,
  service: ChatService,
  conversations: ChatConversationService,
  projects: ProjectService,
) {
  server.post('/api/v1/chat/workspace-scope/validate', async (request, reply) => {
    try {
      const input = validateWorkspaceScopeSchema.parse(request.body)
      const project = projects.get(input.projectId)
      if (project.archived) return reply.code(409).send({ error: 'The project is archived.' })
      return { scope: await validateChatWorkspaceScope(project.repositoryPath, input.scope) }
    } catch (error) {
      return handleConversationError(error, request, reply)
    }
  })

  server.post('/api/v1/chat/responses', async (request, reply) => {
    try {
      const input = chatTurnRequestSchema.parse(request.body)
      if (!isConversationWorkflow(input.workflow)) {
        return reply.code(409).send({
          error: 'Chat supports planning and review only. Create and start a reviewed Project Task for implementation.',
        })
      }
      const project = projects.get(input.projectId)
      const conversation = conversations.get(input.conversationId)
      if (project.archived || conversation.archivedAt) {
        return reply
          .code(409)
          .send({ error: 'Restore the project and conversation before running a turn.' })
      }
      if (conversation.projectId !== project.id) {
        return reply.code(409).send({ error: 'Conversation does not belong to this project.' })
      }
      if (!conversation.scope) {
        return reply.code(409).send({ error: 'Connect this chat to a project folder first.' })
      }
      const scope = await validateChatWorkspaceScope(project.repositoryPath, conversation.scope)
      if (request.headers.accept?.includes('application/x-ndjson')) {
        return streamChatTurn(reply, service, {
          ...input,
          projectRoot: project.repositoryPath,
          scope,
        })
      }
      return await service.respond({ ...input, projectRoot: project.repositoryPath, scope })
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ error: 'Invalid chat request.', issues: error.issues })
      }

      if (error instanceof ChatProviderError) {
        return reply.code(error.statusCode).send({ error: error.message })
      }

      if (error instanceof InvalidChatWorkspaceScopeError) {
        return reply.code(400).send({ error: error.message })
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

  server.post('/api/v1/chat/responses/:conversationId/stop', async (request, reply) => {
    try {
      const { conversationId } = conversationParametersSchema.parse(request.params)
      const { projectId } = conversationListQuerySchema.parse(request.query)
      projects.get(projectId)
      if (conversations.get(conversationId).projectId !== projectId) {
        return reply.code(404).send({ error: 'Conversation not found.' })
      }
      return { stopped: await service.stop(conversationId) }
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
      const {
        messages,
        projectId,
        scope: requestedScope,
      } = createConversationSchema.parse(request.body)
      const project = projects.get(projectId)
      const scope = requestedScope
        ? await validateChatWorkspaceScope(project.repositoryPath, requestedScope)
        : undefined
      return reply
        .code(201)
        .send({ conversation: await conversations.create(projectId, messages, scope) })
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
      const scope = update.scope
        ? await validateChatWorkspaceScope(projects.get(projectId).repositoryPath, update.scope)
        : undefined
      return {
        conversation: await conversations.update(conversationId, {
          ...update,
          ...(scope ? { scope } : {}),
        }),
      }
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

function isConversationWorkflow(workflow: 'plan' | 'deliver' | 'develop' | 'document' | 'review' | 'test') {
  return workflow === 'plan' || workflow === 'review'
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
  if (error instanceof InvalidChatWorkspaceScopeError) {
    return reply.code(400).send({ error: error.message })
  }
  request.log.error(error)
  return reply.code(500).send({ error: 'Zetro could not save conversation history.' })
}
