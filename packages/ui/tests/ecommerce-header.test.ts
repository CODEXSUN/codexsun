import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EcommerceHeader } from '../src/layouts/ecommerce-header/index'

test('ecommerce header renders announcement, brand, search, categories, and cart count', () => {
  const html = renderToStaticMarkup(
    createElement(EcommerceHeader, {
      actions: {
        cartCount: 4,
        cartSubtotal: '$129.99',
        wishlistCount: 2,
      },
      announcement: {
        actionHref: '#promo',
        actionLabel: 'Claim Now',
        message: 'Spring Flash Sale: 20% off all items!',
        showFreeShippingMeter: true,
      },
      brand: {
        title: 'CodexMart',
      },
      categories: [
        { href: '#electronics', id: 'cat-1', label: 'Audio & Tech' },
        { href: '#lifestyle', id: 'cat-2', label: 'Lifestyle' },
      ],
      popularSearches: ['Headphones', 'Desk Mat'],
      supportPhone: '1-800-CODEX',
    }),
  )

  assert.match(html, /Spring Flash Sale/)
  assert.match(html, /Claim Now/)
  assert.match(html, /CodexMart/)
  assert.match(html, /Audio &amp; Tech/)
  assert.match(html, /1-800-CODEX/)
  assert.match(html, /\$129\.99/)
})
