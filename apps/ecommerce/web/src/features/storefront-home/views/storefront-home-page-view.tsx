import { StorefrontHeroSlider } from "../../../components/storefront-hero-slider"
import { StorefrontTechnicalNameBadgeRow } from "../../../components/storefront-technical-name-badge"
import { StorefrontHomeAnnouncementSection } from "../sections/storefront-home-announcement-section"
import { StorefrontHomeCampaignTrustSection } from "../sections/storefront-home-campaign-trust-section"
import { StorefrontHomeBrandStoriesSection } from "../sections/storefront-home-brand-stories-section"
import { StorefrontHomeCategoriesSection } from "../sections/storefront-home-categories-section"
import { StorefrontHomeFeaturedSection } from "../sections/storefront-home-featured-section"
import { StorefrontHomeProductLaneSection } from "../sections/storefront-home-product-lane-section"
import { StorefrontHomeTrendingSection } from "../sections/storefront-home-trending-section"
import {
  StorefrontHomeCouponBannerSection,
  StorefrontHomeDiscoveryBoardSection,
  StorefrontHomeGiftCornerSection,
  StorefrontHomeVisualStripSection,
} from "../sections/storefront-home-simple-block-sections"

export function StorefrontHomeModelProviderView({
  heroFallback,
  model,
}: {
  heroFallback: React.ReactNode
  model: ReturnType<typeof import("../hooks/use-storefront-home-model").useStorefrontHomeModel>
}) {
  const showTrendingForDebug = true
  const showBrandStoriesForDebug = true

  if (!model.data || !model.settings || !model.visibility) {
    return model.isLoading ? (
      <div className="relative" data-technical-name="section.storefront.home.hero">
        <StorefrontTechnicalNameBadgeRow
          names={["page.storefront.home", "section.storefront.home.hero"]}
          className="right-0 top-0"
        />
        {heroFallback}
      </div>
    ) : null
  }

  return (
    <>
      {model.visibilityMap.hero ? (
        <div className="relative" data-technical-name="section.storefront.home.hero">
          <StorefrontTechnicalNameBadgeRow
            names={["page.storefront.home", "section.storefront.home.hero"]}
            className="right-0 top-0"
          />
          <StorefrontHeroSlider landing={model.data} />
        </div>
      ) : null}
      {model.visibilityMap.announcement ? <StorefrontHomeAnnouncementSection landing={model.data} /> : null}
      {model.visibilityMap.featured ? (
        <StorefrontHomeFeaturedSection
          landing={model.data}
          items={model.featuredItems.slice(
            0,
            (model.settings.sections.featured.cardsPerRow ?? 4) *
              (model.settings.sections.featured.rowsToShow ?? 2)
          )}
          ctaHref={model.normalizeHref(model.settings.sections.featured.ctaHref, model.storefrontPaths.catalog())}
          onAddToCart={model.addCatalogItemToCart}
        />
      ) : null}
      {model.visibilityMap.categories ? (
        <StorefrontHomeCategoriesSection
          landing={model.data}
          items={model.categoryItems
            .slice(
              0,
              (model.settings.sections.categories.cardsPerRow ?? 3) *
                (model.settings.sections.categories.rowsToShow ?? 1)
            )
            .map((category) => ({
              id: category.id,
              name: category.name,
              description: category.description,
              imageUrl: category.imageUrl,
              productCount: category.productCount,
              href: model.normalizeHref(category.href, model.storefrontPaths.catalog()),
            }))}
        />
      ) : null}
      {model.visibilityMap.couponBanner ? <StorefrontHomeCouponBannerSection landing={model.data} /> : null}
      {model.visibilityMap.newArrivals ? (
        <StorefrontHomeProductLaneSection
          items={model.newArrivalItems}
          lane={model.settings.sections.newArrivals}
          ctaHref={model.normalizeHref(model.settings.sections.newArrivals.ctaHref, model.storefrontPaths.catalog())}
          onAddToCart={model.addCatalogItemToCart}
          onToggleWishlist={(item) => void model.handleToggleWishlist(item.id)}
          isWishlisted={model.isWishlisted}
          technicalName="section.storefront.home.new-arrivals"
        />
      ) : null}
      {model.visibilityMap.bestSellers ? (
        <StorefrontHomeProductLaneSection
          items={model.bestSellerItems}
          lane={model.settings.sections.bestSellers}
          ctaHref={model.normalizeHref(model.settings.sections.bestSellers.ctaHref, model.storefrontPaths.catalog())}
          onAddToCart={model.addCatalogItemToCart}
          onToggleWishlist={(item) => void model.handleToggleWishlist(item.id)}
          isWishlisted={model.isWishlisted}
          technicalName="section.storefront.home.best-sellers"
        />
      ) : null}
      {model.visibilityMap.giftCorner ? <StorefrontHomeGiftCornerSection landing={model.data} /> : null}
      {model.visibilityMap.discoveryBoard ? (
        <StorefrontHomeDiscoveryBoardSection landing={model.data} />
      ) : null}
      {model.visibilityMap.visualStrip ? (
        <StorefrontHomeVisualStripSection landing={model.data} />
      ) : null}
      {model.visibilityMap.trending && showTrendingForDebug ? <StorefrontHomeTrendingSection landing={model.data} /> : null}
      {model.visibilityMap.brandStories && showBrandStoriesForDebug ? <StorefrontHomeBrandStoriesSection landing={model.data} /> : null}
      {model.visibilityMap.campaignTrust ? (
        <StorefrontHomeCampaignTrustSection
          landing={model.data}
          ctaPrimaryHref={model.normalizeHref(model.settings.sections.cta.primaryCtaHref, model.storefrontPaths.catalog())}
          ctaSecondaryHref={model.normalizeHref(model.settings.sections.cta.secondaryCtaHref, model.storefrontPaths.cart())}
        />
      ) : null}
    </>
  )
}
