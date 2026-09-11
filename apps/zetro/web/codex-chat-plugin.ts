import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { CodexChatClient } from './codex-chat-client.ts'
import {
  encodeChatStreamEvent,
  type ChatStreamEvent,
} from './src/modules/shell/chat-stream.contract.ts'

const maximumPromptBytes = 64 * 1024

export function codexChatPlugin(): Plugin {
  const client = new CodexChatClient()
  return {
    configurePreviewServer(server) {
      server.middlewares.use('/api/chat', createChatHandler(client))
      server.httpServer?.once('close', () => void client.close())
    },
    configureServer(server) {
      server.middlewares.use('/api/chat', createChatHandler(client))
      server.httpServer?.once('close', () => void client.close())
    },
    name: 'zetro-codex-chat',
  }
}

function createChatHandler(client: CodexChatClient) {
  return (request: IncomingMessage, response: ServerResponse) =>
    handleChatRequest(client, request, response)
}

async function handleChatRequest(
  client: CodexChatClient,
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Use POST for chat requests.' })
    return
  }
  if (!isSameOrigin(request)) {
    sendJson(response, 403, { error: 'Chat requests must come from this Zetro server.' })
    return
  }
  if (!request.headers['content-type']?.startsWith('application/json')) {
    sendJson(response, 415, { error: 'Chat requests must use application/json.' })
    return
  }

  try {
    const body = await readJsonBody(request)
    if (!isPromptRequest(body)) {
      sendJson(response, 400, { error: 'Prompt must be a non-empty string.' })
      return
    }

    openEventStream(response)
    writeEvent(response, { content: body.prompt, type: 'request' })
    let streamedResponse = ''
    const rawResponse = await client.run(body.prompt, (event) => {
      if (event.type === 'response') streamedResponse += event.delta
      writeEvent(response, event)
    })
    if (!streamedResponse) writeEvent(response, { delta: rawResponse, type: 'response' })
    else if (rawResponse.startsWith(streamedResponse)) {
      const remainder = rawResponse.slice(streamedResponse.length)
      if (remainder) writeEvent(response, { delta: remainder, type: 'response' })
    }
    writeEvent(response, { type: 'complete' })
    response.end()
  } catch (error) {
    if (response.headersSent) {
      writeEvent(response, { message: errorMessage(error), type: 'error' })
      response.end()
    } else sendText(response, 500, errorMessage(error))
  }
}

function isSameOrigin(request: IncomingMessage) {
  const origin = request.headers.origin
  if (!origin) return true
  try {
    return new URL(origin).host === request.headers.host
  } catch {
    return false
  }
}

function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolveBody, rejectBody) => {
    const chunks: Buffer[] = []
    let byteLength = 0

    request.on('data', (chunk: Buffer) => {
      byteLength += chunk.length
      if (byteLength > maximumPromptBytes) {
        rejectBody(new Error('Prompt is too large.'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.once('end', () => {
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        rejectBody(new Error('Request body must be valid JSON.'))
      }
    })
    request.once('error', rejectBody)
  })
}

function isPromptRequest(value: unknown): value is { prompt: string } {
  if (!value || typeof value !== 'object') return false
  const prompt = Reflect.get(value, 'prompt')
  return typeof prompt === 'string' && prompt.trim().length > 0
}

function sendJson(response: ServerResponse, statusCode: number, value: unknown) {
  response.statusCode = statusCode
  response.setHeader('content-type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(value))
}

function openEventStream(response: ServerResponse) {
  if (response.headersSent) return
  response.statusCode = 200
  response.setHeader('cache-control', 'no-store')
  response.setHeader('content-type', 'application/x-ndjson; charset=utf-8')
  response.setHeader('x-content-type-options', 'nosniff')
  response.flushHeaders()
}

function writeEvent(response: ServerResponse, event: ChatStreamEvent) {
  response.write(encodeChatStreamEvent(event))
}

function sendText(response: ServerResponse, statusCode: number, value: string) {
  response.statusCode = statusCode
  response.setHeader('content-type', 'text/plain; charset=utf-8')
  response.end(value)
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Could not connect to Codex.'
}
