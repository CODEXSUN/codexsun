import { useState } from 'react'
import { Button } from '@codexsun/ui/components/button'
import { StorefrontCart, type CartItem } from '@codexsun/ui/blocks/ecommerce/cart'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const initialCartItems: CartItem[] = [
  {
    id: 'cart-1',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
    originalPrice: '$249.00',
    price: '$199.00',
    priceValue: 199,
    quantity: 1,
    title: 'Acoustic Studio Wireless Headphones',
    variant: 'Matte Obsidian / Noise Cancelling',
  },
  {
    id: 'cart-2',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&q=80',
    price: '$79.00',
    priceValue: 79,
    quantity: 2,
    title: 'Mechanical Keypad & Desk Pad Bundle',
    variant: 'Brown Tactile Switches',
  },
]

export function UiCartDocumentation() {
  const topology = useMdiTopology()
  const [items, setItems] = useState<CartItem[]>(initialCartItems)
  const [statusText, setStatusText] = useState<string | null>(null)

  const handleQuantity = (id: string, newQty: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, quantity: Math.max(1, newQty) } : it))
    )
    setStatusText(`Updated item quantity.`)
  }

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    setStatusText('Removed item from cart.')
  }

  return (
    <UiTemplatePage
      code={`import { StorefrontCart } from '@codexsun/ui/blocks/ecommerce/cart'

export function CartView({ items }) {
  return <StorefrontCart items={items} />
}`}
      importPath="@codexsun/ui/blocks/ecommerce/cart"
      kind="Block"
      name="Storefront Cart"
      navigation={{
        previous: { href: '/?block=product-card', name: 'Product Card' },
      }}
      preview={
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/40 p-3 text-xs">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  setItems(initialCartItems)
                  setStatusText('Reset cart items.')
                }}
              >
                Reset Demo Items
              </Button>
            </div>
            {statusText && <span className="text-muted-foreground italic">{statusText}</span>}
          </div>

          <div className="max-w-md mx-auto">
            <StorefrontCart
              isDrawer={false}
              items={items}
              onQuantityChange={handleQuantity}
              onRemoveItem={handleRemove}
              onCheckout={() => setStatusText('Proceeded to Checkout flow!')}
            />
          </div>
        </div>
      }
      topology={topology}
      topologyIds={{ page: '33', preview: '33.1', usage: '33.2' }}
      usageDescription={
        <p>
          Storefront shopping cart block and slide-over drawer with item quantity steppers, subtotal
          recalculation, and dynamic free shipping threshold meter.
        </p>
      }
    />
  )
}
