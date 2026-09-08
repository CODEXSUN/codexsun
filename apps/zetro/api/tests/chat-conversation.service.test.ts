import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ChatConversationRepository } from '../src/modules/chat/chat.conversation.repository.js'
import {
  ChatConversationNotArchivedError,
  ChatConversationNotFoundError,
  ChatConversationService,
} from '../src/modules/chat/chat.conversation.service.js'

const projectId = '00000000-0000-4000-8000-000000000001'

test('creates short titles and orders pinned conversations first', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-history-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const repository = new ChatConversationRepository(
    join(directory, 'conversations.json'),
    projectId,
  )
  await repository.initialize()
  const service = new ChatConversationService(repository)

  const first = await service.create(projectId, [
    {
      attachments: [],
      content: 'Plan a focused launch checklist with owners, dates, risks, and clear outcomes',
      id: 'message-1',
      role: 'user',
    },
  ])
  const second = await service.create(projectId, [
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
    service.list(projectId).map(({ id }) => id),
    [first.id, second.id],
  )
})

test('persists a delivery record with its assistant message', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-delivery-history-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const filePath = join(directory, 'conversations.json')
  const repository = new ChatConversationRepository(filePath, projectId)
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

  const conversation = await service.create(projectId, [
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

  const restoredRepository = new ChatConversationRepository(filePath, projectId)
  await restoredRepository.initialize()
  const restored = new ChatConversationService(restoredRepository).get(conversation.id)
  assert.equal(restored.messages[0]?.execution?.delivery?.publicationReady, true)
  assert.equal(restored.messages[0]?.execution?.delivery?.stages.length, 9)
})

test('archives, restores, and permanently deletes conversations', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-archive-history-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const repository = new ChatConversationRepository(
    join(directory, 'conversations.json'),
    projectId,
  )
  await repository.initialize()
  const service = new ChatConversationService(repository)
  const conversation = await service.create(projectId, [
    { attachments: [], content: 'Archive this chat', id: 'message-archive', role: 'user' },
  ])

  await assert.rejects(
    service.delete(conversation.id),
    (error: unknown) => error instanceof ChatConversationNotArchivedError,
  )

  const archived = await service.update(conversation.id, { archived: true })
  assert.ok(archived.archivedAt)
  assert.equal(service.list(projectId).length, 0)
  assert.equal(service.list(projectId, true).length, 1)

  const restored = await service.update(conversation.id, { archived: false })
  assert.equal(restored.archivedAt, undefined)
  assert.equal(service.list(projectId).length, 1)

  await service.update(conversation.id, { archived: true })
  await service.delete(conversation.id)
  assert.throws(() => service.get(conversation.id), ChatConversationNotFoundError)
})

test('permanently deletes every archived conversation and keeps active history', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-delete-archive-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const repository = new ChatConversationRepository(
    join(directory, 'conversations.json'),
    projectId,
  )
  await repository.initialize()
  const service = new ChatConversationService(repository)
  const first = await service.create(projectId, [
    { attachments: [], content: 'First chat', id: 'message-first', role: 'user' },
  ])
  const second = await service.create(projectId, [
    { attachments: [], content: 'Second chat', id: 'message-second', role: 'user' },
  ])

  await service.update(first.id, { archived: true })
  assert.equal(await service.deleteArchived(projectId), 1)
  assert.equal(service.list(projectId, true).length, 0)
  assert.equal(service.list(projectId)[0]?.id, second.id)
})

test('keeps project conversations isolated', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-project-history-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const repository = new ChatConversationRepository(
    join(directory, 'conversations.json'),
    projectId,
  )
  await repository.initialize()
  const service = new ChatConversationService(repository)
  const otherProjectId = '11111111-1111-4111-8111-111111111111'

  await service.create(projectId, [
    { attachments: [], content: 'Default project', id: 'default-message', role: 'user' },
  ])
  await service.create(otherProjectId, [
    { attachments: [], content: 'Other project', id: 'other-message', role: 'user' },
  ])

  assert.equal(service.list(projectId).length, 1)
  assert.equal(service.list(otherProjectId).length, 1)
})
