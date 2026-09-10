import assert from 'node:assert/strict'
import test from 'node:test'
import Fastify from 'fastify'
import { ChatService } from '../src/modules/chat/chat.service.js'
import { streamChatTurn } from '../src/modules/chat/chat.stream.js'
import type { ChatTurnRequest, ChatTurnResponse } from '../src/modules/chat/chat.types.js'

test('disconnect requests interruption instead of leaving the turn unattended', async () => {
  let stopped!: () => void
  let finish!: () => void
  const interrupted = new Promise<void>((resolve) => {
    stopped = resolve
  })
  const gate = new Promise<void>((resolve) => {
    finish = resolve
  })
  const service = new ChatService({
    async respond() {
      await gate
      throw new Error('Interrupted')
    },
    async stop() {
      stopped()
      finish()
      return true
    },
  })
  const app = Fastify()
  app.post('/', (_request, reply) =>
    streamChatTurn(reply, service, { conversationId: 'test' } as ChatTurnRequest),
  )
  let timeout: NodeJS.Timeout | undefined
  try {
    const address = await app.listen({ host: '127.0.0.1', port: 0 })
    const response = await fetch(address, { method: 'POST', signal: AbortSignal.timeout(5000) })
    const reader = response.body!.getReader()
    await reader.read()
    await reader.cancel()
    await Promise.race([
      interrupted,
      new Promise<void>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error('Interruption was not requested')), 3000)
      }),
    ])
  } finally {
    clearTimeout(timeout)
    finish()
    await app.close()
  }
})

test('chat sends public progress before provider completion', async () => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const result: ChatTurnResponse = {
    responseId: 'test',
    model: 'test',
    message: { role: 'assistant', content: 'Done' },
    execution: {
      activities: [],
      isolation: 'ephemeral-thread',
      tools: [],
      worktreePath: 'test',
      workflow: 'review',
    },
  }
  const service = new ChatService({
    async respond(request) {
      request.onProgress?.({
        kind: 'response',
        itemId: 'message-1',
        text: 'Inspecting the sidebar',
      })
      request.onProgress?.({
        kind: 'tool',
        itemId: 'tool-1',
        activity: { kind: 'command', label: 'token=secret', status: 'running' },
      })
      await gate
      return result
    },
    async stop() {
      release()
      return true
    },
  })
  const app = Fastify()
  app.post('/', (_request, reply) =>
    streamChatTurn(reply, service, { conversationId: 'test' } as ChatTurnRequest),
  )
  try {
    const address = await app.listen({ host: '127.0.0.1', port: 0 })
    const response = await fetch(address, { method: 'POST', signal: AbortSignal.timeout(5000) })
    assert.match(response.headers.get('content-type') ?? '', /application\/x-ndjson/)
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let text = ''
    while (!text.includes('Inspecting the sidebar')) {
      const chunk = await reader.read()
      assert.equal(chunk.done, false)
      text += decoder.decode(chunk.value)
    }
    assert.ok(!text.includes('"type":"result"'))
    release()
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      text += decoder.decode(chunk.value)
    }
    assert.ok(text.includes('"type":"result"'))
    assert.ok(!text.includes('token=secret'))
    reader.releaseLock()
  } finally {
    release()
    await app.close()
  }
})
