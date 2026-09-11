import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CompactModelSwitcher } from '../src/components/compact-model-switcher.js'

test('shows a red unavailable connection action beside the model controls', () => {
  const html = renderToStaticMarkup(
    createElement(CompactModelSwitcher, {
      connections: [{ id: 'cxz-codex', label: 'CXZ Codex' }],
      models: [{ id: 'gpt-test', label: 'GPT Test' }],
      onConnect: () => undefined,
      onConnectionChange: () => undefined,
      onModelChange: () => undefined,
      onReasoningChange: () => undefined,
      reasoningLevels: [{ id: 'low', label: 'low' }],
      selectedConnectionId: 'cxz-codex',
      selectedModelId: 'gpt-test',
      selectedReasoningLevel: 'low',
      unavailable: true,
      unavailableLabel: 'CXZ Codex',
    }),
  )

  assert.match(html, /aria-label="CXZ Codex unavailable"/)
  assert.match(html, /border-red-200/)
  assert.match(html, /Start the runtime, then retry/)
})
