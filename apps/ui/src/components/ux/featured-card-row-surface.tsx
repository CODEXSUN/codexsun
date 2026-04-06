import {
  CommerceProductCard,
  type CommerceProductCardDesign,
} from "@/components/ux/commerce-product-card"

type FeaturedCardRowItem = {
  id: string
  href: string
  name: string
  imageUrl: string | null
  badge?: string | null
  brandName?: string | null
  categoryName?: string | null
  shortDescription?: string | null
  amount: number
  compareAtAmount?: number | null
  availableQuantity?: number | null
  onAddToCart?: () => void
}

export type FeaturedCardRowVariant = 3 | 4 | 5 | 6

export function FeaturedCardRowSurface({
  items,
  cardsPerRow,
  cardDesign,
}: {
  items: FeaturedCardRowItem[]
  cardsPerRow: FeaturedCardRowVariant
  cardDesign?: CommerceProductCardDesign
}) {
  const density =
    cardsPerRow >= 5 ? "dense" : cardsPerRow === 4 ? "compact" : "default"
  const gridClassName =
    cardsPerRow === 6
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      : cardsPerRow === 5
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        : cardsPerRow === 4
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"

  return (
    <div className="pb-1.5">
      <div className={`grid gap-3 ${gridClassName}`}>
        {items.map((item) => (
          <CommerceProductCard
            key={item.id}
            href={item.href}
            name={item.name}
            imageUrl={item.imageUrl}
            badge={item.badge}
            brandName={item.brandName}
            categoryName={item.categoryName}
            shortDescription={item.shortDescription}
            amount={item.amount}
            compareAtAmount={item.compareAtAmount}
            availableQuantity={item.availableQuantity}
            onAddToCart={item.onAddToCart}
            density={density}
            design={cardDesign}
          />
        ))}
      </div>
    </div>
  )
}

export type { FeaturedCardRowItem }
