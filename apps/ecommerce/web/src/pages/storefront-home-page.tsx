import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CategoryCardGridSurface } from "@/components/ux/category-card-grid-surface"
import { FeaturedCardRowSurface } from "@/components/ux/featured-card-row-surface"

import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontAnnouncementBar } from "../components/storefront-announcement-bar"
import { StorefrontHeroSlider } from "../components/storefront-hero-slider"
import { StorefrontLayout } from "../components/storefront-layout"
import { StorefrontProductCard } from "../components/storefront-product-card"
import {
  StorefrontCategoryCardSkeleton,
  StorefrontHeroSkeleton,
  StorefrontProductCardSkeleton,
  StorefrontSectionHeadingSkeleton,
} from "../components/storefront-skeletons"
import { useStorefrontCustomerPortal } from "../hooks/use-storefront-customer-portal"
import { useStorefrontShellData } from "../hooks/use-storefront-shell-data"
import {
  normalizeStorefrontHref,
  storefrontPaths,
} from "../lib/storefront-routes"

function hasContent(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

export function StorefrontHomePage() {
  const { data, error, isLoading } = useStorefrontShellData()
  const cart = useStorefrontCart()
  const customerPortal = useStorefrontCustomerPortal()
  const visibility = data?.settings.visibility
  const featuredItems = data?.featured ?? []
  const categoryItems =
    data?.categories.filter((category) => category.productCount > 0 && category.slug !== "all-items") ?? []
  const newArrivalItems = (data?.newArrivals ?? []).slice(0, 2)
  const bestSellerItems = (data?.bestSellers ?? []).slice(0, 2)
  const trustNotes = data?.settings.trustNotes ?? []
  const hasFeaturedSection =
    Boolean(visibility?.featured) &&
    featuredItems.length > 0 &&
    (hasContent(data?.settings.sections.featured.eyebrow) ||
      hasContent(data?.settings.sections.featured.title) ||
      hasContent(data?.settings.sections.featured.summary) ||
      hasContent(data?.settings.sections.featured.ctaLabel))
  const hasCategorySection =
    Boolean(visibility?.categories) &&
    categoryItems.length > 0 &&
    (hasContent(data?.settings.sections.categories.eyebrow) ||
      hasContent(data?.settings.sections.categories.title) ||
      hasContent(data?.settings.sections.categories.summary))
  const hasNewArrivalsSection =
    Boolean(visibility?.newArrivals) &&
    newArrivalItems.length > 0 &&
    (hasContent(data?.settings.sections.newArrivals.eyebrow) ||
      hasContent(data?.settings.sections.newArrivals.title) ||
      hasContent(data?.settings.sections.newArrivals.summary))
  const hasBestSellersSection =
    Boolean(visibility?.bestSellers) &&
    bestSellerItems.length > 0 &&
    (hasContent(data?.settings.sections.bestSellers.eyebrow) ||
      hasContent(data?.settings.sections.bestSellers.title) ||
      hasContent(data?.settings.sections.bestSellers.summary))
  const hasCtaSection =
    Boolean(visibility?.cta) &&
    (hasContent(data?.settings.sections.cta.eyebrow) ||
      hasContent(data?.settings.sections.cta.title) ||
      hasContent(data?.settings.sections.cta.summary) ||
      hasContent(data?.settings.sections.cta.primaryCtaLabel) ||
      hasContent(data?.settings.sections.cta.secondaryCtaLabel))
  const hasTrustSection = Boolean(visibility?.trust) && trustNotes.length > 0
  const showPromoGrid = hasCtaSection || hasTrustSection

  async function handleToggleWishlist(productId: string) {
    await customerPortal.toggleWishlist(productId)
  }

  return (
    <StorefrontLayout>
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 pt-8 lg:px-8 lg:pt-10">
        {error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}
        {visibility?.hero ? (
          data ? <StorefrontHeroSlider landing={data} /> : <StorefrontHeroSkeleton />
        ) : null}

        {visibility?.announcement || visibility?.support ? (
          <StorefrontAnnouncementBar
            landing={data ?? null}
            cartSubtotalAmount={cart.subtotalAmount}
          />
        ) : null}

        {hasFeaturedSection ? (
          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                {hasContent(data?.settings.sections.featured.eyebrow) ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {data?.settings.sections.featured.eyebrow}
                  </p>
                ) : null}
                {hasContent(data?.settings.sections.featured.title) ? (
                  <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                    {data?.settings.sections.featured.title}
                  </h2>
                ) : null}
                {hasContent(data?.settings.sections.featured.summary) ? (
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                    {data?.settings.sections.featured.summary}
                  </p>
                ) : null}
              </div>
              {hasContent(data?.settings.sections.featured.ctaLabel) ? (
                <Button asChild variant="outline" className="rounded-full">
                  <Link
                    to={
                      normalizeStorefrontHref(data?.settings.sections.featured.ctaHref) ??
                      storefrontPaths.catalog()
                    }
                    className="gap-2"
                  >
                    {data?.settings.sections.featured.ctaLabel}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
            <FeaturedCardRowSurface
              cardsPerRow={data?.settings.sections.featured.cardsPerRow ?? 3}
              cardDesign={data?.settings.sections.featured.cardDesign}
              items={featuredItems
                .slice(
                  0,
                  (data?.settings.sections.featured.cardsPerRow ?? 3) *
                    (data?.settings.sections.featured.rowsToShow ?? 1)
                )
                .map((item) => ({
                id: item.id,
                href: storefrontPaths.product(item.slug),
                name: item.name,
                imageUrl: item.primaryImageUrl,
                badge: item.badge ?? item.categoryName,
                brandName: item.brandName,
                categoryName: item.categoryName,
                shortDescription: item.shortDescription,
                amount: item.sellingPrice,
                compareAtAmount: item.mrp > item.sellingPrice ? item.mrp : null,
                availableQuantity: item.availableQuantity,
                onAddToCart: () =>
                  cart.addItem({
                    productId: item.id,
                    slug: item.slug,
                    name: item.name,
                    imageUrl: item.primaryImageUrl,
                  unitPrice: item.sellingPrice,
                  mrp: item.mrp,
                }),
              }))}
            />
          </section>
        ) : isLoading ? (
          <section className="space-y-5">
            <StorefrontSectionHeadingSkeleton />
            <div className="grid gap-5 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <StorefrontProductCardSkeleton key={index} />
              ))}
            </div>
          </section>
        ) : null}

        {hasCategorySection ? (
          <section className="space-y-5">
            <div>
              {hasContent(data?.settings.sections.categories.eyebrow) ? (
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {data?.settings.sections.categories.eyebrow}
                </p>
              ) : null}
              {hasContent(data?.settings.sections.categories.title) ? (
                <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                  {data?.settings.sections.categories.title}
                </h2>
              ) : null}
              {hasContent(data?.settings.sections.categories.summary) ? (
                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                  {data?.settings.sections.categories.summary}
                </p>
              ) : null}
            </div>
            <CategoryCardGridSurface
              items={categoryItems
                .slice(
                  0,
                  (data?.settings.sections.categories.cardsPerRow ?? 3) *
                    (data?.settings.sections.categories.rowsToShow ?? 1)
                )
                .map((category) => ({
                  id: category.id,
                  name: category.name,
                  description: category.description,
                  imageUrl: category.imageUrl,
                  productCount: category.productCount,
                  href:
                    normalizeStorefrontHref(category.href) ?? storefrontPaths.catalog(),
                }))}
              cardsPerRow={data?.settings.sections.categories.cardsPerRow ?? 3}
              rowsToShow={data?.settings.sections.categories.rowsToShow ?? 1}
              cardDesign={data?.settings.sections.categories.cardDesign}
            />
          </section>
        ) : isLoading ? (
          <section className="space-y-5">
            <StorefrontSectionHeadingSkeleton />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <StorefrontCategoryCardSkeleton key={index} />
              ))}
            </div>
          </section>
        ) : null}

        {hasNewArrivalsSection || hasBestSellersSection ? (
          <section className="grid gap-5 lg:grid-cols-2">
            {hasNewArrivalsSection ? (
              <div className="space-y-5">
                <div>
                  {hasContent(data?.settings.sections.newArrivals.eyebrow) ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {data?.settings.sections.newArrivals.eyebrow}
                    </p>
                  ) : null}
                  {hasContent(data?.settings.sections.newArrivals.title) ? (
                    <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                      {data?.settings.sections.newArrivals.title}
                    </h2>
                  ) : null}
                  {hasContent(data?.settings.sections.newArrivals.summary) ? (
                    <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                      {data?.settings.sections.newArrivals.summary}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-5">
                  {newArrivalItems.map((item) => (
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
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {hasBestSellersSection ? (
              <div className="space-y-5">
                <div>
                  {hasContent(data?.settings.sections.bestSellers.eyebrow) ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {data?.settings.sections.bestSellers.eyebrow}
                    </p>
                  ) : null}
                  {hasContent(data?.settings.sections.bestSellers.title) ? (
                    <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                      {data?.settings.sections.bestSellers.title}
                    </h2>
                  ) : null}
                  {hasContent(data?.settings.sections.bestSellers.summary) ? (
                    <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                      {data?.settings.sections.bestSellers.summary}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-5">
                  {bestSellerItems.map((item) => (
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
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {showPromoGrid ? (
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            {hasCtaSection ? (
              <Card className="rounded-[2rem] border-[#decfbd] bg-[linear-gradient(135deg,#221812_0%,#3b2a20_100%)] py-0 text-stone-100 shadow-[0_30px_80px_-52px_rgba(28,15,8,0.75)]">
                <CardContent className="space-y-5 p-7">
                  {hasContent(data?.settings.sections.cta.eyebrow) ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">
                      {data?.settings.sections.cta.eyebrow}
                    </p>
                  ) : null}
                  <div className="space-y-3">
                    {hasContent(data?.settings.sections.cta.title) ? (
                      <h2 className="font-heading text-3xl font-semibold tracking-tight">
                        {data?.settings.sections.cta.title}
                      </h2>
                    ) : null}
                    {hasContent(data?.settings.sections.cta.summary) ? (
                      <p className="max-w-2xl text-sm leading-7 text-stone-200/80">
                        {data?.settings.sections.cta.summary}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {hasContent(data?.settings.sections.cta.primaryCtaLabel) ? (
                      <Button asChild className="rounded-full bg-white text-[#241913] hover:bg-white/90">
                        <Link
                          to={
                            normalizeStorefrontHref(data?.settings.sections.cta.primaryCtaHref) ??
                            storefrontPaths.catalog()
                          }
                        >
                          {data?.settings.sections.cta.primaryCtaLabel}
                        </Link>
                      </Button>
                    ) : null}
                    {hasContent(data?.settings.sections.cta.secondaryCtaLabel) ? (
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10"
                      >
                        <Link
                          to={
                            normalizeStorefrontHref(data?.settings.sections.cta.secondaryCtaHref) ??
                            storefrontPaths.cart()
                          }
                        >
                          {data?.settings.sections.cta.secondaryCtaLabel}
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ) : null}
            {hasTrustSection ? (
              <div className="grid gap-4">
                {trustNotes.map((note) => {
                  const Icon =
                    note.iconKey === "truck"
                      ? Truck
                      : note.iconKey === "shield"
                        ? ShieldCheck
                        : Sparkles

                  return (
                    <Card key={note.id} className="rounded-[1.6rem] border-[#e4d6c7] py-0 shadow-sm">
                      <CardContent className="space-y-3 p-5">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#f4e8da] text-[#6d5140]">
                          <Icon className="size-5" />
                        </div>
                        <p className="font-medium">{note.title}</p>
                        <p className="text-sm leading-6 text-muted-foreground">{note.summary}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : null}
          </section>
        ) : null}

      </div>
    </StorefrontLayout>
  )
}
