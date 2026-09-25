import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { WorkspaceRuntimeStatus } from '../src/blocks/workspace/workspace-runtime-status'
import { WorkspaceRouteChecklist } from '../src/blocks/workspace/workspace-route-checklist'

test('runtime status announces state and keeps measured detail accessible', () => {
  const html = renderToStaticMarkup(createElement(WorkspaceRuntimeStatus, { httpStatus: 200, port: 7001, responseTimeMs: 18, state: 'live' }))
  assert.match(html, /aria-live="polite"/)
  assert.match(html, /Runtime status: Live/)
  assert.match(html, /:7001 · 18ms/)
})

test('route checklist exposes status text instead of color alone', () => {
  const html = renderToStaticMarkup(createElement(WorkspaceRouteChecklist, { items: [{ label: 'Contact route', status: 'ready' }, { label: 'Search submission', status: 'pending' }] }))
  assert.match(html, /Contact route/)
  assert.match(html, /Ready/)
  assert.match(html, /Pending/)
})
