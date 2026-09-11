import { useState } from 'react'
import { WishlistGrid, type WishlistItem } from '@codexsun/ui/blocks/ecommerce/wishlist'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleWishlist: WishlistItem[] = [
  {
    id: 'w1',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    inStock: true,
    originalPrice: '$249.00',
    price: '$199.00',
    rating: 4.8,
    title: 'Acoustic Studio Headphones',
  },
  {
    id: 'w2',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
    inStock: true,
    lowStockWarning: 'Only 3 Left',
    price: '$89.00',
    rating: 4.6,
    title: 'Ergonomic Vertical Mouse',
  },
  {
    id: 'w3',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
    inStock: false,
    price: '$149.00',
    rating: 4.9,
    title: 'Mechanical Custom Keypad',
  },
]

export function UiWishlistDocumentation() {
  const topology = useMdiTopology()
  const [items, setItems] = useState<WishlistItem[]>(sampleWishlist)
  const [feedback, setFeedback] = useState<string | null>(null)

  return (
    <UiTemplatePage
      code={`import { WishlistGrid } from '@codexsun/ui/blocks/ecommerce/wishlist'

export function SavedItems({ items }) {
  return <WishlistGrid items={items} />
}`}
      importPath="@codexsun/ui/blocks/ecommerce/wishlist"
      kind="Block"
      name="Wishlist Grid"
      navigation={{
        previous: { href: '/?block=reviews', name: 'Reviews' },
      }}
      preview={
        <div className="space-y-6">
          {feedback && (
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs text-primary font-semibold">
              {feedback}
            </div>
          )}

          <WishlistGrid
            items={items}
            onAddToCart={(id) => setFeedback(`Moved item ${id} to active cart!`)}
            onRemoveItem={(id) => {
              setItems((prev) => prev.filter((it) => it.id !== id))
              setFeedback('Item removed from wishlist.')
            }}
            onMoveAllToCart={() => setFeedback('Moved all in-stock items to your cart!')}
            onClearWishlist={() => {
              setItems([])
              setFeedback('Cleared all wishlist items.')
            }}
          />
        </div>
      }
      topology={topology}
      topologyIds={{ page: '42', preview: '42.1', usage: '42.2' }}
      usageDescription={
        <p>
          Wishlist catalogue grid with stock badges, low-stock warnings, instant Move to Cart, and bulk
          clear actions.
        </p>
      }
    />
  )
}
