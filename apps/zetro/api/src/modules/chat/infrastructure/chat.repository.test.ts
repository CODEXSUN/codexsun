import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { chatMigrations } from './chat.migrations.js'
import { ChatRepository } from './chat.repository.js'

const conversationId = 'a0b0c0d0-1111-4111-8111-111111111111'
const turnId = '48a7f6ea-3793-49da-b846-02592c2f2223'
const connection = {
  connectionId: 'local-codex',
  kind: 'codex-app-server' as const,
  label: 'Codex',
  model: 'gpt-5.6-terra',
  reasoningEffort: 'medium' as const,
}
const conversationProvider = {
  connectionId: connection.connectionId,
  model: connection.model,
  reasoningEffort: connection.reasoningEffort,
  status: 'unverified' as const,
}

test('chat history and provider context survive a repository restart', () => {
  withRepository((first, databasePath) => {
    assert.deepEqual(first.startTurn(conversationId, turnId, 'Hello', 100, connection), {
      event: { content: 'Hello', type: 'request' },
      sequence: 1,
    })
    first.appendEvent(turnId, { delta: 'Hi', type: 'response' })
    first.setProviderThreadId(conversationId, connection.connectionId, 'provider-thread-1')
    first.finishTurn(turnId, 'complete', { type: 'complete' })
    first.close()

    const second = new ChatRepository(databasePath)
    const history = second.getHistory(conversationId)
    assert.equal(history.conversationId, conversationId)
    assert.equal(history.turns[0]?.status, 'complete')
    assert.deepEqual(history.turns[0]?.connection, connection)
    assert.deepEqual(history.turns[0]?.events, [
      { event: { content: 'Hello', type: 'request' }, sequence: 1 },
      { event: { delta: 'Hi', type: 'response' }, sequence: 2 },
      { event: { type: 'complete' }, sequence: 3 },
    ])
    assert.equal(
      second.getProviderThreadId(conversationId, connection.connectionId),
      'provider-thread-1',
    )
    second.close()
  })
})

test('a conversation keeps one provider thread for each connection', () => {
  withRepository((repository, databasePath) => {
    repository.createConversation(conversationId, undefined, 100, conversationProvider)
    repository.setProviderThreadId(conversationId, 'local-codex', 'local-thread')
    repository.setProviderThreadId(conversationId, 'cxz-codex', 'cxz-thread')
    const updated = repository.updateConversationProvider(
      conversationId,
      {
        connectionId: 'cxz-codex',
        latencyMs: 24,
        model: 'gpt-5.6-terra',
        reasoningEffort: 'high',
        status: 'verified',
        verifiedAt: 200,
      },
      200,
    )
    assert.deepEqual(updated?.provider, {
      connectionId: 'cxz-codex',
      latencyMs: 24,
      model: 'gpt-5.6-terra',
      reasoningEffort: 'high',
      status: 'verified',
      verifiedAt: 200,
    })
    repository.close()

    const reopened = new ChatRepository(databasePath)
    assert.equal(reopened.getProviderThreadId(conversationId, 'local-codex'), 'local-thread')
    assert.equal(reopened.getProviderThreadId(conversationId, 'cxz-codex'), 'cxz-thread')
    assert.equal(reopened.getConversationProvider(conversationId)?.connectionId, 'cxz-codex')
    reopened.close()
  })
})

test('one conversation accepts only one active turn', () => {
  withRepository((repository) => {
    repository.startTurn(conversationId, turnId, 'First', 100, connection)
    assert.throws(
      () =>
        repository.startTurn(
          conversationId,
          '58a7f6ea-3793-49da-b846-02592c2f2224',
          'Second',
          101,
          connection,
        ),
      /already responding/,
    )
    assert.equal(repository.getHistory(conversationId).turns.length, 1)
    repository.close()
  })
})

test('startup converts an interrupted turn to one durable terminal error', () => {
  withRepository((first, databasePath) => {
    first.startTurn(conversationId, turnId, 'Hello', 100, connection)
    first.appendEvent(turnId, { delta: 'Partial', type: 'response' })
    first.close()

    const second = new ChatRepository(databasePath)
    const turn = second.getHistory(conversationId).turns[0]
    assert.equal(turn?.status, 'failed')
    assert.equal(turn?.events.at(-1)?.event.type, 'error')
    assert.equal(turn?.events.at(-1)?.sequence, 3)
    second.close()
  })
})

test('conversation registry creates, titles, orders, archives, and restores records', () => {
  withRepository((repository) => {
    const secondConversationId = 'b0b0c0d0-2222-4222-8222-222222222222'
    assert.equal(
      repository.createConversation(conversationId, undefined, 100, conversationProvider).title,
      'New conversation',
    )
    repository.createConversation(
      secondConversationId,
      'Named workspace',
      200,
      conversationProvider,
    )
    repository.startTurn(conversationId, turnId, '  First registry prompt  ', 300, connection)
    repository.finishTurn(turnId, 'complete', { type: 'complete' })

    const active = repository.listConversations('active')
    assert.equal(active[0]?.id, conversationId)
    assert.equal(active[0]?.title, 'First registry prompt')
    assert.equal(active[0]?.turnCount, 1)
    assert.equal(active[0]?.lastTurnStatus, 'complete')

    const renamed = repository.updateConversation(
      secondConversationId,
      { archived: true, title: 'Archived workspace' },
      400,
    )
    assert.equal(renamed?.archivedAt, 400)
    assert.deepEqual(
      repository.listConversations('archived').map(({ id }) => id),
      [secondConversationId],
    )
    assert.throws(
      () =>
        repository.startTurn(
          secondConversationId,
          '58a7f6ea-3793-49da-b846-02592c2f2224',
          'Blocked while archived',
          450,
          connection,
        ),
      /Restore this conversation/,
    )
    assert.deepEqual(
      repository.listConversations('active').map(({ id }) => id),
      [conversationId],
    )
    assert.equal(repository.listConversations('all').length, 2)

    const restored = repository.updateConversation(secondConversationId, { archived: false }, 500)
    assert.equal(restored?.archivedAt, undefined)
    assert.equal(restored?.title, 'Archived workspace')
    repository.close()
  })
})

test('registry migration preserves version 2 session data as a conversation', () => {
  const directory = mkdtempSync(join(tmpdir(), 'zetro-chat-migration-test-'))
  const databasePath = join(directory, 'zetro.sqlite')
  try {
    createVersionTwoDatabase(databasePath)
    const repository = new ChatRepository(databasePath)
    const history = repository.getHistory(conversationId)
    assert.equal(history.turns[0]?.prompt, 'Migrated')
    assert.equal(repository.getProviderThreadId(conversationId, 'codex-local'), 'provider-thread-2')
    assert.equal(repository.listConversations('active')[0]?.title, 'Migrated')
    repository.close()
  } finally {
    rmSync(directory, { force: true, maxRetries: 3, recursive: true, retryDelay: 20 })
  }
})

function withRepository(run: (repository: ChatRepository, databasePath: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), 'zetro-chat-test-'))
  const databasePath = join(directory, 'zetro.sqlite')
  try {
    run(new ChatRepository(databasePath), databasePath)
  } finally {
    rmSync(directory, { force: true, maxRetries: 3, recursive: true, retryDelay: 20 })
  }
}

function createVersionTwoDatabase(databasePath: string) {
  const database = new DatabaseSync(databasePath)
  database.exec(`
    CREATE TABLE zetro_schema_migrations (
      version INTEGER PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    ) STRICT
  `)
  for (const migration of chatMigrations.slice(0, 2)) {
    database.exec(migration.sql)
    const checksum = createHash('sha256').update(migration.sql).digest('hex')
    database
      .prepare('INSERT INTO zetro_schema_migrations VALUES (?, ?, ?)')
      .run(migration.version, checksum, 100)
  }
  database
    .prepare(
      `INSERT INTO chat_sessions (id, created_at, updated_at, provider_thread_id)
       VALUES (?, 100, 100, 'provider-thread-2')`,
    )
    .run(conversationId)
  database
    .prepare(
      `INSERT INTO chat_turns (id, session_id, prompt, status, started_at, completed_at)
       VALUES (?, ?, 'Migrated', 'complete', 100, 101)`,
    )
    .run(turnId, conversationId)
  database.close()
}
