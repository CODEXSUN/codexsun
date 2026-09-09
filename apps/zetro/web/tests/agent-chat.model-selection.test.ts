import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getCodexModelLabel,
  toCodexTurnSelection,
  type ZetroPreferences,
} from '../src/modules/settings/settings.preferences.js'

const preferences: ZetroPreferences = {
  codexModel: 'gpt-5.6-sol',
  defaultWorkflow: 'develop',
  interfaceTopology: false,
  reasoningLevel: 'medium',
}

test('maps the visible model and reasoning labels to the Codex turn contract', () => {
  assert.equal(getCodexModelLabel(preferences.codexModel), 'GPT-5.6 Sol')
  assert.deepEqual(toCodexTurnSelection(preferences), {
    model: 'gpt-5.6-sol',
    reasoningEffort: 'medium',
  })
})

test('omits the model when the user selects the Codex account default', () => {
  assert.deepEqual(
    toCodexTurnSelection({ ...preferences, codexModel: 'default', reasoningLevel: 'hard' }),
    { model: undefined, reasoningEffort: 'high' },
  )
})
