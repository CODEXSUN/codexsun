import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Heart, ShieldCheck, ShoppingBag, Truck } from "lucide-react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"

import type { StorefrontProductResponse } from "@ecommerce/shared"
import { queryKeys } from "@cxapp/web/src/query/query-keys"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CommercePrice } from "@/components/ux/commerce-price"
import { CommerceQuantityStepper } from "@/components/ux/commerce-quantity-stepper"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontLayout } from "../components/storefront-layout"
import { StorefrontProductCard } from "../components/storefront-product-card"
import { useStorefrontCustomerPortal } from "../hooks/use-storefront-customer-portal"
import { StorefrontProductPageSkeleton } from "../components/storefront-skeletons"
import {
  handleStorefrontImageError,
  resolveStorefrontImageUrl,
} from "../lib/storefront-image"
import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontProductPage() {
  const { slug = "" } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const cart = useStorefrontCart()
  const customerPortal = useStorefrontCustomerPortal()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const detailSectionRef = useRef<HTMLElement | null>(null)
  const [hasAutoScrolledToDetails, setHasAutoScrolledToDetails] = useState(false)

  const { data, error, isLoading } = useQuery<StorefrontProductResponse>({
    queryKey: queryKeys.storefrontProduct(slug),
    queryFn: () => storefrontApi.getProduct(slug),
    enabled: slug.trim().length > 0,
  })

  useEffect(() => {
    setSelectedImage(0)
  }, [slug])

  const product = data?.item
  const gallery = product?.images.length ? product.images : []
  const isWishlisted = product ? customerPortal.isWishlisted(product.id) : false
  const focusTarget = (location.state as { focus?: string } | null)?.focus
  const shouldAutoFocusTop = focusTarget === "top"
  const shouldAutoFocusDetail =
    location.hash === "#product-detail" || focusTarget === "product-detail"

  useEffect(() => {
    setHasAutoScrolledToDetails(false)
  }, [slug])

  useEffect(() => {
    if (!product || hasAutoScrolledToDetails || !shouldAutoFocusTop) {
      return
    }

    window.scrollTo({ top: 0, behavior: "auto" })
    setHasAutoScrolledToDetails(true)
  }, [product, shouldAutoFocusTop, hasAutoScrolledToDetails])

  useEffect(() => {
    if (!product || hasAutoScrolledToDetails || !shouldAutoFocusDetail) {
      return
    }

    const section = detailSectionRef.current

    if (!section) {
      return
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" })
    setHasAutoScrolledToDetails(true)
  }, [product, shouldAutoFocusDetail, hasAutoScrolledToDetails])

  async function handleToggleWishlist(productId: string) {
    await customerPortal.toggleWishlist(productId)
  }

  return (
    <StorefrontLayout showCategoryMenu={false}>
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 pt-8 lg:px-8">
        {error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6 text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to load product."}
            </CardContent>
          </Card>
        ) : null}
        {product ? (
          <>
            <section
              id="product-detail"
              ref={detailSectionRef}
              className="grid gap-6 lg:grid-cols-[minmax(0,0.94fr)_minmax(340px,0.82fr)] lg:items-start"
            >
              <div className="lg:sticky lg:top-24">
                <Card className="rounded-[2rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,247,242,0.94))] py-0 shadow-[0_24px_60px_-44px_rgba(48,31,19,0.18)]">
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    <div className="mx-auto max-w-[44rem] overflow-hidden rounded-[1.75rem] border border-[#e4d6c7] bg-[linear-gradient(180deg,#f7efe6,#fbf7f2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                      <img
                        src={resolveStorefrontImageUrl(gallery[selectedImage], product.name)}
                        alt={product.name}
                        className="aspect-[4/4.85] w-full object-contain"
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        onError={(event) => handleStorefrontImageError(event, product.name)}
                      />
                    </div>
                    {gallery.length > 1 ? (
                      <div className="grid gap-3 sm:grid-cols-4">
                        {gallery.slice(0, 4).map((imageUrl, index) => (
                          <button
                            key={imageUrl}
                            type="button"
                            className={`overflow-hidden rounded-[1.2rem] border bg-white/88 transition ${
                              selectedImage === index
                                ? "border-[#c9af95] shadow-[0_14px_28px_-22px_rgba(48,31,19,0.25)]"
                                : "border-[#e6d8ca] hover:border-[#d6c3b0]"
                            }`}
                            onClick={() => setSelectedImage(index)}
                          >
                            <img
                              src={resolveStorefrontImageUrl(imageUrl, product.name)}
                              alt={product.name}
                              className="aspect-square w-full object-contain"
                              loading="lazy"
                              decoding="async"
                              onError={(event) => handleStorefrontImageError(event, product.name)}
                            />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-5">
                <Card className="rounded-[2rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,247,242,0.92))] py-0 shadow-[0_24px_60px_-44px_rgba(48,31,19,0.18)]">
                  <CardContent className="space-y-6 p-5 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {product.badge ? (
                          <Badge className="rounded-full border border-transparent bg-[#1f1813] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                            {product.badge}
                          </Badge>
                        ) : null}
                        {product.department ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border-[#e1d5c8] bg-white/88 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6c5648]"
                          >
                            {product.department}
                          </Badge>
                        ) : null}
                        <Badge
                          variant="outline"
                          className="rounded-full border-[#e1d5c8] bg-white/88 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6c5648]"
                        >
                          {product.availableQuantity > 0 ? "In stock" : "Out of stock"}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm uppercase tracking-[0.18em] text-[#8a6e5b]">
                          {product.brandName ?? "Core catalog"}
                        </p>
                        <h1 className="font-heading text-4xl font-semibold tracking-tight text-[#241913] sm:text-[2.85rem]">
                          {product.name}
                        </h1>
                        <p className="text-[15px] leading-8 text-[#675242]">
                          {product.description ?? product.shortDescription}
                        </p>
                      </div>
                      <div className="border-t border-[#ede1d6] pt-4">
                        <CommercePrice
                          amount={product.sellingPrice}
                          compareAtAmount={product.mrp}
                        />
                      </div>
                    </div>

                    <div className="rounded-[1.6rem] border border-[#e6d9cb] bg-[linear-gradient(180deg,#fffdfa,#fbf7f1)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-[#6d5645]">Quantity</span>
                        <CommerceQuantityStepper
                          value={quantity}
                          max={Math.max(1, Math.min(20, product.availableQuantity || 1))}
                          onChange={setQuantity}
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                          size="lg"
                          className="rounded-full bg-[#201712] text-white hover:bg-[#31231b]"
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
                                shippingCharge: product.shippingCharge,
                                handlingCharge: product.handlingCharge,
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
                          className="rounded-full border-[#ddd1c2] bg-white/92 text-[#2f241d] hover:border-[#d0c0ae] hover:bg-white"
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
                                shippingCharge: product.shippingCharge,
                                handlingCharge: product.handlingCharge,
                              },
                              quantity
                            )
                            void navigate(storefrontPaths.checkout())
                          }}
                        >
                          Buy now
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="rounded-full border-[#ddd1c2] bg-white/92 text-[#2f241d] hover:border-[#d0c0ae] hover:bg-white"
                          onClick={() => void handleToggleWishlist(product.id)}
                        >
                          <Heart className={isWishlisted ? "fill-current text-rose-600" : undefined} />
                          {isWishlisted ? "Wishlisted" : "Save to wishlist"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="rounded-[1.55rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(251,247,242,0.92))] py-0 shadow-[0_18px_36px_-30px_rgba(48,31,19,0.18)]">
                    <CardContent className="space-y-3 p-5">
                      <Truck className="size-5 text-[#6d5140]" />
                      <p className="text-sm font-semibold text-[#241913]">Shipping</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {product.shippingNote ?? "Standard shipping in 2-5 business days."}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-[1.55rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(251,247,242,0.92))] py-0 shadow-[0_18px_36px_-30px_rgba(48,31,19,0.18)]">
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
                  <Card className="rounded-[1.55rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(251,247,242,0.92))] py-0 shadow-[0_18px_36px_-30px_rgba(48,31,19,0.18)]">
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
                    isWishlisted={customerPortal.isWishlisted(item.id)}
                    onToggleWishlist={() => void handleToggleWishlist(item.id)}
                    onAddToCart={() =>
                      cart.addItem({
                        productId: item.id,
                        slug: item.slug,
                        name: item.name,
                        imageUrl: item.primaryImageUrl,
                        unitPrice: item.sellingPrice,
                        mrp: item.mrp,
                        shippingCharge: item.shippingCharge,
                        handlingCharge: item.handlingCharge,
                      })
                    }
                  />
                ))}
              </div>
            </section>
          </>
        ) : isLoading ? (
          <StorefrontProductPageSkeleton />
        ) : (
          <div className="text-sm text-muted-foreground">Loading product...</div>
        )}
      </div>
    </StorefrontLayout>
  )
}
