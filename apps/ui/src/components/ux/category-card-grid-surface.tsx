import {
  CategoryCardSurface,
  type CategoryCardDesign,
  type CategoryCardSurfaceItem,
} from "@/components/ux/category-card-surface"

export function CategoryCardGridSurface({
  items,
  cardsPerRow,
  rowsToShow,
  cardDesign,
}: {
  items: CategoryCardSurfaceItem[]
  cardsPerRow: 3 | 4 | 5 | 6
  rowsToShow: 1 | 2 | 3
  cardDesign?: CategoryCardDesign
}) {
  const gridClassName =
    cardsPerRow === 6
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      : cardsPerRow === 5
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        : cardsPerRow === 4
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"

  return (
    <div className={`grid gap-4 ${gridClassName}`}>
      {items.slice(0, cardsPerRow * rowsToShow).map((item) => (
        <CategoryCardSurface key={item.id} item={item} design={cardDesign} />
      ))}
    </div>
  )
}
