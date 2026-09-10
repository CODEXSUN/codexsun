import { PassThrough } from 'node:stream'
import type { FastifyReply } from 'fastify'
import type { ChatService } from './chat.service.js'
import type { ChatTurnRequest } from './chat.types.js'
import { ChatProviderError } from './chat.provider.js'

export function streamChatTurn(reply: FastifyReply, service: ChatService, input: ChatTurnRequest) {
  const stream = new PassThrough()
  let settled = false
  function write(event: unknown) {
    if (stream.destroyed) return
    if (stream.writableLength > 1_000_000) {
      stream.destroy(new Error('Chat stream consumer is too slow.'))
      return
    }
    stream.write(`${JSON.stringify(event)}\n`)
  }
  stream.on('close', () => {
    if (!settled) void service.stop(input.conversationId).catch(() => undefined)
  })
  reply.header('Content-Type', 'application/x-ndjson; charset=utf-8')
  reply.header('Cache-Control', 'no-store')
  reply.header('X-Accel-Buffering', 'no')
  reply.send(stream)
  write({ type: 'status', message: 'Preparing workspace and connecting to the agent…' })
  const heartbeat = setInterval(() => write({ type: 'heartbeat' }), 10_000)
  heartbeat.unref()
  void Promise.resolve()
    .then(() =>
      service.respond({
        ...input,
        onProgress(event) {
          if (event.kind === 'response')
            write({
              type: 'progress',
              id: event.itemId ?? 'response',
              kind: 'response',
              text: redact(event.text).slice(-8000),
            })
          else
            write({
              type: 'progress',
              id: event.itemId,
              kind: 'tool',
              text: `${event.activity.kind}: ${redact(event.activity.label).slice(0, 500)} · ${event.activity.status}`,
            })
        },
      }),
    )
    .then((response) => write({ type: 'result', response }))
    .catch((error: unknown) => {
      write({
        type: 'error',
        message:
          error instanceof ChatProviderError
            ? error.message
            : 'Zetro could not complete this turn.',
      })
    })
    .finally(() => {
      settled = true
      clearInterval(heartbeat)
      stream.end()
    })
  return reply
}

function redact(text: string) {
  return text
    .replace(/(authorization|api[-_]?key|password|token)\s*[:=]\s*[^\s]+/giu, '$1=[redacted]')
    .replace(/https?:\/\/[^\s:@]+:[^\s@]+@/gu, 'https://[redacted]@')
}
