import { useMemo } from "react"

import { useStorefrontCart } from "../../../cart/storefront-cart"
import { useStorefrontCustomerPortal } from "../../../hooks/use-storefront-customer-portal"
import { useStorefrontShellData } from "../../../hooks/use-storefront-shell-data"
import {
  normalizeStorefrontHref,
  storefrontPaths,
} from "../../../lib/storefront-routes"
import {
  getStorefrontCategoryItems,
  hasContent,
  mapStorefrontCartItem,
} from "../blocks/storefront-home-content"

export function useStorefrontHomeModel() {
  const { data, error, isLoading } = useStorefrontShellData()
  const cart = useStorefrontCart()
  const customerPortal = useStorefrontCustomerPortal()

  const model = useMemo(() => {
    const settings = data?.settings ?? null
    const visibility = settings?.visibility ?? null
    const featuredItems = data?.featured ?? []
    const categoryItems = getStorefrontCategoryItems(data?.categories ?? [])
    const newArrivalsSection = settings?.sections.newArrivals ?? null
    const bestSellersSection = settings?.sections.bestSellers ?? null
    const newArrivalItemCount =
      (newArrivalsSection?.cardsPerRow ?? 3) * (newArrivalsSection?.rowsToShow ?? 1)
    const bestSellerItemCount =
      (bestSellersSection?.cardsPerRow ?? 3) * (bestSellersSection?.rowsToShow ?? 1)
    const newArrivalItems = (data?.newArrivals ?? []).slice(0, newArrivalItemCount)
    const bestSellerItems = (data?.bestSellers ?? []).slice(0, bestSellerItemCount)
    const trustNotes = settings?.trustNotes ?? []
    const couponBanner = settings?.couponBanner ?? null
    const giftCorner = settings?.giftCorner ?? null
    const discoveryBoard = settings?.discoveryBoard ?? null
    const visualStrip = settings?.visualStrip ?? null
    const trendingSection = settings?.trendingSection ?? null
    const brandShowcase = settings?.brandShowcase ?? null
    const brandStories =
      brandShowcase?.cards.filter((card) => card.imageUrl.trim().length > 0) ?? []

    const visibilityMap = {
      error: Boolean(error),
      hero: Boolean(visibility?.hero),
      announcement: Boolean(visibility?.announcement || visibility?.support),
      featured:
        Boolean(visibility?.featured) &&
        featuredItems.length > 0 &&
        (hasContent(settings?.sections.featured.eyebrow) ||
          hasContent(settings?.sections.featured.title) ||
          hasContent(settings?.sections.featured.summary) ||
          hasContent(settings?.sections.featured.ctaLabel)),
      categories:
        Boolean(visibility?.categories) &&
        categoryItems.length > 0 &&
        (hasContent(settings?.sections.categories.eyebrow) ||
          hasContent(settings?.sections.categories.title) ||
          hasContent(settings?.sections.categories.summary)),
      couponBanner:
        Boolean(couponBanner?.enabled) &&
        (hasContent(couponBanner?.title) ||
          hasContent(couponBanner?.summary) ||
          hasContent(couponBanner?.couponCode)),
      newArrivals:
        Boolean(visibility?.newArrivals) &&
        newArrivalItems.length > 0 &&
        (hasContent(settings?.sections.newArrivals.eyebrow) ||
          hasContent(settings?.sections.newArrivals.title) ||
          hasContent(settings?.sections.newArrivals.summary)),
      bestSellers:
        Boolean(visibility?.bestSellers) &&
        bestSellerItems.length > 0 &&
        (hasContent(settings?.sections.bestSellers.eyebrow) ||
          hasContent(settings?.sections.bestSellers.title) ||
          hasContent(settings?.sections.bestSellers.summary)),
      giftCorner:
        Boolean(giftCorner?.enabled) &&
        (hasContent(giftCorner?.title) ||
          hasContent(giftCorner?.summary) ||
          hasContent(giftCorner?.imageUrl)),
      discoveryBoard:
        Boolean(discoveryBoard?.enabled) &&
        Array.isArray(discoveryBoard?.cards) &&
        discoveryBoard.cards.length > 0 &&
        hasContent(discoveryBoard?.title),
      visualStrip:
        Boolean(visualStrip?.enabled) &&
        Array.isArray(visualStrip?.cards) &&
        visualStrip.cards.length > 0 &&
        hasContent(visualStrip?.title),
      trending:
        Boolean(trendingSection?.enabled) &&
        Array.isArray(trendingSection?.cards) &&
        trendingSection.cards.length > 0,
      brandStories: Boolean(brandShowcase?.enabled) && brandStories.length > 0,
      campaignTrust:
        (Boolean(visibility?.cta) &&
          (hasContent(settings?.sections.cta.eyebrow) ||
            hasContent(settings?.sections.cta.title) ||
            hasContent(settings?.sections.cta.summary) ||
            hasContent(settings?.sections.cta.primaryCtaLabel) ||
            hasContent(settings?.sections.cta.secondaryCtaLabel))) ||
        (Boolean(visibility?.trust) && trustNotes.length > 0),
    }

    return {
      bestSellerItems,
      bestSellersSection,
      brandShowcase,
      brandStories,
      categoryItems,
      couponBanner,
      data,
      discoveryBoard,
      error,
      featuredItems,
      giftCorner,
      isLoading,
      newArrivalItems,
      newArrivalsSection,
      settings,
      trendingSection,
      trustNotes,
      visibility,
      visibilityMap,
      visualStrip,
    }
  }, [data, error, isLoading])

  async function handleToggleWishlist(productId: string) {
    await customerPortal.toggleWishlist(productId)
  }

  return {
    ...model,
    addCatalogItemToCart: (item: Parameters<typeof mapStorefrontCartItem>[0]) =>
      cart.addItem(mapStorefrontCartItem(item)),
    handleToggleWishlist,
    isWishlisted: (productId: string) => customerPortal.isWishlisted(productId),
    normalizeHref: (href: string | null | undefined, fallback: string) =>
      normalizeStorefrontHref(href) ?? fallback,
    storefrontPaths,
  }
}
