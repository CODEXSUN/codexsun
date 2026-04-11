import { StorefrontLayout } from "../../../components/storefront-layout"
import {
  StorefrontHeroSkeleton,
  StorefrontProductCardSkeleton,
  StorefrontSectionHeadingSkeleton,
} from "../../../components/storefront-skeletons"
import { useStorefrontHomeModel } from "../hooks/use-storefront-home-model"
import { StorefrontHomeErrorSection } from "../sections/storefront-home-error-section"
import { StorefrontHomeModelProviderView } from "../views/storefront-home-page-view"

const storefrontHomeSectionReviewVisibility = {
  announcement: true,
  bestSellers: true,
  brandStories: true,
  campaignTrust: true,
  categories: true,
  couponBanner: true,
  featured: true,
  giftCorner: true,
  hero: true,
  newArrivals: true,
  trending: true,
} as const

function StorefrontHomePageLoadingState({
  showAnnouncement = false,
  showHero = true,
}: {
  showAnnouncement?: boolean
  showHero?: boolean
}) {
  return (
    <>
      {showAnnouncement ? (
        <section
          className="min-h-16 rounded-[1.75rem] border border-[#eadbca] bg-[#221812]/5"
          data-technical-name="section.storefront.home.announcement"
        />
      ) : null}
      {showHero ? <StorefrontHeroSkeleton /> : null}
      <section className="space-y-5">
        <StorefrontSectionHeadingSkeleton />
        <div className="grid gap-5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <StorefrontProductCardSkeleton key={`featured-skeleton:${index}`} />
          ))}
        </div>
      </section>
    </>
  )
}

export function StorefrontHomePageShell() {
  const model = useStorefrontHomeModel()
  const sectionVisibility = {
    ...model.visibilityMap,
    ...storefrontHomeSectionReviewVisibility,
  }
  const reviewModel = {
    ...model,
    visibilityMap: sectionVisibility,
  }
  const hasBlockingError = Boolean(model.error) && !model.data
  const isInitialLoading = model.isLoading && !model.data && !hasBlockingError

  return (
    <StorefrontLayout
      showCategoryMenu
      className="pb-0"
    >
      <div
        className="mx-auto grid w-full max-w-[96rem] gap-10 px-4 pt-6 pb-14 sm:px-5 lg:gap-14 lg:px-8 lg:pt-10 lg:pb-18 xl:gap-16 2xl:px-10"
        data-technical-name="page.storefront.home"
      >
        {isInitialLoading ? (
          <StorefrontHomePageLoadingState
            showAnnouncement={reviewModel.visibilityMap.announcement}
            showHero={reviewModel.visibilityMap.hero}
          />
        ) : null}
        {model.error ? <StorefrontHomeErrorSection error={model.error} /> : null}
        {!isInitialLoading && !hasBlockingError ? (
          <StorefrontHomeModelProviderView
            heroFallback={<StorefrontHeroSkeleton />}
            model={reviewModel}
          />
        ) : null}
      </div>
    </StorefrontLayout>
  )
}
