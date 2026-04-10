import { Suspense, type ReactNode } from "react"

import {
  StorefrontProductCardSkeleton,
  StorefrontSectionHeadingSkeleton,
} from "../../../components/storefront-skeletons"

export function StorefrontHomeSectionShell({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-5" data-technical-name="block.storefront.home.section-shell">
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
