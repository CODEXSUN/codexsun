import { useState } from 'react'
import { ProductCard, type ProductItem } from '@codexsun/ui/blocks/product-card'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleProducts: readonly ProductItem[] = [
  {
    brand: 'AudioTech',
    colors: [
      { hex: '#1e293b', id: 'slate', name: 'Midnight Slate' },
      { hex: '#f8fafc', id: 'silver', name: 'Platinum Silver' },
      { hex: '#0284c7', id: 'ocean', name: 'Oceanic Blue' },
    ],
    discountPercent: 20,
    id: 'prod-1',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    originalPrice: 249.99,
    price: 199.99,
    rating: 4.9,
    reviewCount: 238,
    secondaryImageUrl: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&q=80',
    title: 'Studio Wireless Active ANC Headphones',
  },
  {
    brand: 'Chronos',
    colors: [
      { hex: '#0f172a', id: 'black', name: 'Stealth Black' },
      { hex: '#d97706', id: 'amber', name: 'Desert Amber' },
    ],
    id: 'prod-2',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
    isNew: true,
    price: 179.0,
    rating: 4.7,
    reviewCount: 84,
    title: 'Minimalist Titanium Chronograph Watch',
  },
  {
    badge: 'Limited',
    brand: 'Lumina',
    id: 'prod-3',
    imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80',
    originalPrice: 99.0,
    price: 79.0,
    rating: 4.6,
    reviewCount: 42,
    title: 'Smart Ambient Desk Lamp with Qi Charger',
  },
  {
    brand: 'Optic',
    id: 'prod-4',
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80',
    inStock: false,
    price: 129.0,
    rating: 4.8,
    reviewCount: 19,
    title: 'Polarized Acetate Sunglasses (Matte Black)',
  },
]

const productCardCode = `import { ProductCard, type ProductItem } from '@codexsun/ui/blocks/product-card'

export function ProductGrid({ products }: { products: ProductItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={(p, color) => addToCart(p, color)}
          onQuickView={(p) => openModal(p)}
          onToggleWishlist={(p, wishlisted) => updateWishlist(p, wishlisted)}
        />
      ))}
    </div>
  )
}`

export function UiProductCardDocumentation() {
  const topology = useMdiTopology()
  const [feedback, setFeedback] = useState('Product Card grid ready. Hover over items to test image zoom & actions.')

  return (
    <UiTemplatePage
      code={productCardCode}
      importPath="@codexsun/ui/blocks/product-card"
      kind="Block"
      name="Product Card"
      navigation={{
        next: { href: '/?block=pricing', name: 'Pricing Table' },
        previous: { href: '/?block=filter-builder', name: 'Filter Builder' },
      }}
      preview={
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sampleProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onAddToCart={(p, col) =>
                  setFeedback(`Added "${p.title}" (${col?.name || 'Default'}) to cart.`)
                }
                onQuickView={(p) => setFeedback(`Quick view opened for: ${p.title}`)}
                onToggleWishlist={(p, w) =>
                  setFeedback(`${w ? 'Added' : 'Removed'} "${p.title}" ${w ? 'to' : 'from'} wishlist.`)
                }
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {feedback}
          </p>
        </div>
      }
      topology={topology}
      topologyIds={{ page: '29', preview: '29.1', usage: '29.2' }}
      usageDescription={
        <p>
          Supply product items and image links. The Product Card block provides responsive image
          containment, hover secondary image switching, discount percent badges, ratings with review
          counts, interactive color swatch selection, and quick Add to Cart handlers.
        </p>
      }
    />
  )
}
