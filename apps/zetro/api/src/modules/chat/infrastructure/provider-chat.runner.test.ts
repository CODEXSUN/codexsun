import assert from 'node:assert/strict'
import test from 'node:test'
import type { ProviderConnection } from '@codexsun/zetro-contracts'
import { isRuntimeIdentityRequest, runtimeIdentity } from './provider-chat.runner.js'

const cxz: ProviderConnection = {
  authStatus: 'authenticated',
  baseUrl: 'http://127.0.0.1:6155/codex',
  enabled: true,
  id: 'cxz-codex',
  kind: 'cxz-codex',
  label: 'CXZ Codex',
  model: 'gpt-5.6-terra',
  reasoningEffort: 'high',
  updatedAt: 1,
}

test('recognizes runtime model and reasoning questions', () => {
  assert.equal(isRuntimeIdentityRequest('tell your model name and reasoning model name'), true)
  assert.equal(
    isRuntimeIdentityRequest(
      'Tell me your runtime name, provider, exact selected model, and configured reasoning level.',
    ),
    true,
  )
  assert.equal(isRuntimeIdentityRequest('Compare reasoning models for this project.'), false)
})

test('reports active CXZ metadata without relying on model self-report', () => {
  assert.equal(
    runtimeIdentity(cxz),
    'I am CXZ, powered by Codex GPT-5.6-Terra with high reasoning.',
  )
})
