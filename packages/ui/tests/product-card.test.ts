import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ProductCard } from '../src/blocks/product-card/index'

test('product card renders image, title, price, discount badge, and rating', () => {
  const product = {
    brand: 'AudioPro',
    colors: [
      { hex: '#000000', id: 'c1', name: 'Black' },
      { hex: '#ffffff', id: 'c2', name: 'White' },
    ],
    discountPercent: 25,
    id: 'prod-1',
    imageUrl: '/images/headphones.jpg',
    originalPrice: 199.99,
    price: 149.99,
    rating: 4.8,
    reviewCount: 142,
    title: 'Wireless Noise-Canceling Headphones',
  }

  const html = renderToStaticMarkup(
    createElement(ProductCard, {
      product,
    }),
  )

  assert.match(html, /AudioPro/)
  assert.match(html, /Wireless Noise-Canceling Headphones/)
  assert.match(html, /-25%/)
  assert.match(html, /\$149\.99/)
  assert.match(html, /\$199\.99/)
  assert.match(html, /4\.8/)
  assert.match(html, /\(142\)/)
  assert.match(html, /Select color Black/)
  assert.match(html, /Select color White/)
})

test('product card shows out of stock state', () => {
  const product = {
    id: 'prod-2',
    imageUrl: '/images/keyboard.jpg',
    inStock: false,
    price: 89.0,
    title: 'Mechanical Keyboard',
  }

  const html = renderToStaticMarkup(
    createElement(ProductCard, {
      product,
    }),
  )

  assert.match(html, /Out of stock/)
  assert.match(html, /disabled/)
})
