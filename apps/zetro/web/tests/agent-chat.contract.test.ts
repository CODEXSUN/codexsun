import assert from 'node:assert/strict'
import test from 'node:test'
import {
  chatTurnResponseSchema,
  conversationResponseSchema,
} from '../src/modules/agent-chat/agent-chat.schema.js'

const activity = { kind: 'command', label: 'npm run check', status: 'failed' }
const execution = {
  activities: [{ ...activity, details: 'Command exited with code 1.' }],
  isolation: 'ephemeral-thread',
  tools: ['Run commands'],
  worktreePath: 'C:/worktrees/test',
  workflow: 'develop',
}
const response = {
  execution,
  message: { role: 'assistant', content: 'The check failed.' },
  model: 'test-model',
  responseId: 'response-1',
}

test('accepts bounded command details in a completed chat response', () => {
  assert.equal(
    chatTurnResponseSchema.parse(response).execution.activities[0]?.details,
    'Command exited with code 1.',
  )
})

test('accepts command details when reopening saved conversation history', () => {
  const conversation = conversationResponseSchema.parse({
    conversation: {
      id: '00000000-0000-4000-8000-000000000001',
      projectId: '00000000-0000-4000-8000-000000000002',
      title: 'Contract regression',
      scope: {
        application: 'platform',
        module: 'identity',
        folderPath: 'apps/platform',
        documentationPaths: ['assist/records/platform', 'assist/tasks'],
      },
      pinned: false,
      createdAt: '2026-09-10T00:00:00Z',
      updatedAt: '2026-09-10T00:00:00Z',
      messages: [
        {
          ...response.message,
          id: 'message-1',
          attachments: [],
          createdAt: '2026-09-10T00:00:00Z',
          execution,
        },
      ],
    },
  }).conversation
  assert.equal(
    conversation.messages[0]?.execution?.activities[0]?.details,
    execution.activities[0]?.details,
  )
  assert.deepEqual(conversation.scope?.documentationPaths, [
    'assist/records/platform',
    'assist/tasks',
  ])
})

test('preserves legacy activities without details and rejects invalid or unknown fields', () => {
  const parseActivity = (value: unknown) =>
    chatTurnResponseSchema.safeParse({
      ...response,
      execution: { ...execution, activities: [value] },
    })
  assert.equal(parseActivity(activity).success, true)
  assert.equal(parseActivity({ ...activity, details: 'x'.repeat(2_000) }).success, true)
  assert.equal(parseActivity({ ...activity, details: 'x'.repeat(2_001) }).success, false)
  assert.equal(parseActivity({ ...activity, details: 123 }).success, false)
  assert.equal(parseActivity({ ...activity, unexpected: true }).success, false)
})
