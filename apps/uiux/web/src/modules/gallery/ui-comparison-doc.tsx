import { useState } from 'react'
import { ProductComparison, type ComparisonFeatureGroup, type ComparisonProduct } from '@codexsun/ui/blocks/ecommerce/comparison'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleProducts: ComparisonProduct[] = [
  {
    attributes: {
      anc: true,
      battery: '40 Hours',
      bluetooth: 'v5.3 Low Latency',
      weight: '250g',
      wirelessCharging: true,
    },
    badge: 'Flagship',
    id: 'p1',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    inStock: true,
    price: '$249.00',
    rating: 4.9,
    reviewsCount: 342,
    title: 'Acoustic Studio Pro Wireless',
  },
  {
    attributes: {
      anc: true,
      battery: '30 Hours',
      bluetooth: 'v5.2',
      weight: '220g',
      wirelessCharging: false,
    },
    badge: 'Best Value',
    id: 'p2',
    image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80',
    inStock: true,
    price: '$149.00',
    rating: 4.7,
    reviewsCount: 189,
    title: 'Acoustic Air Comfort',
  },
  {
    attributes: {
      anc: false,
      battery: '20 Hours',
      bluetooth: 'v5.0',
      weight: '190g',
      wirelessCharging: false,
    },
    id: 'p3',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80',
    inStock: false,
    price: '$89.00',
    rating: 4.3,
    reviewsCount: 95,
    title: 'Acoustic Lite Travel Edition',
  },
]

const sampleGroups: ComparisonFeatureGroup[] = [
  {
    groupName: 'Acoustics & Hardware',
    features: [
      { key: 'anc', label: 'Active Noise Cancellation (ANC)', description: 'Hybrid active cancellation with transparency mode' },
      { key: 'battery', label: 'Battery Life' },
      { key: 'wirelessCharging', label: 'Qi Wireless Charging Case' },
    ],
  },
  {
    groupName: 'Connectivity & Build',
    features: [
      { key: 'bluetooth', label: 'Bluetooth Protocol' },
      { key: 'weight', label: 'Chassis Weight' },
    ],
  },
]

export function UiComparisonDocumentation() {
  const topology = useMdiTopology()
  const [products, setProducts] = useState(sampleProducts)
  const [cartFeedback, setCartFeedback] = useState<string | null>(null)

  return (
    <UiTemplatePage
      code={`import { ProductComparison } from '@codexsun/ui/blocks/ecommerce/comparison'

export function SpecComparison({ products, featureGroups }) {
  return <ProductComparison products={products} featureGroups={featureGroups} />
}`}
      importPath="@codexsun/ui/blocks/ecommerce/comparison"
      kind="Block"
      name="Product Comparison"
      navigation={{
        previous: { href: '/?block=checkout', name: 'Checkout' },
      }}
      preview={
        <div className="space-y-6">
          {cartFeedback && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-primary font-semibold">
              {cartFeedback}
            </div>
          )}

          <ProductComparison
            featureGroups={sampleGroups}
            products={products}
            onAddToCart={(id) => setCartFeedback(`Added product ${id} to cart from comparison matrix.`)}
            onRemoveProduct={(id) => setProducts((prev) => prev.filter((p) => p.id !== id))}
          />
        </div>
      }
      topology={topology}
      topologyIds={{ page: '36', preview: '36.1', usage: '36.2' }}
      usageDescription={
        <p>
          Side-by-side product comparison matrix with technical specification rows, difference highlighting,
          and direct Add to Cart triggers.
        </p>
      }
    />
  )
}
