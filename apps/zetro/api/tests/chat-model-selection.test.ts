import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { chatTurnRequestSchema } from '../src/modules/chat/chat.schema.js'

const validRequest = {
  conversationId: randomUUID(),
  messages: [{ attachments: [], content: 'Review this change.', role: 'user' }],
  projectId: randomUUID(),
}

test('chat turns accept a supported Codex model and reasoning effort', () => {
  const result = chatTurnRequestSchema.parse({
    ...validRequest,
    model: 'gpt-6-astra',
    reasoningEffort: 'high',
  })

  assert.equal(result.model, 'gpt-6-astra')
  assert.equal(result.reasoningEffort, 'high')
  assert.equal(result.workflow, 'develop')
})

test('chat turns keep the account model default and medium reasoning for older clients', () => {
  const result = chatTurnRequestSchema.parse(validRequest)

  assert.equal(result.model, undefined)
  assert.equal(result.reasoningEffort, 'medium')
})

test('chat turns reject unknown models and display-only reasoning labels', () => {
  assert.equal(
    chatTurnRequestSchema.safeParse({ ...validRequest, model: 'unknown-model' }).success,
    false,
  )
  assert.equal(
    chatTurnRequestSchema.safeParse({ ...validRequest, reasoningEffort: 'hard' }).success,
    false,
  )
})
