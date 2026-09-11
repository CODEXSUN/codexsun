import assert from 'node:assert/strict'
import test from 'node:test'
import { cxzDeveloperInstructions } from './codex-runtime.js'

test('identifies CXZ with its configured Codex model and reasoning level', () => {
  const instructions = cxzDeveloperInstructions('gpt-5.6-luna', 'low')

  assert.match(instructions, /I am CXZ, powered by Codex GPT-5\.6-Luna with low reasoning\./)
  assert.match(instructions, /Never reveal private chain-of-thought\./)
})
