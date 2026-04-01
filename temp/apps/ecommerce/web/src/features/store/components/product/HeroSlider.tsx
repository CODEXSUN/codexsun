import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon, ShoppingBagIcon, StarIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { Button, buttonVariants } from "@/components/ui/button"
import { useStorefront } from "@/features/store/context/storefront-context"
import { formatCurrency, getPrimaryProductImage } from "@/features/store/lib/storefront-utils"
import { getFallbackSliderThemes, pickSliderTheme, resolveSliderThemeStyles, toSliderThemeRecord } from "@/features/store/lib/slider-theme"
import { listCommonModuleItems } from "@/shared/api/client"
import { cn } from "@/lib/utils"

export function HeroSlider() {
  const { products, addToCart } = useStorefront()
  const featuredProducts = products
    .filter((product) => product.homeSlider)
    .sort((left, right) => left.homeSliderOrder - right.homeSliderOrder || right.rating - left.rating)
    .slice(0, 3)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [themes, setThemes] = useState(getFallbackSliderThemes)

  useEffect(() => {
    if (featuredProducts.length <= 1) return
    const timer = window.setInterval(() => {
      setDirection(1)
      setSelectedIndex((current) => (current + 1) % featuredProducts.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [featuredProducts.length])

  useEffect(() => {
    let cancelled = false

    async function loadThemes() {
      try {
        const items = await listCommonModuleItems("sliderThemes", false)
        if (!cancelled) {
          const nextThemes = items
            .map(toSliderThemeRecord)
            .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
          if (nextThemes.length > 0) {
            setThemes(nextThemes)
          }
        }
      } catch {
        if (!cancelled) {
          setThemes(getFallbackSliderThemes())
        }
      }
    }

    void loadThemes()
    return () => {
      cancelled = true
    }
  }, [])

  if (featuredProducts.length === 0) return null

  const activeProduct = featuredProducts[selectedIndex] ?? featuredProducts[0]
  const activeTheme = pickSliderTheme(themes, selectedIndex)
  const themeStyles = resolveSliderThemeStyles(activeTheme)
  const primaryActionLabel = "Buy now"

  return (
    <section
      className="relative -mx-4 overflow-hidden rounded-none border border-[#e3d5c7] shadow-[0_35px_90px_-52px_rgba(49,20,9,0.32)] transition-colors duration-700 ease-in-out sm:mx-0 sm:rounded-[2.5rem]"
      style={{ background: themeStyles.background, color: themeStyles.textColor }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[linear-gradient(270deg,rgba(255,255,255,0.1),transparent)]" />

      <div className="absolute inset-x-2 top-2 z-20 flex items-center justify-between gap-2 md:hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.06 }}
          className="inline-flex h-8 w-fit items-center rounded-full border px-2 text-[10px] font-semibold uppercase tracking-[0.2em] backdrop-blur-sm"
          style={{
            background: themeStyles.badgeBackground,
            color: themeStyles.badgeTextColor,
            borderColor: themeStyles.isDark ? "rgba(255,255,255,0.18)" : "rgba(17,17,17,0.08)",
          }}
        >
          {activeProduct.catalogBadge ?? activeProduct.categoryName}
        </motion.div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setDirection(-1)
              setSelectedIndex(
                (current) => (current - 1 + featuredProducts.length) % featuredProducts.length,
              )
            }}
            className="size-8 rounded-full border backdrop-blur-md"
            style={{
              background: themeStyles.navBackground,
              color: themeStyles.navTextColor,
              borderColor: themeStyles.isDark ? "rgba(255,255,255,0.16)" : "rgba(17,17,17,0.08)",
            }}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <div className="flex items-center gap-1 px-0.5">
            {featuredProducts.map((product, index) => (
              <div
                key={product.id}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === selectedIndex ? "w-5" : "w-1.5",
                )}
                style={{ background: index === selectedIndex ? themeStyles.navTextColor : (themeStyles.isDark ? "rgba(255,255,255,0.28)" : "rgba(17,17,17,0.24)") }}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setDirection(1)
              setSelectedIndex((current) => (current + 1) % featuredProducts.length)
            }}
            className="size-8 rounded-full border backdrop-blur-md"
            style={{
              background: themeStyles.navBackground,
              color: themeStyles.navTextColor,
              borderColor: themeStyles.isDark ? "rgba(255,255,255,0.16)" : "rgba(17,17,17,0.08)",
            }}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="flex flex-col-reverse items-center justify-between gap-4 px-4 py-4 sm:px-10 sm:pt-8 sm:pb-12 md:flex-row md:gap-10 md:pb-14 lg:pb-16">
          <div className="flex w-full flex-1 md:w-1/2">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${activeProduct.id}-content`}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -28 : 28 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="flex w-full flex-col justify-center space-y-3 pt-12 md:pt-0"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.34, delay: 0.06 }}
                  className="hidden w-fit rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] backdrop-blur-sm md:inline-flex"
                  style={{
                    background: themeStyles.badgeBackground,
                    color: themeStyles.badgeTextColor,
                    borderColor: themeStyles.isDark ? "rgba(255,255,255,0.18)" : "rgba(17,17,17,0.08)",
                  }}
                >
                  {activeProduct.catalogBadge ?? activeProduct.categoryName}
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="line-clamp-2 text-3xl font-bold leading-tight tracking-tight sm:line-clamp-3 sm:text-4xl lg:text-5xl lg:leading-[1.05]"
                >
                  {activeProduct.name}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.14 }}
                  className="line-clamp-3 max-w-xl text-sm leading-relaxed sm:line-clamp-5 sm:text-base"
                  style={{ color: themeStyles.mutedTextColor }}
                >
                  {activeProduct.description ?? activeProduct.shortDescription ?? "Featured storefront highlight."}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.18 }}
                  className="flex flex-wrap items-center gap-5 pt-1"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium" style={{ color: themeStyles.mutedTextColor }}>Special Price</span>
                    <span className="text-2xl font-bold sm:text-3xl">
                      {formatCurrency(activeProduct.price)}
                    </span>
                  </div>
                  <div className="h-8 w-px" style={{ background: themeStyles.isDark ? "rgba(255,255,255,0.14)" : "rgba(17,17,17,0.1)" }} />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium" style={{ color: themeStyles.mutedTextColor }}>Rating & Reviews</span>
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <StarIcon className="size-4 fill-current sm:size-5" />
                      <span className="text-base font-bold sm:text-lg">
                        {activeProduct.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.22 }}
                  className="flex flex-wrap items-center gap-3 pt-2"
                >
                  <Button
                    className="h-10 rounded-full px-6 text-sm font-semibold sm:h-11 sm:px-8 sm:text-base"
                    style={{
                      background: themeStyles.primaryButtonBackground,
                      color: themeStyles.primaryButtonTextColor,
                    }}
                    onClick={() => addToCart(activeProduct.id, 1)}
                  >
                    <ShoppingBagIcon className="mr-2 size-4 sm:size-5" />
                    {primaryActionLabel}
                  </Button>
                  <Link
                    to={`/product/${activeProduct.slug}`}
                    className={buttonVariants({
                      variant: "outline",
                      className:
                        "hidden h-10 rounded-full px-6 text-sm font-medium sm:inline-flex sm:h-11 sm:px-8 sm:text-base",
                    })}
                    style={{
                      background: themeStyles.secondaryButtonBackground,
                      color: themeStyles.secondaryButtonTextColor,
                      borderColor: themeStyles.isDark ? "rgba(255,255,255,0.18)" : "rgba(17,17,17,0.12)",
                    }}
                  >
                    {themeStyles.viewDetailsLabel}
                  </Link>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative flex w-full flex-1 items-center justify-center md:w-1/2">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${activeProduct.id}-image`}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 56 : -56, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: direction > 0 ? -40 : 40, scale: 0.985 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative aspect-[5/4] w-full max-w-[calc(100vw-1rem)] translate-y-11 overflow-hidden rounded-[1.7rem] border border-white/55 bg-white/16 p-1.5 shadow-[0_24px_60px_-34px_rgba(38,27,19,0.22)] backdrop-blur-md sm:aspect-[4/3] sm:max-w-[320px] sm:p-4 lg:aspect-square lg:max-w-[420px]"
              >
                <div className="flex h-full w-full items-start justify-center overflow-hidden rounded-[1.35rem] border border-white/35 bg-white/10 pt-5 sm:pt-0">
                  <img
                    src={getPrimaryProductImage(activeProduct)}
                    alt={activeProduct.name}
                    className="h-full w-full scale-[1.08] object-contain object-top sm:scale-100 sm:object-contain"
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-3 md:flex md:right-12 md:bottom-4 md:top-auto md:translate-y-0 lg:bottom-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setDirection(-1)
              setSelectedIndex(
                (current) => (current - 1 + featuredProducts.length) % featuredProducts.length,
              )
            }}
            className="size-10 rounded-full border backdrop-blur-md"
            style={{
              background: themeStyles.navBackground,
              color: themeStyles.navTextColor,
              borderColor: themeStyles.isDark ? "rgba(255,255,255,0.16)" : "rgba(17,17,17,0.08)",
            }}
          >
            <ChevronLeftIcon className="size-5" />
          </Button>
          <div className="flex items-center gap-1.5 px-2">
            {featuredProducts.map((product, index) => (
              <div
                key={product.id}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === selectedIndex ? "w-6" : "w-1.5",
                )}
                style={{ background: index === selectedIndex ? themeStyles.navTextColor : (themeStyles.isDark ? "rgba(255,255,255,0.28)" : "rgba(17,17,17,0.24)") }}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setDirection(1)
              setSelectedIndex((current) => (current + 1) % featuredProducts.length)
            }}
            className="size-10 rounded-full border backdrop-blur-md"
            style={{
              background: themeStyles.navBackground,
              color: themeStyles.navTextColor,
              borderColor: themeStyles.isDark ? "rgba(255,255,255,0.16)" : "rgba(17,17,17,0.08)",
            }}
          >
            <ChevronRightIcon className="size-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
