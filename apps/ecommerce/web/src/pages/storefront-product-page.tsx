import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import type { StorefrontProductResponse } from "@ecommerce/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CommercePrice } from "@/components/ux/commerce-price"
import { CommerceProductCard } from "@/components/ux/commerce-product-card"
import { CommerceQuantityStepper } from "@/components/ux/commerce-quantity-stepper"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontLayout } from "../components/storefront-layout"
import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontProductPage() {
  const { slug = "" } = useParams()
  const navigate = useNavigate()
  const cart = useStorefrontCart()
  const [data, setData] = useState<StorefrontProductResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    async function load() {
      try {
        setData(await storefrontApi.getProduct(slug))
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load product.")
      }
    }

    void load()
  }, [slug])

  const product = data?.item

  return (
    <StorefrontLayout>
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 pt-8 lg:px-8">
        {error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}
        {product ? (
          <>
            <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="grid gap-4">
                <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-[#eadfd2] shadow-lg">
                  <img
                    src={
                      product.images[0] ??
                      "https://placehold.co/1200x1500/e8ddd1/2d211b?text=Product"
                    }
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {product.images.slice(1, 4).map((imageUrl) => (
                    <img
                      key={imageUrl}
                      src={imageUrl}
                      alt={product.name}
                      className="h-36 w-full rounded-[1.4rem] border border-border/70 object-cover shadow-sm"
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {product.badge ? <Badge>{product.badge}</Badge> : null}
                    {product.department ? (
                      <Badge variant="outline">{product.department}</Badge>
                    ) : null}
                    {product.availableQuantity > 0 ? (
                      <Badge variant="outline">In stock</Badge>
                    ) : (
                      <Badge variant="outline">Out of stock</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                      {product.brandName ?? "Core catalog"}
                    </p>
                    <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">
                      {product.name}
                    </h1>
                    <p className="mt-3 text-base leading-8 text-muted-foreground">
                      {product.description ?? product.shortDescription}
                    </p>
                  </div>
                  <CommercePrice amount={product.sellingPrice} compareAtAmount={product.mrp} />
                </div>
                <div className="grid gap-5 rounded-[1.7rem] border border-border/70 bg-card/90 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Quantity
                    </span>
                    <CommerceQuantityStepper
                      value={quantity}
                      max={Math.max(1, Math.min(20, product.availableQuantity || 1))}
                      onChange={setQuantity}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      className="rounded-full"
                      disabled={product.availableQuantity <= 0}
                      onClick={() =>
                        cart.addItem(
                          {
                            productId: product.id,
                            slug: product.slug,
                            name: product.name,
                            imageUrl: product.primaryImageUrl,
                            unitPrice: product.sellingPrice,
                            mrp: product.mrp,
                          },
                          quantity
                        )
                      }
                    >
                      Add to cart
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full"
                      disabled={product.availableQuantity <= 0}
                      onClick={() => {
                        cart.addItem(
                          {
                            productId: product.id,
                            slug: product.slug,
                            name: product.name,
                            imageUrl: product.primaryImageUrl,
                            unitPrice: product.sellingPrice,
                            mrp: product.mrp,
                          },
                          quantity
                        )
                        void navigate(storefrontPaths.checkout())
                      }}
                    >
                      Buy now
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="rounded-[1.5rem] border-border/70 py-0 shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-sm font-semibold">Shipping</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {product.shippingNote ?? "Standard shipping in 2-5 business days."}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-[1.5rem] border-border/70 py-0 shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-sm font-semibold">Product details</p>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {product.fabrics.map((item) => (
                          <p key={item}>Fabric: {item}</p>
                        ))}
                        {product.fits.map((item) => (
                          <p key={item}>Fit: {item}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>
            <section className="space-y-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Related
                  </p>
                  <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                    You may also like
                  </h2>
                </div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to={storefrontPaths.catalog()}>Back to catalog</Link>
                </Button>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                {data.relatedItems.map((item) => (
                  <CommerceProductCard
                    key={item.id}
                    href={storefrontPaths.product(item.slug)}
                    name={item.name}
                    imageUrl={item.primaryImageUrl}
                    badge={item.badge}
                    brandName={item.brandName}
                    categoryName={item.categoryName}
                    shortDescription={item.shortDescription}
                    amount={item.sellingPrice}
                    compareAtAmount={item.mrp}
                    onAddToCart={() =>
                      cart.addItem({
                        productId: item.id,
                        slug: item.slug,
                        name: item.name,
                        imageUrl: item.primaryImageUrl,
                        unitPrice: item.sellingPrice,
                        mrp: item.mrp,
                      })
                    }
                  />
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">Loading product...</div>
        )}
      </div>
    </StorefrontLayout>
  )
}
