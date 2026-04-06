import { useEffect, useState } from "react"

import type { StorefrontCategorySummary } from "@ecommerce/shared"

import { StorefrontCategoryMenu } from "./storefront-category-menu"
import { StorefrontTopMenu } from "./storefront-top-menu"

export function StorefrontHeader({
  categories = [],
  showCategoryMenu = true,
}: {
  categories?: StorefrontCategorySummary[]
  showCategoryMenu?: boolean
}) {
  const [isCategoryCompact, setIsCategoryCompact] = useState(false)
  const compactScrollThreshold = 10
  const topRevealThreshold = 6

  useEffect(() => {
    let frameId = 0

    function handleScroll() {
      const currentScrollY = window.scrollY

      if (currentScrollY <= topRevealThreshold) {
        setIsCategoryCompact(false)
        return
      }

      if (currentScrollY <= compactScrollThreshold) {
        return
      }

      setIsCategoryCompact(true)
    }

    function handleScrollFrame() {
      if (frameId) {
        return
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0
        handleScroll()
      })
    }

    handleScroll()
    window.addEventListener("scroll", handleScrollFrame, { passive: true })

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      window.removeEventListener("scroll", handleScrollFrame)
    }
  }, [])

  return (
    <header className="sticky top-0 z-40">
      <StorefrontTopMenu isScrolled={isCategoryCompact} />
      {showCategoryMenu ? (
        <div className="hidden md:block">
          <StorefrontCategoryMenu categories={categories} isScrolled={isCategoryCompact} />
        </div>
      ) : null}
    </header>
  )
}
