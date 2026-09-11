import { useState } from 'react'
import { HeadphonesIcon, LaptopIcon, ShirtIcon } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { EcommerceHeader } from '@codexsun/ui/layouts/ecommerce-header'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleCategories = [
  {
    href: '#electronics',
    icon: <HeadphonesIcon className="size-4" />,
    id: 'electronics',
    isHot: true,
    label: 'Audio & Tech',
    subcategories: [
      { description: 'Wireless over-ear and noise cancelling', href: '#headphones', label: 'Studio Headphones' },
      { description: 'True wireless spatial audio earbuds', href: '#earbuds', label: 'Noise Cancelling Earbuds' },
      { description: 'Mechanical switches and ergonomic layouts', href: '#keyboards', label: 'Keyboards & Mice' },
    ],
  },
  {
    href: '#laptops',
    icon: <LaptopIcon className="size-4" />,
    id: 'laptops',
    label: 'Computers & Monitors',
    subcategories: [
      { href: '#ultrabooks', label: 'Pro Laptops' },
      { href: '#displays', label: '4K OLED Monitors' },
    ],
  },
  {
    href: '#apparel',
    icon: <ShirtIcon className="size-4" />,
    id: 'apparel',
    label: 'Minimalist Apparel',
  },
]

export function UiEcommerceHeaderDocumentation() {
  const topology = useMdiTopology()
  const [cartCount, setCartCount] = useState(3)
  const [wishlistCount, setWishlistCount] = useState(5)
  const [lastAction, setLastAction] = useState<string | null>(null)

  return (
    <UiTemplatePage
      code={`import { EcommerceHeader } from '@codexsun/ui/layouts/ecommerce-header'

export function Storefront() {
  return (
    <EcommerceHeader
      brand={{ title: 'CodexMart' }}
      actions={{ cartCount: 3, wishlistCount: 5 }}
    />
  )
}`}
      importPath="@codexsun/ui/layouts/ecommerce-header"
      kind="Layout"
      name="E-Commerce Storefront Header"
      navigation={{
        previous: { href: '/?layout=site-header', name: 'Site Header' },
      }}
      preview={
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/40 p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Interactive Controls:</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  setCartCount((c) => c + 1)
                  setLastAction('Incremented cart items count.')
                }}
              >
                + Add Cart Item
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  setWishlistCount((w) => w + 1)
                  setLastAction('Saved item to wishlist.')
                }}
              >
                + Save Wishlist
              </Button>
            </div>
            {lastAction && <span className="text-muted-foreground italic">{lastAction}</span>}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-xs">
            <EcommerceHeader
              announcement={{
                actionHref: '#sale',
                actionLabel: 'Shop Sale',
                freeShippingProgress: 80,
                message: 'Exclusive Spring Drop: Free Express Shipping over $75',
                showFreeShippingMeter: true,
              }}
              brand={{
                title: 'CodexMart',
              }}
              categories={sampleCategories}
              actions={{
                cartCount,
                cartSubtotal: `$${(cartCount * 45).toFixed(2)}`,
                onAccountClick: () => setLastAction('Account profile trigger clicked.'),
                onCartClick: () => setLastAction('Cart drawer opened.'),
                onSearch: (q) => setLastAction(`Searched catalog for "${q}".`),
                onWishlistClick: () => setLastAction('Wishlist drawer opened.'),
                wishlistCount,
              }}
            />
          </div>
        </div>
      }
      topology={topology}
      topologyIds={{ page: '31', preview: '31.1', usage: '31.2' }}
      usageDescription={
        <p>
          Dedicated e-commerce storefront header featuring top promotional strip with free shipping progress meter,
          autocomplete live search, category megamenu flyout, wishlist count, and cart drawer triggers.
        </p>
      }
    />
  )
}
