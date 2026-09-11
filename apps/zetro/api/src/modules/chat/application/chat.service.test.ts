import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import type { ChatStreamEvent } from '@codexsun/zetro-contracts'
import type {
  ProviderRunRequest,
  ProviderRunResult,
  ProviderRunner,
} from '../../providers/index.js'
import { ChatService } from './chat.service.js'
import { ChatRepository } from '../infrastructure/chat.repository.js'

const conversationA = 'a0b0c0d0-1111-4111-8111-111111111111'
const conversationB = 'b0b0c0d0-2222-4222-8222-222222222222'
const turnA = '48a7f6ea-3793-49da-b846-02592c2f2223'
const turnB = '58a7f6ea-3793-49da-b846-02592c2f2224'

test('different conversations run together and one conversation stays ordered', async () => {
  await withService(async (service, runner) => {
    service.startTurn(conversationA, turnA, 'First')
    service.startTurn(conversationB, turnB, 'Second')
    assert.deepEqual(runner.activeConversationIds(), [])
    await runner.settled()
    assert.deepEqual(runner.activeConversationIds(), [conversationA, conversationB])
    assert.throws(
      () => service.startTurn(conversationA, '68a7f6ea-3793-49da-b846-02592c2f2225', 'Blocked'),
      /already responding/,
    )
    runner.complete(conversationA, 'A')
    runner.complete(conversationB, 'B')
    await runner.settled()
  })
})

test('stop targets the exact active turn', async () => {
  await withService(async (service, runner) => {
    service.startTurn(conversationA, turnA, 'First')
    await runner.settled()
    assert.throws(() => service.stop(conversationA, turnB), /not the active/)
    await service.stop(conversationA, turnA)
    assert.equal(runner.stoppedConversationId, conversationA)
    runner.complete(conversationA, 'Stopped')
    await runner.settled()
  })
})

test('shutdown drains an active failure before SQLite closes', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'zetro-chat-service-test-'))
  const databasePath = join(directory, 'zetro.sqlite')
  const repository = new ChatRepository(databasePath)
  const runner = new ControlledRunner()
  const service = new ChatService(repository, runner)
  try {
    service.startTurn(conversationA, turnA, 'First')
    await service.close()
    const reopened = new ChatRepository(databasePath)
    assert.equal(reopened.getHistory(conversationA).turns[0]?.status, 'failed')
    reopened.close()
  } finally {
    rmSync(directory, { force: true, maxRetries: 3, recursive: true, retryDelay: 20 })
  }
})

test('conversation registry blocks active archives and reports missing records', async () => {
  await withService(async (service, runner) => {
    const created = service.createConversation(conversationA, 'Workspace')
    assert.equal(created.title, 'Workspace')
    service.startTurn(conversationA, turnA, 'First')
    await runner.settled()
    assert.throws(
      () => service.updateConversation(conversationA, { archived: true }),
      /Stop the active response/,
    )
    assert.throws(
      () => service.updateConversation(conversationB, { title: 'Missing' }),
      /not found/,
    )
    runner.complete(conversationA, 'Done')
    await runner.settled()
    assert.equal(
      service.updateConversation(conversationA, { archived: true }).archivedAt !== undefined,
      true,
    )
  })
})

async function withService(run: (service: ChatService, runner: ControlledRunner) => Promise<void>) {
  const directory = mkdtempSync(join(tmpdir(), 'zetro-chat-service-test-'))
  const repository = new ChatRepository(join(directory, 'zetro.sqlite'))
  const runner = new ControlledRunner()
  const service = new ChatService(repository, runner)
  try {
    await run(service, runner)
    await service.close()
  } finally {
    rmSync(directory, { force: true, maxRetries: 3, recursive: true, retryDelay: 20 })
  }
}

class ControlledRunner implements ProviderRunner {
  private readonly turns = new Map<
    string,
    {
      onEvent: (event: ChatStreamEvent) => void
      reject: (error: Error) => void
      resolve: (result: ProviderRunResult) => void
    }
  >()
  stoppedConversationId?: string

  activeConversationIds() {
    return [...this.turns.keys()].sort()
  }

  async close() {
    for (const turn of this.turns.values()) turn.reject(new Error('Controlled shutdown.'))
    await this.settled()
  }

  complete(conversationId: string, content: string) {
    const turn = this.turns.get(conversationId)
    if (!turn) throw new Error('Controlled turn was not found.')
    turn.onEvent({ delta: content, type: 'response' })
    turn.resolve({ content, status: 'complete' })
  }

  getActiveConnection() {
    return testConnection
  }

  run(request: ProviderRunRequest) {
    request.onProviderThread(`provider-${request.conversationId}`)
    return new Promise<ProviderRunResult>((resolve, reject) => {
      this.turns.set(request.conversationId, { onEvent: request.onEvent, reject, resolve })
    }).finally(() => this.turns.delete(request.conversationId))
  }

  async settled() {
    await new Promise((resolve) => setImmediate(resolve))
  }

  async stop(conversationId: string) {
    this.stoppedConversationId = conversationId
  }
}

const testConnection = {
  authStatus: 'authenticated',
  enabled: true,
  id: 'codex-local',
  kind: 'codex-app-server',
  label: 'Codex',
  model: 'test-model',
  reasoningEffort: 'low',
  updatedAt: 0,
} as const
