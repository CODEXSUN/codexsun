import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SiteFooter } from '../src/blocks/footer/index'

test('site footer renders brand, columns, newsletter, and payment badges', () => {
  const html = renderToStaticMarkup(
    createElement(SiteFooter, {
      brand: {
        description: 'Curated modern hardware and lifestyle design tools.',
        title: 'Codex Studios',
      },
      columns: [
        {
          links: [{ href: '#catalog', label: 'Browse Catalog' }],
          title: 'Products',
        },
      ],
      paymentBadges: ['Visa', 'Mastercard', 'PayPal'],
    }),
  )

  assert.match(html, /Codex Studios/)
  assert.match(html, /Curated modern hardware/)
  assert.match(html, /Browse Catalog/)
  assert.match(html, /Subscribe to our newsletter/)
  assert.match(html, /Visa/)
  assert.match(html, /Mastercard/)
  assert.match(html, /PayPal/)
})
