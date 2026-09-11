import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Sparkline } from '../src/components/sparkline'

test('sparkline renders svg with path for data points', () => {
  const html = renderToStaticMarkup(
    createElement(Sparkline, {
      data: [10, 25, 15, 30, 45, 20],
      height: 32,
      tone: 'positive',
      type: 'line',
      width: 120,
    }),
  )

  assert.match(html, /<svg/)
  assert.match(html, /role="img"/)
  assert.match(html, /<path/)
  assert.match(html, /stroke-emerald/)
  assert.match(html, /<circle/)
})

test('sparkline supports area variant and trend delta badge', () => {
  const html = renderToStaticMarkup(
    createElement(Sparkline, {
      data: [100, 150],
      showTrendBadge: true,
      tone: 'primary',
      type: 'area',
    }),
  )

  assert.match(html, /<linearGradient/)
  assert.match(html, /\+50\.0%/)
})

test('sparkline supports bar variant', () => {
  const html = renderToStaticMarkup(
    createElement(Sparkline, {
      data: [10, 20, 30],
      tone: 'warning',
      type: 'bar',
    }),
  )

  assert.match(html, /<rect/)
  assert.match(html, /fill-amber/)
})
