import { useEffect, useState } from "react"
import { ShieldCheck, ShoppingBag, Truck } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import type { StorefrontProductResponse } from "@ecommerce/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CommercePrice } from "@/components/ux/commerce-price"
import { CommerceQuantityStepper } from "@/components/ux/commerce-quantity-stepper"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontLayout } from "../components/storefront-layout"
import { StorefrontProductCard } from "../components/storefront-product-card"
import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontProductPage() {
  const { slug = "" } = useParams()
  const navigate = useNavigate()
  const cart = useStorefrontCart()
  const [data, setData] = useState<StorefrontProductResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

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

  useEffect(() => {
    setSelectedImage(0)
  }, [slug])

  const product = data?.item
  const gallery = product?.images.length ? product.images : []

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
            <section className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
              <div className="grid gap-4">
                <div className="overflow-hidden rounded-[2.2rem] border border-[#e0d1c0] bg-[linear-gradient(135deg,#f2e7da,#fbf7f2)] shadow-[0_30px_70px_-46px_rgba(45,22,11,0.28)]">
                  <img
                    src={
                      gallery[selectedImage] ??
                      "https://placehold.co/1200x1500/e8ddd1/2d211b?text=Product"
                    }
                    alt={product.name}
                    className="aspect-[4/4.7] w-full object-cover"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
                  {gallery.slice(0, 4).map((imageUrl, index) => (
                    <button
                      key={imageUrl}
                      type="button"
                      className={`overflow-hidden rounded-[1.3rem] border ${
                        selectedImage === index ? "border-[#241913]" : "border-[#e2d4c4]"
                      } bg-white/80 shadow-sm`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="aspect-square w-full object-cover"
                      />
                    </button>
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
                    <Badge variant="outline">
                      {product.availableQuantity > 0 ? "In stock" : "Out of stock"}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm uppercase tracking-[0.18em] text-[#7e6150]">
                      {product.brandName ?? "Core catalog"}
                    </p>
                    <h1 className="font-heading text-4xl font-semibold tracking-tight text-[#241913]">
                      {product.name}
                    </h1>
                    <p className="text-base leading-8 text-[#635040]">
                      {product.description ?? product.shortDescription}
                    </p>
                  </div>
                  <CommercePrice amount={product.sellingPrice} compareAtAmount={product.mrp} />
                </div>
                <div className="grid gap-5 rounded-[1.8rem] border border-[#e1d2c2] bg-white/86 p-5 shadow-[0_24px_50px_-40px_rgba(48,31,19,0.26)]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[#6d5645]">Quantity</span>
                    <CommerceQuantityStepper
                      value={quantity}
                      max={Math.max(1, Math.min(20, product.availableQuantity || 1))}
                      onChange={setQuantity}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      className="rounded-full bg-[#241913] hover:bg-[#3a291f]"
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
                      <ShoppingBag className="size-4" />
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
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="rounded-[1.5rem] border-[#e2d4c4] py-0 shadow-sm">
                    <CardContent className="space-y-3 p-5">
                      <Truck className="size-5 text-[#6d5140]" />
                      <p className="text-sm font-semibold text-[#241913]">Shipping</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {product.shippingNote ?? "Standard shipping in 2-5 business days."}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-[1.5rem] border-[#e2d4c4] py-0 shadow-sm">
                    <CardContent className="space-y-3 p-5">
                      <ShieldCheck className="size-5 text-[#6d5140]" />
                      <p className="text-sm font-semibold text-[#241913]">Details</p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {product.fabrics.map((item) => (
                          <p key={item}>Fabric: {item}</p>
                        ))}
                        {product.fits.map((item) => (
                          <p key={item}>Fit: {item}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-[1.5rem] border-[#e2d4c4] py-0 shadow-sm">
                    <CardContent className="space-y-3 p-5">
                      <ShoppingBag className="size-5 text-[#6d5140]" />
                      <p className="text-sm font-semibold text-[#241913]">Availability</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {product.availableQuantity > 0
                          ? `${product.availableQuantity} units ready to dispatch.`
                          : "Currently unavailable."}
                      </p>
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
                  <StorefrontProductCard
                    key={item.id}
                    item={item}
                    href={storefrontPaths.product(item.slug)}
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
