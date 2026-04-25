import { StorefrontLayout } from "../../../components/storefront-layout"
import {
  StorefrontHeroSkeleton,
  StorefrontProductCardSkeleton,
  StorefrontSectionHeadingSkeleton,
} from "../../../components/storefront-skeletons"
import { useStorefrontHomeModel } from "../hooks/use-storefront-home-model"
import { storefrontHomeSectionFrameClassName } from "../blocks/storefront-home-section-frame"
import { StorefrontHomeErrorSection } from "../sections/storefront-home-error-section"
import { StorefrontHomeModelProviderView } from "../views/storefront-home-page-view"

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
      <section className="space-y-6 lg:space-y-7">
        <StorefrontSectionHeadingSkeleton />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
  const hasBlockingError = Boolean(model.error) && !model.data
  const isInitialLoading = model.isLoading && !model.data && !hasBlockingError

  return (
    <StorefrontLayout
      showCategoryMenu
      className="pb-0"
    >
      <div
        className={`${storefrontHomeSectionFrameClassName} grid gap-12 px-4 pt-6 pb-16 sm:px-6 md:gap-14 lg:px-10 lg:pt-8 lg:pb-20 xl:gap-16 xl:px-16 xl:pt-10 2xl:px-20`}
        data-technical-name="page.storefront.home"
      >
        {isInitialLoading ? (
          <StorefrontHomePageLoadingState
            showAnnouncement={model.visibilityMap.announcement}
            showHero={model.visibilityMap.hero}
          />
        ) : null}
        {model.error ? <StorefrontHomeErrorSection error={model.error} /> : null}
        {!isInitialLoading && !hasBlockingError ? (
          <StorefrontHomeModelProviderView
            heroFallback={<StorefrontHeroSkeleton />}
            model={model}
          />
        ) : null}
      </div>
    </StorefrontLayout>
  )
}
