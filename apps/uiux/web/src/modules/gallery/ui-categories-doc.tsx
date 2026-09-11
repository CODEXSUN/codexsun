import { useState } from 'react'
import { HeadphonesIcon, LaptopIcon, ShirtIcon, WatchIcon } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { CategoryShowcase, type StoreCategoryCard } from '@codexsun/ui/blocks/ecommerce/categories'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleCategories: StoreCategoryCard[] = [
  {
    badge: 'Trending',
    href: '#audio',
    icon: <HeadphonesIcon className="size-5" />,
    id: 'audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    itemCount: 1240,
    subtitle: 'Over-ear, in-ear, and Hi-Fi wireless acoustics',
    tags: ['Noise-Cancelling', 'Bluetooth 5.3', 'Spatial Audio'],
    title: 'Audio & Acoustics',
  },
  {
    badge: 'Popular',
    href: '#hardware',
    icon: <LaptopIcon className="size-5" />,
    id: 'hardware',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
    itemCount: 890,
    subtitle: 'Laptops, ultrawide displays, and ergonomic mounts',
    tags: ['4K Monitors', 'Apple Silicon', 'Mechanical'],
    title: 'Workstations & Tech',
  },
  {
    href: '#wearables',
    icon: <WatchIcon className="size-5" />,
    id: 'wearables',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
    itemCount: 430,
    subtitle: 'Biometric health rings, smartwatches, and fitness sensors',
    tags: ['Heart Rate', 'Sleep Tracker', 'Titanium'],
    title: 'Wearables & Health',
  },
  {
    badge: 'New',
    href: '#apparel',
    icon: <ShirtIcon className="size-5" />,
    id: 'apparel',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80',
    itemCount: 650,
    subtitle: 'Technical outerwear, merino layers, and urban streetwear',
    tags: ['Merino Wool', 'Waterproof', 'Minimal'],
    title: 'Technical Apparel',
  },
]

export function UiCategoriesDocumentation() {
  const topology = useMdiTopology()
  const [variant, setVariant] = useState<'cards' | 'pills'>('cards')
  const [selectedCat, setSelectedCat] = useState<string | null>(null)

  return (
    <UiTemplatePage
      code={`import { CategoryShowcase } from '@codexsun/ui/blocks/ecommerce/categories'

export function CatalogCategories({ categories }) {
  return <CategoryShowcase categories={categories} />
}`}
      importPath="@codexsun/ui/blocks/ecommerce/categories"
      kind="Block"
      name="Categories Showcase"
      navigation={{
        previous: { href: '/?block=cart', name: 'Storefront Cart' },
      }}
      preview={
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/40 p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Display Variant:</span>
              <Button
                size="sm"
                variant={variant === 'cards' ? 'default' : 'outline'}
                className="h-7 text-xs"
                onClick={() => setVariant('cards')}
              >
                Visual Cards Grid
              </Button>
              <Button
                size="sm"
                variant={variant === 'pills' ? 'default' : 'outline'}
                className="h-7 text-xs"
                onClick={() => setVariant('pills')}
              >
                Filter Pills
              </Button>
            </div>
            {selectedCat && (
              <span className="text-muted-foreground italic">Selected category ID: {selectedCat}</span>
            )}
          </div>

          <div className="rounded-2xl border border-border/80 bg-background p-6 shadow-xs">
            <CategoryShowcase
              categories={sampleCategories}
              variant={variant}
              onSelectCategory={(id) => setSelectedCat(id)}
            />
          </div>
        </div>
      }
      topology={topology}
      topologyIds={{ page: '34', preview: '34.1', usage: '34.2' }}
      usageDescription={
        <p>
          Storefront category visual grid and pill filter strip with item counters, subcategory tags,
          and smooth hover elevations.
        </p>
      }
    />
  )
}
