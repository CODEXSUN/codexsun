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

test('working set keeps prompt and response evidence with independent categories', () => {
  withRepository((repository, databasePath) => {
    repository.startTurn(conversationId, turnId, 'Show a visual task-row idea.', 100, connection)
    repository.appendEvent(turnId, { delta: 'Use an inline decision control.', type: 'response' })
    repository.finishTurn(turnId, 'complete', { type: 'complete' })

    repository.setHandoffItem(conversationId, turnId, {
      category: 'visual-reference',
      selected: true,
      sourceKind: 'prompt',
    })
    repository.setHandoffItem(conversationId, turnId, {
      category: 'decision',
      selected: true,
      sourceKind: 'response',
    })

    assert.deepEqual(
      repository.listHandoffItems().map(({ category, content, sourceKind }) => ({ category, content, sourceKind })),
      [
        { category: 'visual-reference', content: 'Show a visual task-row idea.', sourceKind: 'prompt' },
        { category: 'decision', content: 'Use an inline decision control.', sourceKind: 'response' },
      ],
    )
    repository.close()

    const reopened = new ChatRepository(databasePath)
    assert.equal(reopened.listHandoffItems().length, 2)
    reopened.close()
  })
})

test('an inline decision persists and enters the Working Set', () => {
  withRepository((repository, databasePath) => {
    repository.startTurn(conversationId, turnId, 'Plan this.', 100, connection)
    repository.finishTurn(turnId, 'complete', { type: 'complete' })
    repository.upsertDecision(conversationId, turnId, {
      answerKind: 'custom', answerText: 'Use browser storage first.', question: 'Which storage should this use?', questionIndex: 0,
    })
    assert.deepEqual(repository.listDecisions(conversationId, turnId).map(({ answerKind, answerText, question }) => ({ answerKind, answerText, question })), [
      { answerKind: 'custom', answerText: 'Use browser storage first.', question: 'Which storage should this use?' },
    ])
    assert.equal(repository.listHandoffItems().at(-1)?.sourceKind, 'decision')
    repository.close()
    const reopened = new ChatRepository(databasePath)
    assert.equal(reopened.listDecisions(conversationId, turnId)[0]?.answerText, 'Use browser storage first.')
    reopened.close()
  })
})

test('Working Set supports leaving off one decision and clearing every item', () => {
  withRepository((repository) => {
    repository.startTurn(conversationId, turnId, 'Plan this.', 100, connection)
    repository.appendEvent(turnId, { delta: 'Plan details.', type: 'response' })
    repository.finishTurn(turnId, 'complete', { type: 'complete' })
    repository.setHandoffItem(conversationId, turnId, { category: 'reference', selected: true, sourceKind: 'response' })
    const decision = repository.upsertDecision(conversationId, turnId, {
      answerKind: 'yes', question: 'Use browser storage?', questionIndex: 0,
    })
    assert.equal(repository.listHandoffItems().length, 2)
    assert.equal(repository.removeDecision(conversationId, decision.id).length, 1)
    assert.deepEqual(repository.clearHandoffItems(), [])
    assert.equal(repository.listDecisions(conversationId, turnId).length, 0)
    repository.close()
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
  const datab