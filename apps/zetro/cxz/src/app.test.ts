import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import type { ChatStreamEvent } from '@codexsun/zetro-contracts'
import { createApp } from './app.js'

function controls() {
  const codex = {
    account: async () => ({ authenticated: true, label: 'Codex test' }),
    close: async () => undefined,
    deviceLogin: async () => ({
      loginId: 'login-1',
      userCode: 'ABCD-EFGH',
      verificationUrl: 'https://example.com',
    }),
    models: async () => [
      {
        description: 'Fast',
        displayName: 'Test Codex',
        id: 'codex-test',
        isDefault: true,
        supportedReasoningEfforts: ['low' as const],
      },
    ],
    smoke: async () => ({
      completedAt: 20,
      latencyMs: 8,
      ok: true as const,
      response: 'ZETRO_SMOKE_OK' as const,
    }),
    run: async (input: { onEvent(event: ChatStreamEvent): void; onThread(id: string): void }) => {
      input.onThread('thread-1')
      input.onEvent({ delta: 'hello', type: 'response' })
      return { content: 'hello', status: 'complete' as const }
    },
    stop: async () => undefined,
  }
  return { codex }
}

test('reports live health and Codex readiness', async () => {
  const { codex } = controls()
  const app = createApp(codex)
  assert.equal((await app.inject({ method: 'GET', url: '/health' })).statusCode, 200)
  assert.equal((await app.inject({ method: 'GET', url: '/codex/health/ready' })).statusCode, 200)
  await app.close()
})

test('confirms an authenticated model and reasoning selection', async () => {
  const { codex } = controls()
  const app = createApp(codex)
  const response = await app.inject({
    method: 'POST',
    payload: { connectionId: 'cxz-codex', model: 'codex-test', reasoningEffort: 'low' },
    url: '/codex/selection/confirm',
  })
  assert.equal(response.statusCode, 200)
  const body = response.json()
  assert.deepEqual(body, {
    accountLabel: 'Codex test',
    confirmedAt: body.confirmedAt,
    connected: true,
    connectionId: 'cxz-codex',
    model: 'codex-test',
    providerLabel: 'CXZ Codex',
    reasoningEffort: 'low',
    runtime: 'cxz',
    smoke: {
      completedAt: 20,
      latencyMs: 8,
      ok: true,
      response: 'ZETRO_SMOKE_OK',
    },
  })
  await app.close()
})

test('proxies Zetro selection and adds confirmation for an older API response', async () => {
  const zetro = createServer((_request, response) => {
    response.setHeader('content-type', 'application/json')
    response.end(
      JSON.stringify({
        connections: [
          {
            authStatus: 'authenticated',
            baseUrl: 'http://127.0.0.1:6155/codex',
            enabled: true,
            id: 'cxz-codex',
            kind: 'cxz-codex',
            label: 'CXZ Codex',
            model: 'codex-test',
            reasoningEffort: 'low',
            updatedAt: 1,
          },
        ],
        selectedConnectionId: 'cxz-codex',
      }),
    )
  })
  await new Promise<void>((resolve) => zetro.listen(0, '127.0.0.1', resolve))
  const address = zetro.address()
  assert.ok(address && typeof address === 'object')
  const { codex } = controls()
  const app = createApp(codex, `http://127.0.0.1:${address.port}`)
  try {
    const response = await app.inject({
      method: 'PATCH',
      payload: { connectionId: 'cxz-codex', model: 'codex-test', reasoningEffort: 'low' },
      url: '/zetro/providers/default',
    })
    assert.equal(response.statusCode, 200)
    assert.equal(response.json().confirmation.runtime, 'cxz')

    const synchronized = await app.inject({ method: 'GET', url: '/zetro/providers' })
    assert.equal(synchronized.statusCode, 200)
    assert.equal(synchronized.json().confirmation, undefined)
  } finally {
    await app.close()
    await new Promise<void>((resolve, reject) =>
      zetro.close((error) => (error ? reject(error) : resolve())),
    )
  }
})

test('streams Codex thread identity, response deltas, and completion', async () => {
  const { codex } = controls()
  const app = createApp(codex)
  const response = await app.inject({
    method: 'POST',
    payload: {
      conversationId: 'cabff188-c482-443c-8b40-14b0e01bcb93',
      messages: [{ content: 'hi', role: 'user' }],
      model: 'codex-test',
      prompt: 'hi',
      reasoningEffort: 'low',
    },
    url: '/codex/v1/chat/completions',
  })
  assert.equal(response.statusCode, 200)
  const events = response.body
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as { type: string })
  assert.deepEqual(
    events.map(({ type }) => type),
    ['provider-thread', 'response', 'complete'],
  )
  await app.close()
})
