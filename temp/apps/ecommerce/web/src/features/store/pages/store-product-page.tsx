import { useLayoutEffect, useMemo, useState } from 'react'
import { ShieldCheckIcon, TruckIcon } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductGallery } from '@/features/store/components/product/ProductGallery'
import { ProductGrid } from '@/features/store/components/product/ProductGrid'
import { QuantitySelector } from '@/features/store/components/product/QuantitySelector'
import { RatingStars } from '@/features/store/components/product/RatingStars'
import { ReviewForm } from '@/features/store/components/product/ReviewForm'
import { ReviewList } from '@/features/store/components/product/ReviewList'
import { ShareButton } from '@/features/store/components/product/ShareButton'
import { WishlistButton } from '@/features/store/components/product/WishlistButton'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { useStorefront } from '@/features/store/context/storefront-context'
import { formatCurrency, getPrimaryProductImage } from '@/features/store/lib/storefront-utils'

export function StoreProductPage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { session } = useAuth()
  const { products, reviews, addToCart, addReview, isLoading, errorMessage } = useStorefront()
  const product = products.find((entry) => entry.slug === slug) ?? null
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState(product?.sizes[0] ?? 'Default')
  const [selectedColor, setSelectedColor] = useState(product?.colors[0]?.name ?? 'Default')

  const productReviews = useMemo(
    () => reviews.filter((review) => review.productId === product?.id),
    [product?.id, reviews],
  )
  const relatedProducts = useMemo(
    () =>
      product
        ? products
            .filter((entry) => entry.categorySlug === product.categorySlug && entry.id !== product.id)
            .slice(0, 3)
        : [],
    [product, products],
  )
  const productFacts = useMemo(
    () =>
      product
        ? [
            { label: 'Brand', value: product.brand },
            { label: 'Category', value: product.categoryName },
            { label: 'SKU', value: product.sku },
            { label: 'Department', value: product.department },
            { label: 'Fabric', value: product.fabric },
            { label: 'Fit', value: product.fit },
            { label: 'Sleeve', value: product.sleeve },
            { label: 'Occasion', value: product.occasion },
          ].filter((entry) => entry.value)
        : [],
    [product],
  )
  const isOutOfStock = product ? product.inventory <= 0 : false
  const canSubmitReview = session?.user.actorType === 'customer'

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [slug])

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground sm:px-6">Loading product...</div>
  }

  if (errorMessage) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-destructive sm:px-6">{errorMessage}</div>
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-[2rem] border border-dashed border-border/70 bg-white/75 p-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Product not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The requested product could not be located in the storefront catalog.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/search">Back to catalog</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <section className="grid gap-8 rounded-[2.2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_-44px_rgba(40,28,18,0.25)] lg:grid-cols-[1.05fr_0.95fr] sm:p-8">
        <ProductGallery images={product.images} fallbackUrl={getPrimaryProductImage(product)} />

        <div className="space-y-6">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit">
              {product.catalogBadge ?? product.categoryName}
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1>
              <p className="text-sm text-muted-foreground">{product.brand}</p>
            </div>
            <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="md" />
          </div>

          <div className="space-y-2">
            <div className="text-3xl font-semibold tracking-tight">{formatCurrency(product.price)}</div>
            {product.compareAtPrice ? (
              <div className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.compareAtPrice)}
              </div>
            ) : null}
            <p className="text-sm leading-6 text-muted-foreground">
              {product.shortDescription ?? product.description ?? 'No short description available.'}
            </p>
          </div>

          <div className="space-y-4 rounded-[1.6rem] border border-border/70 bg-background/70 p-5">
            {product.sizes.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Size</div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={selectedSize === size
                        ? 'rounded-full border border-foreground bg-foreground px-4 py-2 text-sm text-white'
                        : 'rounded-full border border-border bg-white px-4 py-2 text-sm text-foreground'}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {product.colors.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Color</div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      className={selectedColor === color.name
                        ? 'rounded-full border border-foreground bg-foreground px-4 py-2 text-sm text-white'
                        : 'rounded-full border border-border bg-white px-4 py-2 text-sm text-foreground'}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Quantity</div>
              <QuantitySelector value={quantity} onChange={setQuantity} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="rounded-full px-6"
              disabled={isOutOfStock}
              onClick={() => {
                addToCart(product.id, quantity, selectedSize, selectedColor, { toast: false })
                void navigate('/checkout')
              }}
            >
              {isOutOfStock ? 'Out of stock' : 'Buy now'}
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-6"
              disabled={isOutOfStock}
              onClick={() => addToCart(product.id, quantity, selectedSize, selectedColor)}
            >
              Add to cart
            </Button>
            <div className="flex flex-wrap items-center gap-3 sm:gap-2.5">
              <WishlistButton productId={product.id} size="pill" />
              <ShareButton productName={product.name} size="pill" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4 text-sm">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <TruckIcon className="size-4" />
                Delivery Note
              </div>
              <p className="text-muted-foreground">
                {product.shippingNote ?? 'Delivery timelines depend on current stock availability and service area.'}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4 text-sm">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <ShieldCheckIcon className="size-4" />
                Product Snapshot
              </div>
              <p className="text-muted-foreground">
                {[product.fabric, product.fit ? `${product.fit} fit` : null, product.occasion].filter(Boolean).join(' · ') || 'Catalog-backed product snapshot'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5 rounded-[2rem] border border-white/70 bg-white/78 p-6 shadow-sm">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit">
              Product Details
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight">Catalog details from the live backend product</h2>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            {product.description ?? product.shortDescription ?? 'No extended description available.'}
          </p>
          <div className="grid gap-3">
            {productFacts.map((detail) => (
              <div key={detail.label} className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 text-sm">
                <span className="text-muted-foreground">{detail.label}</span>
                <span className="font-medium text-right">{detail.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5 rounded-[2rem] border border-white/70 bg-white/78 p-6 shadow-sm">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit">
              Storefront Notes
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight">Publishing and availability notes</h2>
          </div>
          <div className="grid gap-3">
            {[
              product.homeSlider ? 'Published in the home hero slider.' : null,
              product.promoSlider ? 'Published in the promo slider.' : null,
              product.featureSection ? 'Published in the feature section.' : null,
              product.newArrival ? 'Marked as a new arrival.' : null,
              product.bestseller ? 'Marked as a best seller.' : null,
              product.featuredLabel ? 'Contributes to featured brand labels.' : null,
            ]
              .filter(Boolean)
              .map((item, index) => (
                <div
                  key={item}
                  className="translate-y-0 rounded-[1.4rem] border border-border/70 bg-background/70 px-4 py-3 text-sm font-medium text-foreground/80 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.16)] transition duration-200 ease-out hover:-translate-y-1 hover:border-foreground/20 hover:bg-background hover:text-foreground hover:shadow-[0_22px_40px_-24px_rgba(15,23,42,0.22)]"
                  style={{
                    animation: `fade-in 240ms ease-out ${index * 45}ms both`,
                  }}
                >
                  {item}
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <Badge variant="outline" className="w-fit">
            Reviews
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight">Customer impressions from the product review records.</h2>
        </div>
        {canSubmitReview ? (
          <ReviewForm onSubmit={(payload) => addReview(product.id, payload)} />
        ) : (
          <div className="rounded-[1.8rem] border border-border/60 bg-card p-5">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">Sign in to share your review</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Review submission is available only for signed-in customer accounts so product feedback stays tied to real storefront users.
            </p>
            <div className="mt-4">
              <Button asChild className="rounded-full px-5">
                <Link to="/login">Login to review</Link>
              </Button>
            </div>
          </div>
        )}
        <ReviewList reviews={productReviews} />
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <Badge variant="outline" className="w-fit">
            You may also like
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight">Related styles from the same category.</h2>
        </div>
        <ProductGrid products={relatedProducts} />
      </section>
    </div>
  )
}
