import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import { CampaignTrustSection } from "@/components/blocks/campaign-trust-section"
import { Button } from "@/components/ui/button"
import { CouponBanner } from "@/components/blocks/coupon-banner"
import { GiftCorner } from "@/components/blocks/gift-corner"
import { BrandStoryRail } from "@/components/blocks/brand-story-rail"
import { TrendingSection } from "@/components/blocks/trending-section"
import { Card, CardContent } from "@/components/ui/card"
import { CategoryCardGridSurface } from "@/components/ux/category-card-grid-surface"
import { FeaturedCardRowSurface } from "@/components/ux/featured-card-row-surface"

import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontAnnouncementBar } from "../components/storefront-announcement-bar"
import { StorefrontHeroSlider } from "../components/storefront-hero-slider"
import { StorefrontLayout } from "../components/storefront-layout"
import { StorefrontProductCardGrid } from "../components/storefront-product-card-grid"
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
  const newArrivalsSection = data?.settings.sections.newArrivals
  const bestSellersSection = data?.settings.sections.bestSellers
  const featuredItems = data?.featured ?? []
  const categoryItems =
    data?.categories.filter((category) => category.productCount > 0 && category.slug !== "all-items") ?? []
  const newArrivalItemCount =
    (newArrivalsSection?.cardsPerRow ?? 3) * (newArrivalsSection?.rowsToShow ?? 1)
  const bestSellerItemCount =
    (bestSellersSection?.cardsPerRow ?? 3) * (bestSellersSection?.rowsToShow ?? 1)
  const newArrivalItems = (data?.newArrivals ?? []).slice(0, newArrivalItemCount)
  const bestSellerItems = (data?.bestSellers ?? []).slice(0, bestSellerItemCount)
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
  const couponBanner = data?.settings.couponBanner ?? null
  const giftCorner = data?.settings.giftCorner ?? null
  const trendingSection = data?.settings.trendingSection ?? null
  const brandStories = data?.settings.brandShowcase.cards ?? data?.brands ?? []
  const brandShowcase = data?.settings.brandShowcase
  const hasCouponBanner =
    Boolean(couponBanner?.enabled) &&
    (hasContent(couponBanner?.title) || hasContent(couponBanner?.summary) || hasContent(couponBanner?.couponCode))
  const hasGiftCorner =
    Boolean(giftCorner?.enabled) &&
    (hasContent(giftCorner?.title) || hasContent(giftCorner?.summary) || hasContent(giftCorner?.imageUrl))
  const hasTrendingSection =
    Boolean(trendingSection?.enabled) &&
    Array.isArray(trendingSection?.cards) &&
    trendingSection.cards.length > 0
  const hasBrandStories = Boolean(brandShowcase?.enabled) && brandStories.length > 0
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
                    shippingCharge: item.shippingCharge,
                    handlingCharge: item.handlingCharge,
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

        {hasCouponBanner ? <CouponBanner config={couponBanner!} /> : null}

        {hasNewArrivalsSection ? (
          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
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
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                    {data?.settings.sections.newArrivals.summary}
                  </p>
                ) : null}
              </div>
              {hasContent(data?.settings.sections.newArrivals.ctaLabel) ? (
                <Button asChild variant="outline" className="rounded-full">
                  <Link
                    to={
                      normalizeStorefrontHref(data?.settings.sections.newArrivals.ctaHref) ??
                      storefrontPaths.catalog()
                    }
                    className="gap-2"
                  >
                    {data?.settings.sections.newArrivals.ctaLabel}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
            <StorefrontProductCardGrid
              items={newArrivalItems}
              cardsPerRow={newArrivalsSection?.cardsPerRow ?? 3}
              rowsToShow={newArrivalsSection?.rowsToShow ?? 1}
              isWishlisted={(productId) => customerPortal.isWishlisted(productId)}
              onToggleWishlist={(item) => void handleToggleWishlist(item.id)}
              onAddToCart={(item) =>
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
          </section>
        ) : null}

        {hasBestSellersSection ? (
          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
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
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                    {data?.settings.sections.bestSellers.summary}
                  </p>
                ) : null}
              </div>
              {hasContent(data?.settings.sections.bestSellers.ctaLabel) ? (
                <Button asChild variant="outline" className="rounded-full">
                  <Link
                    to={
                      normalizeStorefrontHref(data?.settings.sections.bestSellers.ctaHref) ??
                      storefrontPaths.catalog()
                    }
                    className="gap-2"
                  >
                    {data?.settings.sections.bestSellers.ctaLabel}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
            <StorefrontProductCardGrid
              items={bestSellerItems}
              cardsPerRow={bestSellersSection?.cardsPerRow ?? 3}
              rowsToShow={bestSellersSection?.rowsToShow ?? 1}
              isWishlisted={(productId) => customerPortal.isWishlisted(productId)}
              onToggleWishlist={(item) => void handleToggleWishlist(item.id)}
              onAddToCart={(item) =>
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
          </section>
        ) : null}

        {hasGiftCorner ? <GiftCorner config={giftCorner!} /> : null}

        {hasTrendingSection ? <TrendingSection config={trendingSection!} /> : null}

        {hasBrandStories ? (
          <BrandStoryRail
            title={brandShowcase?.title ?? "More Beauty To Love"}
            description={brandShowcase?.description}
            cards={brandStories}
          />
        ) : null}

        {showPromoGrid ? (
          <CampaignTrustSection
            campaign={{
              ...data!.settings.sections.cta,
              primaryCtaHref:
                normalizeStorefrontHref(data?.settings.sections.cta.primaryCtaHref) ??
                storefrontPaths.catalog(),
              secondaryCtaHref:
                normalizeStorefrontHref(data?.settings.sections.cta.secondaryCtaHref) ??
                storefrontPaths.cart(),
            }}
            trustNotes={trustNotes}
            design={data?.settings.campaignDesign}
            visibility={{
              cta: visibility?.cta,
              trust: visibility?.trust,
            }}
          />
        ) : null}

      </div>
    </StorefrontLayout>
  )
}
