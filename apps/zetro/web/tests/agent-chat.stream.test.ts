import assert from 'node:assert/strict'
import test from 'node:test'
import { readChatStream } from '../src/modules/agent-chat/agent-chat.stream.js'

test('stream parser handles split UTF-8 frames and requires a terminal result', async () => {
  const frame =
    JSON.stringify({ type: 'progress', id: 'one', kind: 'response', text: 'Hello 世界' }) + '\n'
  const bytes = new TextEncoder().encode(frame)
  const items: string[] = []
  const response = new Response(
    new ReadableStream({
      start(controller) {
        for (const byte of bytes) controller.enqueue(new Uint8Array([byte]))
        controller.close()
      },
    }),
  )
  await assert.rejects(
    readChatStream(response, (item) => items.push(item.text)),
    /ended before completion/,
  )
  assert.deepEqual(items, ['Hello 世界'])
})

test('stream parser surfaces provider errors instead of completing', async () => {
  await assert.rejects(
    readChatStream(
      new Response('{"type":"error","message":"Sandbox verification required"}\n'),
      () => undefined,
    ),
    /Sandbox verification required/,
  )
})

test('stream parser validates and returns the final response', async () => {
  const result = {
    responseId: 'one',
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
  assert.deepEqual(
    await readChatStream(
      new Response(JSON.stringify({ type: 'result', response: result }) + '\n'),
      () => undefined,
    ),
    result,
  )
})
