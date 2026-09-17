import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MarkdownContent } from '../src/components/markdown-content.js'

test('renders assistant Markdown as structured and safe HTML', () => {
  const html = renderToStaticMarkup(
    createElement(MarkdownContent, {
      content: [
        'A portal for **buyers and sellers**.',
        '',
        '1. Clarify the business model',
        '',
        '- Who are the users?',
        '  - One account can use both roles.',
        '',
        'Store records in `users`.',
        '',
        '<script>alert("unsafe")</script>',
      ].join('\n'),
    }),
  )

  assert.match(html, /<strong>buyers and sellers<\/strong>/)
  assert.match(html, /<ol/)
  assert.match(html, /<ul/)
  assert.match(html, /<code[^>]*>users<\/code>/)
  assert.doesNotMatch(html, /<script>/)
})
