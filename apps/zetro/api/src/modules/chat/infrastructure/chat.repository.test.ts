import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ChatRepository } from './chat.repository.js'

test('chat history survives a repository restart', () => {
  const directory = mkdtempSync(join(tmpdir(), 'zetro-chat-test-'))
  const databasePath = join(directory, 'zetro.sqlite')
  const sessionId = 'session-1'
  const turnId = '48a7f6ea-3793-49da-b846-02592c2f2223'

  try {
    const first = new ChatRepository(databasePath)
    first.startTurn(sessionId, turnId, 'Hello', 100)
    first.appendEvent(turnId, { content: 'Hello', type: 'request' })
    first.appendEvent(turnId, { delta: 'Hi', type: 'response' })
    first.appendEvent(turnId, { type: 'complete' })
    first.setProviderThreadId(sessionId, 'provider-thread-1')
    first.finishTurn(turnId, 'complete')
    first.close()

    const second = new ChatRepository(databasePath)
    const history = second.getHistory(sessionId)

    assert.equal(history.turns.length, 1)
    assert.equal(history.turns[0]?.prompt, 'Hello')
    assert.equal(history.turns[0]?.status, 'complete')
    assert.deepEqual(history.turns[0]?.events, [
      { event: { content: 'Hello', type: 'request' }, sequence: 1 },
      { event: { delta: 'Hi', type: 'response' }, sequence: 2 },
      { event: { type: 'complete' }, sequence: 3 },
    ])
    assert.equal(second.getProviderThreadId(sessionId), 'provider-thread-1')
    second.close()
  } finally {
    rmSync(directory, { force: true, recursive: true })
  }
})
