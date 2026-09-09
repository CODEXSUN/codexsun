import assert from 'node:assert/strict'
import test from 'node:test'
import { createRunSchema } from '../src/modules/crew-control/crew-control.schema.js'

test('control API rejects a traversal workspace identifier', () => {
  assert.equal(
    createRunSchema.safeParse({ prompt: 'inspect', provider: 'codex', workspaceId: '../main' })
      .success,
    false,
  )
})
