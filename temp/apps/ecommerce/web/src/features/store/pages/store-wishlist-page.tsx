import { HeartIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ProductGrid } from "@/features/store/components/product/ProductGrid"
import { useStorefront } from "@/features/store/context/storefront-context"

export function StoreWishlistPage() {
  const { products, wishlistProductIds } = useStorefront()
  const wishlistProducts = products.filter((product) => wishlistProductIds.includes(product.id))

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <section className="rounded-[2.2rem] border border-white/70 bg-white/78 p-6 shadow-[0_24px_60px_-44px_rgba(40,28,18,0.25)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <HeartIcon className="size-4" />
              Wishlist
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Saved styles for later.</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Saved products stay inside the storefront flow and pull from the live backend catalog.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/search">Continue shopping</Link>
          </Button>
        </div>
      </section>

      <ProductGrid
        products={wishlistProducts}
        emptyMessage="You have not saved any styles yet. Tap the heart on any product card to build your wishlist."
      />
    </div>
  )
}
