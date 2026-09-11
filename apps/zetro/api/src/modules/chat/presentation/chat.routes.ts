import {
  chatHistoryResponseSchema,
  chatTurnAcceptedResponseSchema,
  encodeChatServerEvent,
} from '@codexsun/zetro-contracts'
import type { FastifyInstance, FastifyReply } from 'fastify'
import { ChatService } from '../application/chat.service.js'
import { chatPromptRequestSchema, readChatSession } from './chat.schema.js'

export async function registerChatRoutes(server: FastifyInstance, service: ChatService) {
  server.get('/api/zetro/v1/chat/history', async (request, reply) => {
    try {
      const sessionId = readChatSession(request.headers)
      return chatHistoryResponseSchema.parse(service.getHistory(sessionId))
    } catch (error) {
      return reply.code(400).send({ error: errorMessage(error) })
    }
  })

  server.post('/api/zetro/v1/chat/stop', async (request, reply) => {
    try {
      await service.stop(readChatSession(request.headers))
      return { stopped: true }
    } catch (error) {
      return reply.code(409).send({ error: errorMessage(error) })
    }
  })

  server.post('/api/zetro/v1/chat/turns', async (request, reply) => {
    const parsed = chatPromptRequestSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Prompt and turn ID are required.' })

    try {
      const accepted = service.startTurn(
        readChatSession(request.headers),
        parsed.data.turnId,
        parsed.data.prompt,
      )
      return reply.code(202).send(chatTurnAcceptedResponseSchema.parse(accepted))
    } catch (error) {
      return reply.code(409).send({ error: errorMessage(error) })
    }
  })

  server.get('/api/zetro/v1/chat/turns/:turnId/events', async (request, reply) => {
    const { turnId } = request.params as { turnId?: string }
    const afterSequence = readAfterSequence(request.query)
    if (!turnId) return reply.code(400).send({ error: 'Turn ID is required.' })

    let sessionId: string
    try {
      sessionId = readChatSession(request.headers)
    } catch (error) {
      return reply.code(400).send({ error: errorMessage(error) })
    }

    const abort = new AbortController()
    request.raw.once('close', () => abort.abort())
    openEventStream(reply)
    try {
      await service.observeTurn(sessionId, turnId, afterSequence, abort.signal, (event) => {
        reply.raw.write(encodeChatServerEvent(event))
      })
    } catch (error) {
      reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: errorMessage(error) })}\n\n`)
    } finally {
      reply.raw.end()
    }
  })
}

function readAfterSequence(query: unknown) {
  if (!query || typeof query !== 'object') return 0
  const value = Reflect.get(query, 'after')
  if (value === undefined) return 0
  const sequence = Number(value)
  return Number.isSafeInteger(sequence) && sequence >= 0 ? sequence : 0
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
