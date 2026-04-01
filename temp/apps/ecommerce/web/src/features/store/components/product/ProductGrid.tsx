import type { StorefrontProduct } from "@/features/store/types/storefront"
import { ProductCard } from "./ProductCard"

export function ProductGrid({
  products,
  emptyMessage,
}: {
  products: StorefrontProduct[]
  emptyMessage?: string
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-[#dacdbd] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(247,240,232,0.72)_100%)] p-10 text-center text-sm text-muted-foreground shadow-[0_20px_50px_-46px_rgba(45,29,19,0.26)]">
        {emptyMessage ?? "No products found."}
      </div>
    )
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
