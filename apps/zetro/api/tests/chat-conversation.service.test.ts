import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ChatConversationRepository } from '../src/modules/chat/chat.conversation.repository.js'
import { ChatConversationService } from '../src/modules/chat/chat.conversation.service.js'

test('creates short titles and orders pinned conversations first', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-history-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const repository = new ChatConversationRepository(join(directory, 'conversations.json'))
  await repository.initialize()
  const service = new ChatConversationService(repository)

  const first = await service.create([
    {
      attachments: [],
      content: 'Plan a focused launch checklist with owners, dates, risks, and clear outcomes',
      id: 'message-1',
      role: 'user',
    },
  ])
  const second = await service.create([
    {
      attachments: [],
      content: 'Review today tasks',
      id: 'message-2',
      role: 'user',
    },
  ])
  const renamed = await service.update(first.id, { pinned: true, title: 'Launch checklist' })

  assert.equal(first.title, 'Plan a focused launch checklist with owners,…')
  assert.equal(renamed.title, 'Launch checklist')
  assert.equal(renamed.pinned, true)
  assert.deepEqual(
    service.list().map(({ id }) => id),
    [first.id, second.id],
  )
})

test('persists a delivery record with its assistant message', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-delivery-history-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const filePath = join(directory, 'conversations.json')
  const repository = new ChatConversationRepository(filePath)
  await repository.initialize()
  const service = new ChatConversationService(repository)
  const stages = [
    'plan',
    'observe',
    'review',
    'assign',
    'implement',
    'verify',
    'document',
    'version',
    'publish',
  ] as const

  const conversation = await service.create([
    {
      attachments: [],
      content: 'Delivery complete.',
      execution: {
        activities: [],
        delivery: {
          publicationReady: true,
          stages: stages.map((id) => ({
            evidence: `${id} complete`,
            id,
            status: id === 'publish' ? 'ready' : 'complete',
            updatedAt: '2026-09-08T12:00:00.000Z',
          })),
        },
        isolation: 'ephemeral-thread',
        tools: ['Read files'],
        worktreePath: 'C:\\worktrees\\task',
        workflow: 'deliver',
      },
      id: 'message-delivery',
      role: 'assistant',
    },
  ])

  const restoredRepository = new ChatConversationRepository(filePath)
  await restoredRepository.initialize()
  const restored = new ChatConversationService(restoredRepository).get(conversation.id)
  assert.equal(restored.messages[0]?.execution?.delivery?.publicationReady, true)
  assert.equal(restored.messages[0]?.execution?.delivery?.stages.length, 9)
})
