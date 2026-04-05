import { AnimatePresence, motion } from "motion/react"
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Star,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import type { StorefrontLandingResponse } from "@ecommerce/shared"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useStorefrontCart } from "../cart/storefront-cart"
import { resolveHomeSliderThemeStyles } from "../lib/home-slider-theme"
import { storefrontPaths } from "../lib/storefront-routes"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

const smoothContentTransition = {
  type: "spring" as const,
  stiffness: 120,
  damping: 20,
  mass: 0.95,
}

const smoothImageTransition = {
  type: "spring" as const,
  stiffness: 110,
  damping: 18,
  mass: 1,
}

const staggeredContentTransition = {
  staggerChildren: 0.06,
  delayChildren: 0.04,
}

const staggeredContentItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: {
    duration: 0.28,
    ease: [0.22, 1, 0.36, 1] as const,
  },
}

export function StorefrontHeroSlider({
  landing,
}: {
  landing: StorefrontLandingResponse
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const cart = useStorefrontCart()
  const featuredItems =
    (landing.featured.length > 0 ? landing.featured : landing.newArrivals).slice(
      0,
      Math.max(landing.settings.homeSlider.slides.length, 1)
    )
  const activeItem = featuredItems[selectedIndex] ?? featuredItems[0] ?? null
  const activeBadge =
    activeItem?.promoSliderEnabled && activeItem.promoBadge
      ? activeItem.promoBadge
      : activeItem?.badge ?? activeItem?.categoryName ?? landing.settings.hero.eyebrow
  const activeTitle =
    activeItem?.promoSliderEnabled && activeItem.promoTitle
      ? activeItem.promoTitle
      : activeItem?.name ?? landing.settings.hero.title
  const activeSummary =
    activeItem?.promoSliderEnabled && activeItem.promoSubtitle
      ? activeItem.promoSubtitle
      : activeItem?.shortDescription ?? landing.settings.hero.summary
  const activeSliderTheme =
    landing.settings.homeSlider.slides[selectedIndex]?.theme ??
    landing.settings.homeSlider.slides[0]?.theme
  const sliderStyles = resolveHomeSliderThemeStyles(activeSliderTheme ?? landing.settings.homeSlider.slides[0].theme)
  const activePrimaryCtaLabel =
    activeItem?.promoSliderEnabled && activeItem.promoCtaLabel
      ? activeItem.promoCtaLabel
      : sliderStyles.primaryButtonLabel

  useEffect(() => {
    if (featuredItems.length <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setDirection(1)
      setSelectedIndex((current) => (current + 1) % featuredItems.length)
    }, 5000)

    return () => {
      window.clearInterval(timer)
    }
  }, [featuredItems.length])

  if (!activeItem) {
    return null
  }

  function goPrevious() {
    setDirection(-1)
    setSelectedIndex((current) => (current - 1 + featuredItems.length) % featuredItems.length)
  }

  function goNext() {
    setDirection(1)
    setSelectedIndex((current) => (current + 1) % featuredItems.length)
  }

  return (
    <section
      className="relative overflow-hidden rounded-[2.6rem] border border-[#e1d3c4] shadow-[0_35px_95px_-46px_rgba(52,26,15,0.42)] lg:h-[520px]"
      style={{
        background: sliderStyles.background,
        color: sliderStyles.textColor,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.14),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_32%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:flex lg:h-full lg:px-12 lg:py-12">
        <div className="space-y-5 lg:hidden">
          <div className="relative overflow-hidden rounded-[2rem] shadow-[0_28px_72px_-42px_rgba(24,12,7,0.48)]">
            <div className="absolute inset-x-4 top-3 z-10 flex items-center justify-between gap-3 sm:inset-x-5">
              <Badge
                className="w-fit rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] backdrop-blur-sm"
                style={{
                  background: sliderStyles.badgeBackground,
                  color: sliderStyles.badgeTextColor,
                  borderColor: sliderStyles.innerFrameBorderColor,
                }}
              >
                {activeBadge}
              </Badge>
              {featuredItems.length > 1 ? (
                <div className="mr-1 flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-9 rounded-full border shadow-sm"
                    style={{
                      background: sliderStyles.navBackground,
                      color: sliderStyles.navTextColor,
                      borderColor: sliderStyles.innerFrameBorderColor,
                    }}
                    onClick={goPrevious}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-9 rounded-full border shadow-sm"
                    style={{
                      background: sliderStyles.navBackground,
                      color: sliderStyles.navTextColor,
                      borderColor: sliderStyles.innerFrameBorderColor,
                    }}
                    onClick={goNext}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="pt-10">
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={`${activeItem.id}:mobile-image`}
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 18 : -18, scale: 0.992 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: direction > 0 ? -14 : 14, scale: 0.992 }}
                  transition={{ ...smoothImageTransition, delay: 0.05 }}
                  className="relative mt-3 h-[280px] w-full sm:mt-3 sm:h-[340px]"
                >
                  <div
                    className="flex h-full w-full overflow-hidden rounded-[1.78rem] p-2 backdrop-blur-[24px]"
                    style={{
                      background: sliderStyles.frameBackground,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.34), 0 0 0 1px ${sliderStyles.outerFrameBorderColor}, 0 18px 40px -28px rgba(24,12,7,0.28), 0 10px 34px -18px rgba(255,255,255,0.16)`,
                    }}
                  >
                    <div
                      className="flex h-full w-full overflow-hidden rounded-[1.56rem] border p-2"
                      style={{
                        background: sliderStyles.imagePanelBackground,
                        borderColor: sliderStyles.innerFrameBorderColor,
                      }}
                    >
                      <div
                        className="h-full w-full overflow-hidden rounded-[1.3rem]"
                        style={{ background: sliderStyles.imagePanelBackground }}
                      >
                        <img
                          src={activeItem.primaryImageUrl ?? landing.settings.hero.heroImageUrl}
                          alt={activeItem.name}
                          className="h-full w-full object-cover object-center"
                          loading="eager"
                          decoding="async"
                          fetchPriority="high"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={`${activeItem.id}:mobile-content`}
              custom={direction}
              initial={{ opacity: 0, y: direction > 0 ? 16 : -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction > 0 ? -10 : 10 }}
              transition={smoothContentTransition}
              className="space-y-4 px-1 pb-1"
            >
              <motion.div initial="initial" animate="animate" exit="exit" transition={staggeredContentTransition}>
                <motion.div variants={staggeredContentItem} className="space-y-3">
                  <h1 className="line-clamp-2 font-heading text-[1.9rem] font-semibold tracking-tight leading-[1.02] sm:text-[2.2rem]">
                    {activeTitle}
                  </h1>
                </motion.div>
                <motion.p
                  variants={staggeredContentItem}
                  className="line-clamp-2 pt-3 text-sm leading-6 sm:text-base sm:leading-7"
                  style={{ color: sliderStyles.mutedTextColor }}
                >
                  {activeSummary}
                </motion.p>

                <motion.div variants={staggeredContentItem} className="flex items-center gap-5 py-5">
                  <div className="flex flex-col gap-1">
                    <span
                      className="text-[10px] font-medium uppercase tracking-[0.16em]"
                      style={{ color: sliderStyles.mutedTextColor }}
                    >
                      Special Price
                    </span>
                    <span className="text-2xl font-semibold sm:text-[1.9rem]">
                      {formatCurrency(activeItem.sellingPrice)}
                    </span>
                  </div>
                  <div className="h-9 w-px" style={{ background: `${sliderStyles.mutedTextColor}33` }} />
                  <div className="flex flex-col gap-1">
                    <span
                      className="text-[10px] font-medium uppercase tracking-[0.16em]"
                      style={{ color: sliderStyles.mutedTextColor }}
                    >
                      Rating & Reviews
                    </span>
                    <div className="flex items-center gap-2 text-amber-300">
                      <Star className="size-4 fill-current" />
                      <span className="text-lg font-semibold">
                        {activeItem.isBestSeller ? "4.8" : activeItem.isFeaturedLabel ? "4.6" : "4.5"}
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={staggeredContentItem} className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    className="h-10 rounded-full px-5 text-sm font-semibold sm:flex-1"
                    style={{
                      background: sliderStyles.primaryButtonBackground,
                      color: sliderStyles.primaryButtonTextColor,
                    }}
                    onClick={() =>
                      cart.addItem({
                        productId: activeItem.id,
                        slug: activeItem.slug,
                        name: activeItem.name,
                        imageUrl: activeItem.primaryImageUrl,
                        unitPrice: activeItem.sellingPrice,
                        mrp: activeItem.mrp,
                      })
                    }
                  >
                    <ShoppingBag className="size-4" />
                    {activePrimaryCtaLabel}
                  </Button>
                  <Link
                    to={storefrontPaths.product(activeItem.slug)}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-10 rounded-xl px-5 text-sm font-medium backdrop-blur-sm sm:flex-1"
                    )}
                    style={{
                      background: sliderStyles.secondaryButtonBackground,
                      color: sliderStyles.secondaryButtonTextColor,
                      borderColor: sliderStyles.innerFrameBorderColor,
                    }}
                  >
                    {sliderStyles.secondaryButtonLabel}
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden h-full w-full items-center gap-10 lg:grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex h-full flex-col">
            <Badge
              className="mt-1 w-fit self-start rounded-full border px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] backdrop-blur-sm"
              style={{
                background: sliderStyles.badgeBackground,
                color: sliderStyles.badgeTextColor,
                borderColor: sliderStyles.innerFrameBorderColor,
              }}
            >
              {activeBadge}
            </Badge>
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={`${activeItem.id}:content`}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 24 : -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -16 : 16 }}
                transition={smoothContentTransition}
                className="my-auto -translate-y-4 space-y-6"
              >
                <motion.div initial="initial" animate="animate" exit="exit" transition={staggeredContentTransition}>
                  <motion.div variants={staggeredContentItem} className="space-y-5">
                    <h1 className="line-clamp-2 max-w-xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.6rem] lg:leading-[0.98]">
                      {activeTitle}
                    </h1>
                  </motion.div>
                  <motion.p
                    variants={staggeredContentItem}
                    className="line-clamp-2 max-w-2xl overflow-hidden pt-5 text-base leading-8 sm:text-lg"
                    style={{ color: sliderStyles.mutedTextColor }}
                  >
                    {activeSummary}
                  </motion.p>
                  <motion.div variants={staggeredContentItem} className="flex flex-wrap items-center gap-7 py-6">
                    <div className="flex flex-col gap-1">
                      <span
                        className="text-xs font-medium uppercase tracking-[0.16em]"
                        style={{ color: sliderStyles.mutedTextColor }}
                      >
                        Special Price
                      </span>
                      <span className="text-3xl font-semibold sm:text-4xl">
                        {formatCurrency(activeItem.sellingPrice)}
                      </span>
                    </div>
                    <div className="h-10 w-px" style={{ background: `${sliderStyles.mutedTextColor}33` }} />
                    <div className="flex flex-col gap-1">
                      <span
                        className="text-xs font-medium uppercase tracking-[0.16em]"
                        style={{ color: sliderStyles.mutedTextColor }}
                      >
                        Rating & Reviews
                      </span>
                      <div className="flex items-center gap-2 text-amber-300">
                        <Star className="size-4 fill-current sm:size-5" />
                        <span className="text-xl font-semibold">
                          {activeItem.isBestSeller ? "4.8" : activeItem.isFeaturedLabel ? "4.6" : "4.5"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div variants={staggeredContentItem} className="flex flex-wrap items-center gap-3 pt-3">
                    <Button
                      type="button"
                      className="h-11 rounded-full px-6 text-base font-semibold"
                      style={{
                        background: sliderStyles.primaryButtonBackground,
                        color: sliderStyles.primaryButtonTextColor,
                      }}
                      onClick={() =>
                        cart.addItem({
                          productId: activeItem.id,
                          slug: activeItem.slug,
                          name: activeItem.name,
                          imageUrl: activeItem.primaryImageUrl,
                          unitPrice: activeItem.sellingPrice,
                          mrp: activeItem.mrp,
                        })
                      }
                    >
                      <ShoppingBag className="size-4" />
                      {activePrimaryCtaLabel}
                    </Button>
                    <Link
                      to={storefrontPaths.product(activeItem.slug)}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-11 rounded-xl px-6 text-base font-medium backdrop-blur-sm"
                      )}
                      style={{
                        background: sliderStyles.secondaryButtonBackground,
                        color: sliderStyles.secondaryButtonTextColor,
                        borderColor: sliderStyles.innerFrameBorderColor,
                      }}
                    >
                      {sliderStyles.secondaryButtonLabel}
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative flex h-full items-center justify-center sm:-my-4 lg:-my-7">
            <div className="relative flex h-full w-full items-center justify-center">
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={`${activeItem.id}:image`}
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 24 : -24, scale: 0.992 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: direction > 0 ? -18 : 18, scale: 0.992 }}
                  transition={{ ...smoothImageTransition, delay: 0.06 }}
                  className="relative z-[1] h-[360px] w-full max-w-[360px] rounded-[2rem] p-3 backdrop-blur-[24px] sm:h-[420px] sm:max-w-[440px] lg:h-[480px] lg:w-[520px] lg:max-w-[520px]"
                  style={{
                    background: sliderStyles.frameBackground,
                    boxShadow:
                      `inset 0 1px 0 rgba(255,255,255,0.34), 0 0 0 1px ${sliderStyles.outerFrameBorderColor}, 0 28px 72px -42px rgba(24,12,7,0.34), 0 12px 38px -20px rgba(255,255,255,0.18)`,
                  }}
                >
                  <div
                    className="flex h-full overflow-hidden rounded-[1.7rem] border p-px"
                    style={{
                      background: sliderStyles.imagePanelBackground,
                      borderColor: sliderStyles.innerFrameBorderColor,
                    }}
                  >
                    <div
                      className="h-full w-full overflow-hidden rounded-[1.58rem]"
                      style={{ background: sliderStyles.imagePanelBackground }}
                    >
                      <img
                        src={activeItem.primaryImageUrl ?? landing.settings.hero.heroImageUrl}
                        alt={activeItem.name}
                        className="h-full w-full object-cover object-center"
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {featuredItems.length > 1 ? (
                <div className="absolute bottom-[-1rem] right-[-1rem] z-10 flex items-center gap-3 sm:bottom-[-0.5rem] sm:right-[-0.75rem] lg:bottom-[-1rem] lg:right-[-1.5rem]">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-11 rounded-full border shadow-sm"
                    style={{
                      background: sliderStyles.navBackground,
                      color: sliderStyles.navTextColor,
                      borderColor: sliderStyles.innerFrameBorderColor,
                    }}
                    onClick={goPrevious}
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <div className="flex items-center gap-1.5">
                    {featuredItems.map((item, index) => (
                      <span
                        key={item.id}
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: index === selectedIndex ? "1.5rem" : "0.375rem",
                          background:
                            index === selectedIndex
                              ? sliderStyles.activeIndicatorColor
                              : sliderStyles.inactiveIndicatorColor,
                        }}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-11 rounded-full border shadow-sm"
                    style={{
                      background: sliderStyles.navBackground,
                      color: sliderStyles.navTextColor,
                      borderColor: sliderStyles.innerFrameBorderColor,
                    }}
                    onClick={goNext}
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
