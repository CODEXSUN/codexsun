import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ExecutionStatus, type ExecutionStatusProps } from '../src/blocks/execution-status/index.js'

function render(state: ExecutionStatusProps['state'], animated = true) {
  return renderToStaticMarkup(
    createElement(ExecutionStatus, {
      state,
      animated,
      title: 'Observed execution',
      description: 'No estimate',
      elapsed: '24s',
      metrics: [{ label: 'Updates', value: 3 }],
    }),
  )
}

test('active state exposes indeterminate progress without a fabricated percentage', () => {
  const html = render('active')
  assert.match(html, /role="progressbar"/)
  assert.doesNotMatch(html, /aria-valuenow/)
  assert.match(html, /motion-safe:animate-spin/)
  assert.match(html, /motion-safe:animate-pulse/)
})

test('idle, complete, and attention states do not show active progress', () => {
  for (const state of ['idle', 'complete', 'attention'] as const) {
    const html = render(state)
    assert.doesNotMatch(html, /role="progressbar"|animate-spin|animate-pulse/)
    assert.match(html, /Updates/)
  }
})

test('motion pause preserves activity semantics without animation', () => {
  const html = render('active', false)
  assert.match(html, /role="progressbar"/)
  assert.doesNotMatch(html, /animate-spin|animate-pulse/)
})
