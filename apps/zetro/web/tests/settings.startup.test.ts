import assert from 'node:assert/strict'
import test from 'node:test'
import {
  hasCurrentEvidence,
  readStartupPolicy,
  saveStartupPolicy,
  startupPolicyKey,
} from '../src/modules/settings/settings.startup-policy'

test('startup defaults to explicit approval and rejects malformed persisted policy', () => {
  for (const value of [
    null,
    '{}',
    'bad',
    '{"enabled":true}',
    '{"enabled":true,"allowLocalNetwork":true,"extra":1}',
  ]) {
    assert.equal(readStartupPolicy({ getItem: () => value }), null)
  }
  assert.equal(
    readStartupPolicy({
      getItem: () => {
        throw new Error('denied')
      },
    }),
    null,
  )
})

test('remember only the exact approved policy, never readiness or credentials', () => {
  for (const allowLocalNetwork of [false, true]) {
    let value = ''
    saveStartupPolicy(
      {
        setItem: (key, data) => {
          assert.equal(key, startupPolicyKey)
          value = data
        },
      },
      allowLocalNetwork,
    )
    assert.deepEqual(readStartupPolicy({ getItem: () => value }), {
      enabled: true,
      allowLocalNetwork,
    })
  }
})

test('expired, missing, invalid and blocked evidence cannot show ready', () => {
  const now = Date.now()
  assert.equal(
    hasCurrentEvidence({ state: 'verified', expiresAt: new Date(now + 1).toISOString() }, now),
    true,
  )
  for (const expiresAt of [
    null,
    'bad',
    new Date(now).toISOString(),
    new Date(now - 1).toISOString(),
  ]) {
    assert.equal(hasCurrentEvidence({ state: 'verified', expiresAt }, now), false)
  }
  assert.equal(
    hasCurrentEvidence({ state: 'blocked', expiresAt: new Date(now + 1000).toISOString() }, now),
    false,
  )
})
