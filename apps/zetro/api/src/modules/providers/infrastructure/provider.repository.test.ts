import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ProviderRepository } from './provider.repository.js'

test('provider selection, model, effort, and account metadata survive restart', () => {
  const directory = mkdtempSync(join(tmpdir(), 'zetro-provider-test-'))
  const databasePath = join(directory, 'zetro.sqlite')
  try {
    const first = new ProviderRepository(databasePath, 'http://127.0.0.1:6155')
    first.select({ connectionId: 'cxz-codex', model: 'gpt-5.6-luna', reasoningEffort: 'high' }, 10)
    first.updateAccount('codex-local', 'authenticated', 'codex@example.test', 11)
    first.close()

    const reopened = new ProviderRepository(databasePath, 'http://127.0.0.1:6155')
    const settings = reopened.getSettings()
    assert.equal(settings.selectedConnectionId, 'cxz-codex')
    assert.deepEqual(
      settings.connections.map(({ id }) => id),
      ['codex-local', 'cxz-codex'],
    )
    const cxz = settings.connections.find(({ id }) => id === 'cxz-codex')
    assert.equal(cxz?.model, 'gpt-5.6-luna')
    assert.equal(cxz?.reasoningEffort, 'high')
    const codex = settings.connections.find(({ id }) => id === 'codex-local')
    assert.equal(codex?.authStatus, 'authenticated')
    assert.equal(codex?.accountLabel, 'codex@example.test')
    reopened.close()
  } finally {
    rmSync(directory, { force: true, maxRetries: 3, recursive: true, retryDelay: 20 })
  }
})
