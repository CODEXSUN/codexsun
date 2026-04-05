import { useEffect, useState } from "react"

import type { StorefrontCategorySummary } from "@ecommerce/shared"

import { StorefrontCategoryMenu } from "./storefront-category-menu"
import { StorefrontTopMenu } from "./storefront-top-menu"

export function StorefrontHeader({
  categories = [],
}: {
  categories?: StorefrontCategorySummary[]
}) {
  const [isCategoryCompact, setIsCategoryCompact] = useState(false)

  useEffect(() => {
    let frameId = 0

    function handleScroll() {
      setIsCategoryCompact(window.scrollY > 0)
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
      <StorefrontTopMenu isScrolled={false} />
      <StorefrontCategoryMenu categories={categories} isScrolled={isCategoryCompact} />
    </header>
  )
}
