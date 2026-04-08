import { lazy, Suspense, type ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontAnnouncementBar } from "../components/storefront-announcement-bar"
import { StorefrontDeferredSection } from "../components/storefront-deferred-section"
import { StorefrontHeroSlider } from "../components/storefront-hero-slider"
import { StorefrontLayout } from "../components/storefront-layout"
import { storefrontHomepageSectionPerformance } from "../components/storefront-performance-standards"
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

const CampaignTrustSection = lazy(async () => import("@/components/blocks/campaign-trust-section").then((module) => ({ default: module.CampaignTrustSection })))
const CouponBanner = lazy(async () => import("@/components/blocks/coupon-banner").then((module) => ({ default: module.CouponBanner })))
const GiftCorner = lazy(async () => import("@/components/blocks/gift-corner").then((module) => ({ default: module.GiftCorner })))
const BrandStoryRail = lazy(async () => import("@/components/blocks/brand-story-rail").then((module) => ({ default: module.BrandStoryRail })))
const TrendingSection = lazy(async () => import("@/components/blocks/trending-section").then((module) => ({ default: module.TrendingSection })))
const CategoryCardGridSurface = lazy(async () => import("@/components/ux/category-card-grid-surface").then((module) => ({ default: module.CategoryCardGridSurface })))
const FeaturedCardRowSurface = lazy(async () => import("@/components/ux/featured-card-row-surface").then((module) => ({ default: module.FeaturedCardRowSurface })))

function SectionShell({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <StorefrontSectionHeadingSkeleton />
          <div className="grid gap-5 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <StorefrontProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

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
      <div className="mx-auto grid w-full max-w-[96rem] gap-12 px-5 pt-8 lg:px-8 lg:pt-10 2xl:px-10">
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
          <StorefrontDeferredSection
            rootMargin={storefrontHomepageSectionPerformance.featured.rootMargin}
            minHeightClassName={storefrontHomepageSectionPerformance.featured.minHeightClassName}
            fallback={storefrontHomepageSectionPerformance.featured.fallback}
          >
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
            <SectionShell>
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
            </SectionShell>
          </section>
          </StorefrontDeferredSection>
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
          <StorefrontDeferredSection
            rootMargin={storefrontHomepageSectionPerformance.categories.rootMargin}
            minHeightClassName={storefrontHomepageSectionPerformance.categories.minHeightClassName}
            fallback={storefrontHomepageSectionPerformance.categories.fallback}
          >
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
            <SectionShell>
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
            </SectionShell>
          </section>
          </StorefrontDeferredSection>
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

        {hasCouponBanner ? (
          <StorefrontDeferredSection
            rootMargin={storefrontHomepageSectionPerformance.couponBanner.rootMargin}
            minHeightClassName={storefrontHomepageSectionPerformance.couponBanner.minHeightClassName}
            fallback={storefrontHomepageSectionPerformance.couponBanner.fallback}
          >
            <Suspense fallback={null}>
              <CouponBanner config={couponBanner!} />
            </Suspense>
          </StorefrontDeferredSection>
        ) : null}

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

        {hasGiftCorner ? (
          <StorefrontDeferredSection
            rootMargin={storefrontHomepageSectionPerformance.giftCorner.rootMargin}
            minHeightClassName={storefrontHomepageSectionPerformance.giftCorner.minHeightClassName}
            fallback={storefrontHomepageSectionPerformance.giftCorner.fallback}
          >
            <Suspense fallback={null}>
              <GiftCorner config={giftCorner!} />
            </Suspense>
          </StorefrontDeferredSection>
        ) : null}

        {hasTrendingSection ? (
          <StorefrontDeferredSection
            rootMargin={storefrontHomepageSectionPerformance.trending.rootMargin}
            minHeightClassName={storefrontHomepageSectionPerformance.trending.minHeightClassName}
            fallback={storefrontHomepageSectionPerformance.trending.fallback}
          >
            <Suspense fallback={null}>
              <TrendingSection config={trendingSection!} />
            </Suspense>
          </StorefrontDeferredSection>
        ) : null}

        {hasBrandStories ? (
          <StorefrontDeferredSection
            rootMargin={storefrontHomepageSectionPerformance.brandStories.rootMargin}
            minHeightClassName={storefrontHomepageSectionPerformance.brandStories.minHeightClassName}
            fallback={storefrontHomepageSectionPerformance.brandStories.fallback}
          >
            <Suspense fallback={null}>
              <BrandStoryRail
                title={brandShowcase?.title ?? "More Beauty To Love"}
                description={brandShowcase?.description}
                cards={brandStories}
              />
            </Suspense>
          </StorefrontDeferredSection>
        ) : null}

        {showPromoGrid ? (
          <StorefrontDeferredSection
            rootMargin={storefrontHomepageSectionPerformance.campaignTrust.rootMargin}
            minHeightClassName={storefrontHomepageSectionPerformance.campaignTrust.minHeightClassName}
            fallback={storefrontHomepageSectionPerformance.campaignTrust.fallback}
          >
            <Suspense fallback={null}>
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
            </Suspense>
          </StorefrontDeferredSection>
        ) : null}

      </div>
    </StorefrontLayout>
  )
}
