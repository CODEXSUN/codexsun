import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ExecutionChecks, ExecutionStatus } from '../src/blocks/execution-status'

test('checklist exposes text and icons, not color alone', () => {
  const html = renderToStaticMarkup(
    createElement(ExecutionChecks, {
      checks: [
        { label: 'Allowed folder', state: 'passed' },
        { label: 'Network', state: 'failed' },
        { label: 'Old evidence', state: 'expired' },
      ],
    }),
  )
  for (const text of [
    'passed',
    'failed',
    'expired',
    'text-success',
    'text-destructive',
    'text-warning',
  ])
    assert.ok(html.includes(text))
})

test('startup splash provides details toggle and no fabricated percentage', () => {
  const html = renderToStaticMarkup(
    createElement(ExecutionStatus, {
      splash: true,
      state: 'active',
      title: 'Preparing',
      description: 'Observed checks',
      elapsed: '2s',
      metrics: [],
    }),
  )
  assert.ok(html.includes('Application startup'))
  assert.ok(html.includes('Compact view'))
  assert.ok(!html.includes('aria-valuenow'))
})
