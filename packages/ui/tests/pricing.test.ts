import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PricingTable } from '../src/blocks/pricing/index'

test('pricing table renders tiers, popular badge, and features', () => {
  const tiers = [
    {
      description: 'For personal projects',
      features: [
        { label: '1 project', highlight: false },
        { label: 'Community support', highlight: false },
        { label: 'Custom domain', excluded: true },
      ],
      id: 'starter',
      monthlyPrice: 0,
      name: 'Starter',
    },
    {
      badge: 'Most Popular',
      description: 'For growing businesses',
      features: [
        { label: 'Unlimited projects', highlight: true },
        { label: 'Priority 24/7 support', highlight: true },
        { label: 'Custom domain', highlight: false },
      ],
      id: 'pro',
      isPopular: true,
      monthlyPrice: 29,
      name: 'Professional',
    },
  ]

  const html = renderToStaticMarkup(
    createElement(PricingTable, {
      tiers,
      title: 'Simple Pricing',
    }),
  )

  assert.match(html, /Simple Pricing/)
  assert.match(html, /Starter/)
  assert.match(html, /Professional/)
  assert.match(html, /Most Popular/)
  assert.match(html, /\$29/)
  assert.match(html, /Unlimited projects/)
  assert.match(html, /Custom domain/)
})
