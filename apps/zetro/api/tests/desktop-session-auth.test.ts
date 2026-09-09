import assert from 'node:assert/strict'
import test from 'node:test'
import { matchesToken } from '../src/infrastructure/desktop-session-auth.js'

test('desktop session tokens require an exact timing-safe match', () => {
  assert.equal(matchesToken('session-token', 'session-token'), true)
  assert.equal(matchesToken('session-tokeN', 'session-token'), false)
  assert.equal(matchesToken('short', 'session-token'), false)
  assert.equal(matchesToken(undefined, 'session-token'), false)
})
