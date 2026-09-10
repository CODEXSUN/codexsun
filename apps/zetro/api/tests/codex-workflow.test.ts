import assert from 'node:assert/strict'
import test from 'node:test'
import {
  codexWorkflows,
  createDeveloperInstructions,
} from '../src/modules/codex-connection/codex-workflow.js'
import {
  deliveryStageIds,
  parseDeliveryOutput,
} from '../src/modules/codex-connection/codex-delivery.js'
import { chatTurnRequestSchema, createConversationSchema } from '../src/modules/chat/chat.schema.js'

const expectedGuidance = {
  plan: 'Turn the request into a task draft',
  deliver: 'Run this delivery pipeline in order',
  develop: 'implement the smallest complete change',
  document: 'source of truth',
  review: 'prioritized findings',
  test: 'Reproduce the behavior',
} as const

test('package task instructions preserve the package-only write boundary', () => {
  const instructions = createDeveloperInstructions('C:/worktree', 'develop', {
    application: 'ui',
    module: '',
    folderPath: 'packages/ui',
    documentationPaths: ['assist/records/zetro'],
  })
  assert.match(instructions, /connected shared package is ui/)
  assert.match(
    instructions,
    /Approved write folders within this worktree: packages\/ui, assist\/records\/zetro/,
  )
  assert.match(instructions, /Do not edit another application or package/)
})

test('each Zetro workflow adds its focused guidance', () => {
  for (const workflow of codexWorkflows) {
    const instructions = createDeveloperInstructions('C:\\worktrees\\task', workflow)
    assert.match(instructions, new RegExp(expectedGuidance[workflow], 'i'))
    assert.match(instructions, /Read AGENTS\.md/)
    assert.match(instructions, /git rev-parse --show-toplevel/)
    assert.match(instructions, /\$ErrorActionPreference = 'Stop'/)
    assert.match(instructions, /\$LASTEXITCODE after each native command/)
    assert.match(instructions, /Do not commit, push, publish/)
  }
})

test('review and test workflows stay read-only by default', () => {
  for (const workflow of ['review', 'test'] as const) {
    assert.match(
      createDeveloperInstructions('C:\\worktrees\\task', workflow),
      /Work read-only unless the user explicitly asks for fixes/,
    )
  }
})

test('delivery prepares every stage and protects publication', () => {
  const instructions = createDeveloperInstructions('C:\\worktrees\\task', 'deliver')

  for (const stage of [
    'Plan:',
    'Observe:',
    'Review:',
    'Assign:',
    'Implement:',
    'Verify:',
    'Document:',
    'Version:',
    'Publish:',
  ]) {
    assert.match(instructions, new RegExp(stage))
  }
  assert.match(
    instructions,
    /commit and push only when the user explicitly requested both actions/i,
  )
})

test('chat requests default to plan and reject unknown workflows', () => {
  const request = {
    conversationId: '9a5d01ba-7c25-4300-97e8-bb16404906a6',
    messages: [{ attachments: [], content: 'Update this module.', role: 'user' }],
    projectId: '00000000-0000-4000-8000-000000000001',
  }

  assert.equal(chatTurnRequestSchema.parse(request).workflow, 'plan')
  assert.equal(chatTurnRequestSchema.safeParse({ ...request, workflow: 'deploy' }).success, false)
})

test('stored execution records without a workflow default to plan', () => {
  const conversation = createConversationSchema.parse({
    messages: [
      {
        attachments: [],
        content: 'Completed.',
        createdAt: '2026-09-09T02:00:00.000Z',
        execution: {
          activities: [],
          isolation: 'ephemeral-thread',
          tools: ['Read files'],
          worktreePath: 'C:\\worktrees\\task',
        },
        id: 'message-1',
        role: 'assistant',
      },
    ],
    projectId: '00000000-0000-4000-8000-000000000001',
  })

  assert.equal(conversation.messages[0]?.execution?.workflow, 'plan')
})

test('delivery output becomes a timestamped resumable record', () => {
  const output = parseDeliveryOutput(
    JSON.stringify({
      answer: 'The change is ready for publication.',
      stages: deliveryStageIds.map((id) => ({
        evidence: `${id} evidence`,
        id,
        status: id === 'publish' ? 'ready' : 'complete',
      })),
    }),
    '2026-09-08T12:00:00.000Z',
  )

  assert.equal(output.content, 'The change is ready for publication.')
  assert.equal(output.delivery.publicationReady, true)
  assert.equal(output.delivery.stages.length, 9)
  assert.equal(output.delivery.stages[0]?.updatedAt, '2026-09-08T12:00:00.000Z')
})

test('delivery output rejects missing or reordered stages', () => {
  const stages = deliveryStageIds.map((id) => ({ evidence: id, id, status: 'complete' }))
  assert.throws(() =>
    parseDeliveryOutput(JSON.stringify({ answer: 'Invalid.', stages: stages.reverse() })),
  )
})
