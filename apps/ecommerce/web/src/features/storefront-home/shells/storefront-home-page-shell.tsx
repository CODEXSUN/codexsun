import { StorefrontLayout } from "../../../components/storefront-layout"
import {
  StorefrontCategoryCardSkeleton,
  StorefrontHeroSkeleton,
  StorefrontProductCardSkeleton,
  StorefrontSectionHeadingSkeleton,
} from "../../../components/storefront-skeletons"
import { useStorefrontHomeModel } from "../hooks/use-storefront-home-model"
import { StorefrontHomeErrorSection } from "../sections/storefront-home-error-section"
import { StorefrontHomeModelProviderView } from "../views/storefront-home-page-view"

function StorefrontHomePageLoadingState() {
  return (
    <>
      <StorefrontHeroSkeleton />
      <section className="space-y-5">
        <StorefrontSectionHeadingSkeleton />
        <div className="grid gap-5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <StorefrontProductCardSkeleton key={`featured-skeleton:${index}`} />
          ))}
        </div>
      </section>
      <section className="space-y-5">
        <StorefrontSectionHeadingSkeleton />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <StorefrontCategoryCardSkeleton key={`category-skeleton:${index}`} />
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
      showFooter
      showFloatingContact={false}
      className="pb-0"
    >
      <div
        className="mx-auto grid w-full max-w-[96rem] gap-10 px-4 pt-6 pb-14 sm:px-5 lg:gap-12 lg:px-8 lg:pt-10 lg:pb-16 2xl:px-10"
        data-technical-name="page.storefront.home"
      >
        {isInitialLoading ? <StorefrontHomePageLoadingState /> : null}
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
