import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductGrid } from '@/features/store/components/product/ProductGrid'
import { useStorefront } from '@/features/store/context/storefront-context'

export function CustomerWishlistPage() {
  const { products, wishlistProductIds } = useStorefront()
  const wishlistProducts = products.filter((product) => wishlistProductIds.includes(product.id))

  return (
    <div className="space-y-4">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="gap-4 border-b border-border/60 p-8">
          <Badge className="w-fit">Wishlist</Badge>
          <div className="space-y-3">
            <CardTitle className="text-4xl tracking-tight sm:text-5xl">Saved styles for later.</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              Your customer portal wishlist uses the same live storefront catalog and saved-product state as the public shopping flow.
            </CardDescription>
          </div>
          <div>
            <Button asChild variant="outline">
              <Link to="/search">Continue shopping</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <ProductGrid
        products={wishlistProducts}
        emptyMessage="You have not saved any styles yet. Use the storefront heart action to build your wishlist."
      />
    </div>
  )
}
