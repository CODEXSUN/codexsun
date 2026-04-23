import { useEffect, useMemo, useState } from "react"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { useStorefrontCart } from "../cart/storefront-cart"
import { resolveHomeSliderThemeStyles } from "../lib/home-slider-theme"
import { mapStorefrontCartItem } from "../features/storefront-home/blocks/storefront-home-content"

export function formatStorefrontHeroCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export const smoothContentTransition = {
  type: "spring" as const,
  stiffness: 120,
  damping: 20,
  mass: 0.95,
}

export const smoothImageTransition = {
  type: "spring" as const,
  stiffness: 110,
  damping: 18,
  mass: 1,
}

export const staggeredContentTransition = {
  staggerChildren: 0.06,
  delayChildren: 0.04,
}

export const staggeredContentItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: {
    duration: 0.28,
    ease: [0.22, 1, 0.36, 1] as const,
  },
}

export function useStorefrontHeroSliderModel(landing: StorefrontLandingResponse) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isExpandedAfterStartup, setIsExpandedAfterStartup] = useState(false)
  const cart = useStorefrontCart()

  const model = useMemo(() => {
    const allFeaturedItems =
      landing.featured.length > 0 ? landing.featured : landing.newArrivals
    const featuredItems = isExpandedAfterStartup
      ? allFeaturedItems
      : allFeaturedItems.slice(0, Math.min(3, allFeaturedItems.length))
    const activeItem = featuredItems[selectedIndex] ?? featuredItems[0] ?? null

    if (!activeItem) {
      return {
        activeBadge: null,
        activeItem: null,
        activePrimaryCtaLabel: null,
        activeSummary: null,
        activeTitle: null,
        featuredItems,
        sliderStyles: null,
      }
    }

    const activeBadge =
      activeItem.promoSliderEnabled && activeItem.promoBadge
        ? activeItem.promoBadge
        : activeItem.badge ?? activeItem.department ?? landing.settings.hero.eyebrow
    const activeTitle =
      activeItem.promoSliderEnabled && activeItem.promoTitle
        ? activeItem.promoTitle
        : activeItem.name ?? landing.settings.hero.title
    const activeSummary =
      activeItem.promoSliderEnabled && activeItem.promoSubtitle
        ? activeItem.promoSubtitle
        : activeItem.shortDescription ?? landing.settings.hero.summary
    const themeCount = landing.settings.homeSlider.slides.length
    const activeSliderTheme =
      (themeCount > 0
        ? landing.settings.homeSlider.slides[selectedIndex % themeCount]?.theme
        : null) ?? landing.settings.homeSlider.slides[0]?.theme
    const sliderStyles = resolveHomeSliderThemeStyles(
      activeSliderTheme ?? landing.settings.homeSlider.slides[0].theme
    )
    const activePrimaryCtaLabel =
      activeItem.promoSliderEnabled && activeItem.promoCtaLabel
        ? activeItem.promoCtaLabel
        : sliderStyles.primaryButtonLabel

    return {
      activeBadge,
      activeItem,
      activePrimaryCtaLabel,
      activeSummary,
      activeTitle,
      featuredItems,
      sliderStyles,
    }
  }, [isExpandedAfterStartup, landing, selectedIndex])

  useEffect(() => {
    setIsExpandedAfterStartup(false)

    if ((landing.featured.length > 0 ? landing.featured.length : landing.newArrivals.length) <= 3) {
      return
    }

    let timeoutId = 0

    const scheduleExpand = () => {
      timeoutId = window.setTimeout(() => {
        setIsExpandedAfterStartup(true)
      }, 1200)
    }

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(() => {
        scheduleExpand()
      })

      return () => {
        window.cancelIdleCallback(idleId)
        if (timeoutId) {
          window.clearTimeout(timeoutId)
        }
      }
    }

    scheduleExpand()

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [landing])

  useEffect(() => {
    setSelectedIndex((current) => {
      if (model.featuredItems.length === 0) {
        return 0
      }

      return current >= model.featuredItems.length ? 0 : current
    })
  }, [model.featuredItems.length])

  useEffect(() => {
    if (model.featuredItems.length <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setDirection(1)
      setSelectedIndex((current) => (current + 1) % model.featuredItems.length)
    }, 5000)

    return () => {
      window.clearInterval(timer)
    }
  }, [model.featuredItems.length])

  function goPrevious() {
    setDirection(-1)
    setSelectedIndex((current) => (current - 1 + model.featuredItems.length) % model.featuredItems.length)
  }

  function goNext() {
    setDirection(1)
    setSelectedIndex((current) => (current + 1) % model.featuredItems.length)
  }

  return {
    ...model,
    addToCart: () => {
      if (!model.activeItem) {
        return
      }

      cart.addItem(mapStorefrontCartItem(model.activeItem))
    },
    direction,
    goNext,
    goPrevious,
    selectedIndex,
  }
}
