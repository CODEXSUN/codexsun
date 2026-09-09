import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ChatConversationRepository } from '../src/modules/chat/chat.conversation.repository.js'
import {
  ChatConversationNotArchivedError,
  ChatConversationNotFoundError,
  ChatConversationService,
} from '../src/modules/chat/chat.conversation.service.js'
import { validateChatWorkspaceScope } from '../src/modules/chat/chat.scope.js'
import { openTestDatabase } from './test-database.js'

const projectId = '00000000-0000-4000-8000-000000000001'
const databases = new Map<string, Awaited<ReturnType<typeof openTestDatabase>>>()
test.after(async () => Promise.all([...databases.values()].map((database) => database.close())))

async function repository(directory: string, filePath = join(directory, 'conversations.json')) {
  let database = databases.get(directory)
  if (!database) {
    database = await openTestDatabase(directory)
    databases.set(directory, database)
  }
  return new ChatConversationRepository(database, filePath, projectId)
}

test('creates short titles and orders pinned conversations first', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-history-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const chatRepository = await repository(directory)
  await chatRepository.initialize()
  const service = new ChatConversationService(chatRepository)

  const first = await service.create(projectId, [
    {
      attachments: [],
      content: 'Plan a focused launch checklist with owners, dates, risks, and clear outcomes',
      createdAt: '2026-09-08T12:00:00.000Z',
      id: 'message-1',
      role: 'user',
    },
  ])
  const second = await service.create(projectId, [
    {
      attachments: [],
      content: 'Review today tasks',
      createdAt: '2026-09-08T12:01:00.000Z',
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
  const chatRepository = await repository(directory, filePath)
  await chatRepository.initialize()
  const service = new ChatConversationService(chatRepository)
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
      createdAt: '2026-09-08T12:00:00.000Z',
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

  const restoredRepository = await repository(directory, filePath)
  await restoredRepository.initialize()
  const restored = new ChatConversationService(restoredRepository).get(conversation.id)
  assert.equal(restored.messages[0]?.execution?.delivery?.publicationReady, true)
  assert.equal(restored.messages[0]?.execution?.delivery?.stages.length, 9)
})

test('archives, restores, and permanently deletes conversations', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-archive-history-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const chatRepository = await repository(directory)
  await chatRepository.initialize()
  const service = new ChatConversationService(chatRepository)
  const conversation = await service.create(projectId, [
    {
      attachments: [],
      content: 'Archive this chat',
      createdAt: '2026-09-08T12:00:00.000Z',
      id: 'message-archive',
      role: 'user',
    },
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
  const chatRepository = await repository(directory)
  await chatRepository.initialize()
  const service = new ChatConversationService(chatRepository)
  const first = await service.create(projectId, [
    {
      attachments: [],
      content: 'First chat',
      createdAt: '2026-09-08T12:00:00.000Z',
      id: 'message-first',
      role: 'user',
    },
  ])
  const second = await service.create(projectId, [
    {
      attachments: [],
      content: 'Second chat',
      createdAt: '2026-09-08T12:01:00.000Z',
      id: 'message-second',
      role: 'user',
    },
  ])

  await service.update(first.id, { archived: true })
  assert.equal(await service.deleteArchived(projectId), 1)
  assert.equal(service.list(projectId, true).length, 0)
  assert.equal(service.list(projectId)[0]?.id, second.id)
})

test('keeps project conversations isolated', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-project-history-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const chatRepository = await repository(directory)
  await chatRepository.initialize()
  const service = new ChatConversationService(chatRepository)
  const otherProjectId = '11111111-1111-4111-8111-111111111111'

  await service.create(projectId, [
    {
      attachments: [],
      content: 'Default project',
      createdAt: '2026-09-08T12:00:00.000Z',
      id: 'default-message',
      role: 'user',
    },
  ])
  await service.create(otherProjectId, [
    {
      attachments: [],
      content: 'Other project',
      createdAt: '2026-09-08T12:01:00.000Z',
      id: 'other-message',
      role: 'user',
    },
  ])

  assert.equal(service.list(projectId).length, 1)
  assert.equal(service.list(otherProjectId).length, 1)
})

test('stores and validates a chat workspace scope inside the project', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-chat-scope-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const modulePath = join(directory, 'apps', 'zetro')
  await mkdir(modulePath, { recursive: true })
  const chatRepository = await repository(directory)
  await chatRepository.initialize()
  const service = new ChatConversationService(chatRepository)
  const scope = await validateChatWorkspaceScope(directory, {
    application: 'zetro',
    folderPath: 'apps\\zetro',
    module: 'agent-chat',
  })
  const conversation = await service.create(
    projectId,
    [
      {
        attachments: [],
        content: 'Scoped chat',
        createdAt: '2026-09-08T12:00:00.000Z',
        id: 'message-scope',
        role: 'user',
      },
    ],
    scope,
  )

  assert.deepEqual(conversation.scope, {
    application: 'zetro',
    folderPath: 'apps/zetro',
    module: 'agent-chat',
  })
  await assert.rejects(
    validateChatWorkspaceScope(directory, {
      application: 'outside',
      folderPath: '..',
      module: '',
    }),
  )
})

test('adds conversation timestamps to legacy messages during startup', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-message-time-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const filePath = join(directory, 'conversations.json')
  const conversationId = '22222222-2222-4222-8222-222222222222'
  await writeFile(
    filePath,
    JSON.stringify([
      {
        createdAt: '2026-09-07T10:30:00.000Z',
        id: conversationId,
        messages: [{ attachments: [], content: 'Legacy chat', id: 'legacy', role: 'user' }],
        pinned: false,
        projectId,
        title: 'Legacy chat',
        updatedAt: '2026-09-07T10:30:00.000Z',
      },
    ]),
  )

  const chatRepository = await repository(directory, filePath)
  await chatRepository.initialize()

  assert.equal(
    chatRepository.find(conversationId)?.messages[0]?.createdAt,
    '2026-09-07T10:30:00.000Z',
  )
})
