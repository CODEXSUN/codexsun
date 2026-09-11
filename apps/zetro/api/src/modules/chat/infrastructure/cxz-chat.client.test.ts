import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import type { ChatStreamEvent, ProviderConnection } from '@codexsun/zetro-contracts'
import { CxzChatClient } from './cxz-chat.client.js'

test('forwards CXZ stream events and preserves the provider thread', async () => {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'application/x-ndjson' })
    response.write(`${JSON.stringify({ threadId: 'thread-1', type: 'provider-thread' })}\n`)
    response.write(`${JSON.stringify({ delta: 'hello', type: 'response' })}\n`)
    response.end(`${JSON.stringify({ content: 'hello', status: 'complete', type: 'complete' })}\n`)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  const events: ChatStreamEvent[] = []
  let providerThreadId = ''
  const client = new CxzChatClient()
  try {
    const result = await client.run({
      connection: connection(`http://127.0.0.1:${address.port}`),
      conversationId: 'cabff188-c482-443c-8b40-14b0e01bcb93',
      messages: [{ content: 'hi', role: 'user' }],
      onEvent: (event) => events.push(event),
      onProviderThread: (threadId) => {
        providerThreadId = threadId
      },
      prompt: 'hi',
    })
    assert.deepEqual(result, { content: 'hello', status: 'complete' })
    assert.equal(providerThreadId, 'thread-1')
    assert.equal(events.at(-1)?.type, 'response')
  } finally {
    server.close()
  }
})

function connection(baseUrl: string): ProviderConnection {
  return {
    authStatus: 'authenticated',
    baseUrl,
    enabled: true,
    id: 'cxz-test',
    kind: 'cxz-codex',
    label: 'CXZ test',
    model: 'gpt-test',
    reasoningEffort: 'low',
    updatedAt: Date.now(),
  }
}
