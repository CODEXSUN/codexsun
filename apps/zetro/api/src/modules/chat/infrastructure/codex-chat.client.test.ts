import assert from 'node:assert/strict'
import test from 'node:test'
import { codexIdentityInstructions } from './codex-chat.client.js'

test('identifies local Codex with its configured model and reasoning level', () => {
  const instructions = codexIdentityInstructions('gpt-5.6-terra', 'medium')

  assert.match(instructions, /I am Codex, powered by GPT-5\.6-Terra with medium reasoning\./)
  assert.match(instructions, /Never reveal private chain-of-thought\./)
})
