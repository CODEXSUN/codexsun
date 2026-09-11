import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  CategoryShowcase,
  CheckoutWizard,
  CouponWallet,
  DeliveryTracker,
  PaymentMethodSelector,
  PriceHistoryChart,
  ProductComparison,
  ReviewsSection,
  StorefrontCart,
  WishlistGrid,
} from '../src/blocks/ecommerce/index'

test('storefront cart renders items, quantities, and subtotal', () => {
  const html = renderToStaticMarkup(
    createElement(StorefrontCart, {
      isDrawer: false,
      items: [
        {
          id: 'item-1',
          image: '/test.jpg',
          price: '$49.99',
          priceValue: 49.99,
          quantity: 2,
          title: 'Wireless Studio Headphones',
          variant: 'Midnight Black',
        },
      ],
      open: true,
    }),
  )

  assert.match(html, /Wireless Studio Headphones/)
  assert.match(html, /Midnight Black/)
  assert.match(html, /\$99\.98/)
  assert.match(html, /Proceed to Checkout/)
})

test('category showcase renders title and category cards', () => {
  const html = renderToStaticMarkup(
    createElement(CategoryShowcase, {
      categories: [
        {
          badge: 'Popular',
          href: '#electronics',
          id: 'el',
          itemCount: 1420,
          title: 'Consumer Electronics',
        },
      ],
      title: 'Catalog Departments',
    }),
  )

  assert.match(html, /Catalog Departments/)
  assert.match(html, /Consumer Electronics/)
  assert.match(html, /1,420 products/)
  assert.match(html, /Popular/)
})

test('checkout wizard renders step form and order summary', () => {
  const html = renderToStaticMarkup(
    createElement(CheckoutWizard, {
      items: [{ id: '1', image: '/img.jpg', price: '$80.00', quantity: 1, title: 'Ergonomic Chair' }],
      subtotal: 80,
    }),
  )

  assert.match(html, /Shipping Destination/)
  assert.match(html, /Order Summary/)
  assert.match(html, /Ergonomic Chair/)
  assert.match(html, /Continue to Payment/)
})

test('product comparison renders table and feature rows', () => {
  const html = renderToStaticMarkup(
    createElement(ProductComparison, {
      featureGroups: [
        {
          features: [{ key: 'battery', label: 'Battery Life' }],
          groupName: 'Hardware Specs',
        },
      ],
      products: [
        {
          attributes: { battery: '40 Hours' },
          id: 'p1',
          image: '/p1.jpg',
          inStock: true,
          price: '$199',
          rating: 4.8,
          title: 'Acoustic Pro Headphones',
        },
      ],
    }),
  )

  assert.match(html, /Acoustic Pro Headphones/)
  assert.match(html, /Hardware Specs/)
  assert.match(html, /Battery Life/)
  assert.match(html, /40 Hours/)
})

test('coupon wallet renders coupons and discount text', () => {
  const html = renderToStaticMarkup(
    createElement(CouponWallet, {
      coupons: [
        {
          code: 'WELCOME20',
          description: 'Save 20% on your initial storefront order.',
          discountText: '20% OFF',
          expiresAt: 'Dec 31',
          id: 'c1',
          title: 'First Purchase Discount',
        },
      ],
    }),
  )

  assert.match(html, /WELCOME20/)
  assert.match(html, /20% OFF/)
  assert.match(html, /First Purchase Discount/)
})

test('delivery tracker renders tracking milestones and order id', () => {
  const html = renderToStaticMarkup(
    createElement(DeliveryTracker, {
      estimatedDelivery: 'Friday, Oct 14',
      milestones: [
        { date: 'Oct 10', id: 'm1', status: 'completed', title: 'Order Confirmed' },
        { date: 'Oct 12', id: 'm2', status: 'current', title: 'Out for Delivery' },
      ],
      orderId: 'CX-99201',
      trackingNumber: 'TRK-984214981',
    }),
  )

  assert.match(html, /Order #CX-99201/)
  assert.match(html, /Friday, Oct 14/)
  assert.match(html, /TRK-984214981/)
  assert.match(html, /Out for Delivery/)
})

test('payment method selector renders saved cards and payment options', () => {
  const html = renderToStaticMarkup(
    createElement(PaymentMethodSelector, {
      savedCards: [
        {
          brand: 'visa',
          cardholderName: 'Jane Doe',
          expiryMonth: '12',
          expiryYear: '28',
          id: 'card-1',
          isDefault: true,
          last4: '4242',
        },
      ],
    }),
  )

  assert.match(html, /4242/)
  assert.match(html, /Jane Doe/)
  assert.match(html, /PCI-DSS Compliant/)
})

test('price history chart renders current price and stats', () => {
  const html = renderToStaticMarkup(
    createElement(PriceHistoryChart, {
      currentPrice: 89,
      history: [
        { date: 'Jan 1', price: 119 },
        { date: 'Feb 1', price: 99 },
        { date: 'Mar 1', price: 89 },
      ],
      lowestPrice: 89,
      peakPrice: 119,
      productTitle: 'Pro Mechanical Keyboard',
    }),
  )

  assert.match(html, /Price History Tracker/)
  assert.match(html, /Pro Mechanical Keyboard/)
  assert.match(html, /\$89/)
  assert.match(html, /All-Time Low!/)
})

test('reviews section renders rating score, distribution bars, and reviews', () => {
  const html = renderToStaticMarkup(
    createElement(ReviewsSection, {
      averageRating: 4.7,
      distribution: { 1: 2, 2: 1, 3: 5, 4: 20, 5: 80 },
      reviews: [
        {
          author: 'Michael B.',
          comment: 'Outstanding quality and very fast shipping.',
          date: '2 days ago',
          id: 'r1',
          isVerifiedBuyer: true,
          rating: 5,
          title: 'Best purchase of the year',
        },
      ],
      totalReviews: 108,
    }),
  )

  assert.match(html, /4\.7/)
  assert.match(html, /Michael B\./)
  assert.match(html, /Verified Buyer/)
  assert.match(html, /Outstanding quality/)
})

test('wishlist grid renders saved items and move to cart action', () => {
  const html = renderToStaticMarkup(
    createElement(WishlistGrid, {
      items: [
        {
          id: 'w1',
          image: '/test.jpg',
          inStock: true,
          price: '$120.00',
          title: 'Modern Oak Desk Stand',
        },
      ],
    }),
  )

  assert.match(html, /Modern Oak Desk Stand/)
  assert.match(html, /Move to Cart/)
  assert.match(html, /\$120\.00/)
})
