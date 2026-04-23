import { Suspense, type ReactNode } from "react"

import {
  StorefrontProductCardSkeleton,
  StorefrontSectionHeadingSkeleton,
} from "../../../components/storefront-skeletons"
import { StorefrontHomeSectionFrame } from "./storefront-home-section-frame"

export function StorefrontHomeSectionShell({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <StorefrontHomeSectionFrame>
          <div className="space-y-6 lg:space-y-7" data-technical-name="block.storefront.home.section-shell">
            <StorefrontSectionHeadingSkeleton />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <StorefrontProductCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </StorefrontHomeSectionFrame>
      }
    >
      <StorefrontHomeSectionFrame>{children}</StorefrontHomeSectionFrame>
    </Suspense>
  )
}
