import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SiteHeader } from '../src/layouts/site-header/index'

test('site header renders announcement bar, brand, links, and cart badge', () => {
  const html = renderToStaticMarkup(
    createElement(SiteHeader, {
      actions: {
        cartCount: 3,
        ctaLabel: 'Shop Now',
        showCart: true,
        showCta: true,
      },
      announcement: {
        actionLabel: 'Details',
        actionUrl: '/promo',
        message: 'Free shipping on orders over $50',
      },
      brand: {
        badge: 'Store',
        title: 'CodexShop',
      },
      categories: [
        { href: '/cat/electronics', id: 'el', label: 'Electronics' },
        { href: '/cat/apparel', id: 'ap', label: 'Apparel' },
      ],
      links: [
        { href: '/shop', label: 'Shop', badge: 'Sale' },
        { href: '/about', label: 'About' },
      ],
    }),
  )

  assert.match(html, /Free shipping on orders over \$50/)
  assert.match(html, /CodexShop/)
  assert.match(html, /Store/)
  assert.match(html, /Shop/)
  assert.match(html, /Sale/)
  assert.match(html, /Shopping cart with 3 items/)
  assert.match(html, /Shop Now/)
  assert.match(html, /Electronics/)
  assert.match(html, /Apparel/)
})

test('site header can render in minimal portfolio mode without categories and cart', () => {
  const html = renderToStaticMarkup(
    createElement(SiteHeader, {
      actions: {
        ctaLabel: 'Hire Me',
        showCart: false,
        showSearch: false,
      },
      brand: {
        tagline: 'Staff Software Architect',
        title: 'Alex Chen',
      },
      links: [
        { href: '#work', label: 'Projects' },
        { href: '#contact', label: 'Contact' },
      ],
      showCategories: false,
    }),
  )

  assert.match(html, /Alex Chen/)
  assert.match(html, /Staff Software Architect/)
  assert.match(html, /Projects/)
  assert.match(html, /Hire Me/)
  assert.doesNotMatch(html, /Shopping cart/)
  assert.doesNotMatch(html, /Category navigation/)
})
