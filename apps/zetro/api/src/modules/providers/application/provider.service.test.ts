import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import type { CodexProviderControl } from './provider.ports.js'
import { ProviderService } from './provider.service.js'
import { ProviderRepository } from '../infrastructure/provider.repository.js'

const remoteModel = {
  description: 'Fast CXZ model',
  displayName: 'CXZ Test',
  id: 'cxz-test',
  isDefault: true,
  supportedReasoningEfforts: ['low' as const],
}

test('persists a CXZ selection only after the runtime confirms it', async () => {
  const runtime = createServer((request, response) => {
    response.setHeader('content-type', 'application/json')
    if (request.url === '/codex/models') {
      response.end(JSON.stringify({ models: [remoteModel] }))
      return
    }
    if (request.url === '/codex/selection/confirm') {
      response.end(
        JSON.stringify({
          accountLabel: 'cxz@example.test',
          confirmedAt: 20,
          connected: true,
          connectionId: 'cxz-codex',
          model: 'cxz-test',
          providerLabel: 'CXZ Codex',
          reasoningEffort: 'low',
          runtime: 'cxz',
          smoke: {
            completedAt: 20,
            latencyMs: 8,
            ok: true,
            response: 'ZETRO_SMOKE_OK',
          },
        }),
      )
      return
    }
    response.statusCode = 404
    response.end('{}')
  })
  await new Promise<void>((resolve) => runtime.listen(0, '127.0.0.1', resolve))
  const address = runtime.address()
  assert.ok(address && typeof address === 'object')
  const directory = mkdtempSync(join(tmpdir(), 'zetro-provider-confirmation-'))
  const repository = new ProviderRepository(
    join(directory, 'zetro.sqlite'),
    `http://127.0.0.1:${address.port}`,
  )
  const service = new ProviderService(repository, codexControl())

  try {
    const settings = await service.select({
      connectionId: 'cxz-codex',
      model: 'cxz-test',
      reasoningEffort: 'low',
    })
    assert.equal(settings.selectedConnectionId, 'cxz-codex')
    assert.equal(settings.confirmation?.runtime, 'cxz')
    assert.equal(repository.getConnection('cxz-codex')?.model, 'cxz-test')
  } finally {
    repository.close()
    await new Promise<void>((resolve, reject) =>
      runtime.close((error) => (error ? reject(error) : resolve())),
    )
    rmSync(directory, { force: true, recursive: true })
  }
})

test('restarts local Codex and persists only after its live smoke succeeds', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'zetro-provider-local-smoke-'))
  const repository = new ProviderRepository(join(directory, 'zetro.sqlite'), 'http://cxz.test')
  const calls: string[] = []
  const service = new ProviderService(repository, {
    listModels: async () => {
      calls.push('models')
      return [remoteModel]
    },
    readAccount: async () => {
      calls.push('account')
      return { authenticated: true, label: 'fresh@example.test · plus' }
    },
    restart: async () => {
      calls.push('restart')
    },
    smoke: async () => {
      calls.push('smoke')
      return {
        completedAt: 30,
        latencyMs: 10,
        ok: true,
        response: 'ZETRO_SMOKE_OK',
      }
    },
    startDeviceLogin: async () => {
      throw new Error('Not used in this test.')
    },
  })

  try {
    const settings = await service.select({
      connectionId: 'codex-local',
      model: remoteModel.id,
      reasoningEffort: 'low',
    })
    assert.deepEqual(calls, ['restart', 'models', 'account', 'smoke'])
    assert.equal(settings.confirmation?.smoke.response, 'ZETRO_SMOKE_OK')
    assert.equal(repository.getConnection('codex-local')?.accountLabel, 'fresh@example.test · plus')
  } finally {
    repository.close()
    rmSync(directory, { force: true, recursive: true })
  }
})

function codexControl(): CodexProviderControl {
  return {
    listModels: async () => [],
    readAccount: async () => ({ authenticated: true }),
    restart: async () => undefined,
    smoke: async () => ({
      completedAt: 20,
      latencyMs: 8,
      ok: true,
      response: 'ZETRO_SMOKE_OK',
    }),
    startDeviceLogin: async () => {
      throw new Error('Not used in this test.')
    },
  }
}
