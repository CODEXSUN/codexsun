import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BlogHeader } from '../src/layouts/blog-header/index'

test('blog header renders reading progress, brand badge, back to store, and topics', () => {
  const html = renderToStaticMarkup(
    createElement(BlogHeader, {
      backToStoreHref: '/store',
      backToStoreLabel: 'Return to Store',
      brand: {
        badge: 'Engineering Journal',
        title: 'Codex Insights',
      },
      readingProgress: 45,
      topics: [
        { active: true, href: '#tech', id: 'tech', label: 'Technology', postCount: 18 },
        { href: '#design', id: 'design', label: 'Product Design', postCount: 7 },
      ],
    }),
  )

  assert.match(html, /Return to Store/)
  assert.match(html, /Codex Insights/)
  assert.match(html, /Engineering Journal/)
  assert.match(html, /Technology/)
  assert.match(html, /Product Design/)
  assert.match(html, /width:\s*45%/)
})
