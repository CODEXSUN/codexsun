import { useEffect, useState } from "react"

import type { StorefrontCategorySummary } from "@ecommerce/shared"

export type StorefrontHeaderProps = {
  categories?: StorefrontCategorySummary[]
  showCategoryMenu?: boolean
}

export function useStorefrontHeaderScrollState() {
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

  return {
    isCategoryCompact,
  }
}
