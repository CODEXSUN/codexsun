import {
  chatConversationListResponseSchema,
  chatConversationProviderResponseSchema,
  chatConversationSummarySchema,
  chatHistoryResponseSchema,
  chatTurnAcceptedResponseSchema,
  encodeChatServerEvent,
  providerSelectionRequestSchema,
} from '@codexsun/zetro-contracts'
import type { FastifyInstance, FastifyReply } from 'fastify'
import { randomUUID } from 'node:crypto'
import {
  ChatConversationConflictError,
  ChatConversationNotFoundError,
  ChatService,
} from '../application/chat.service.js'
import {
  chatConversationCreateRequestSchema,
  chatConversationListQuerySchema,
  chatConversationParamsSchema,
  chatConversationUpdateRequestSchema,
  chatEventStreamQuerySchema,
  chatPromptRequestSchema,
  chatStopRequestSchema,
  chatTurnParamsSchema,
  readConversationId,
} from './chat.schema.js'

export async function registerChatRoutes(server: FastifyInstance, service: ChatService) {
  server.get('/api/zetro/v1/chat/conversations', async (request, reply) => {
    const query = chatConversationListQuerySchema.safeParse(request.query)
    if (!query.success)
      return reply.code(400).send({ error: 'A valid registry scope is required.' })
    return chatConversationListResponseSchema.parse({
      conversations: service.listConversations(query.data.scope),
    })
  })

  server.post('/api/zetro/v1/chat/conversations', async (request, reply) => {
    const parsed = chatConversationCreateRequestSchema.safeParse(request.body ?? {})
    if (!parsed.success)
      return reply.code(400).send({ error: 'The conversation title is invalid.' })
    try {
      const conversation = service.createConversation(randomUUID(), parsed.data.title)
      return reply.code(201).send(chatConversationSummarySchema.parse(conversation))
    } catch (error) {
      return sendConversationError(reply, error)
    }
  })

  server.patch('/api/zetro/v1/chat/conversations/:conversationId', async (request, reply) => {
    const params = chatConversationParamsSchema.safeParse(request.params)
    const update = chatConversationUpdateRequestSchema.safeParse(request.body)
    if (!params.success || !update.success) {
      return reply.code(400).send({ error: 'A valid conversation update is required.' })
    }
    try {
      const conversation = service.updateConversation(params.data.conversationId, update.data)
      return chatConversationSummarySchema.parse(conversation)
    } catch (error) {
      return sendConversationError(reply, error)
    }
  })

  server.patch(
    '/api/zetro/v1/chat/conversations/:conversationId/provider',
    async (request, reply) => {
      const params = chatConversationParamsSchema.safeParse(request.params)
      const selection = providerSelectionRequestSchema.safeParse(request.body)
      if (!params.success || !selection.success) {
        return reply.code(400).send({ error: 'A valid conversation provider is required.' })
      }
      try {
        return chatConversationProviderResponseSchema.parse(
          await service.selectConversationProvider(params.data.conversationId, selection.data),
        )
      } catch (error) {
        if (error instanceof ChatConversationNotFoundError) {
          return reply.code(404).send({ error: error.message })
        }
        return reply.code(409).send({ error: errorMessage(error) })
      }
    },
  )

  server.get('/api/zetro/v1/chat/history', async (request, reply) => {
    try {
      const conversationId = readConversationId(request.headers)
      return chatHistoryResponseSchema.parse(service.getHistory(conversationId))
    } catch (error) {
      return reply.code(400).send({ error: errorMessage(error) })
    }
  })

  server.post('/api/zetro/v1/chat/stop', async (request, reply) => {
    const parsed = chatStopRequestSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'A valid turn ID is required.' })
    const conversationId = readConversationIdOrReply(request.headers, reply)
    if (!conversationId) return
    try {
      await service.stop(conversationId, parsed.data.turnId)
      return { stopped: true }
    } catch (error) {
      return reply.code(409).send({ error: errorMessage(error) })
    }
  })

  server.post('/api/zetro/v1/chat/turns', async (request, reply) => {
    const parsed = chatPromptRequestSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Prompt and turn ID are required.' })
    const conversationId = readConversationIdOrReply(request.headers, reply)
    if (!conversationId) return

    try {
      const accepted = service.startTurn(conversationId, parsed.data.turnId, parsed.data.prompt)
      return reply.code(202).send(chatTurnAcceptedResponseSchema.parse(accepted))
    } catch (error) {
      return reply.code(409).send({ error: errorMessage(error) })
    }
  })

  server.get('/api/zetro/v1/chat/turns/:turnId/events', async (request, reply) => {
    const params = chatTurnParamsSchema.safeParse(request.params)
    const query = chatEventStreamQuerySchema.safeParse(request.query)
    if (!params.success || !query.success) {
      return reply.code(400).send({ error: 'Valid turn and event sequence values are required.' })
    }
    const conversationId = readConversationIdOrReply(request.headers, reply)
    if (!conversationId) return
    if (!service.hasTurn(conversationId, params.data.turnId)) {
      return reply.code(404).send({ error: 'Chat turn was not found in this conversation.' })
    }

    const abort = new AbortController()
    request.raw.once('close', () => abort.abort())
    openEventStream(reply)
    try {
      await service.observeTurn(
        conversationId,
        params.data.turnId,
        query.data.after,
        abort.signal,
        (event) => reply.raw.write(encodeChatServerEvent(event)),
      )
    } catch (error) {
      reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: errorMessage(error) })}\n\n`)
    } finally {
      reply.raw.end()
    }
  })
}

function sendConversationError(reply: FastifyReply, error: unknown) {
  if (error instanceof ChatConversationNotFoundError) {
    return reply.code(404).send({ error: error.message })
  }
  if (error instanceof ChatConversationConflictError) {
    return reply.code(409).send({ error: error.message })
  }
  return reply.code(500).send({ error: 'The conversation registry failed.' })
}

function readConversationIdOrReply(
  headers: Record<string, string | string[] | undefined>,
  reply: FastifyReply,
) {
  try {
    return readConversationId(headers)
  } catch (error) {
    void reply.code(400).send({ error: errorMessage(error) })
    return undefined
  }
}

function openEventStream(reply: FastifyReply) {
  const allowedOrigin = reply.getHeader('access-control-allow-origin')
  const vary = reply.getHeader('vary')
  reply.hijack()
  reply.raw.statusCode = 200
  if (allowedOrigin) reply.raw.setHeader('access-control-allow-origin', allowedOrigin)
  if (vary) reply.raw.setHeader('vary', vary)
  reply.raw.setHeader('cache-control', 'no-cache, no-transform')
  reply.raw.setHeader('connection', 'keep-alive')
  reply.raw.setHeader('content-type', 'text/event-stream; charset=utf-8')
  reply.raw.setHeader('x-accel-buffering', 'no')
  reply.raw.setHeader('x-content-type-options', 'nosniff')
  reply.raw.flushHeaders()
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Zetro chat request failed.'
}
