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
import { storefrontPaths } from "../lib/storefront-routes"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function StorefrontHeroSlider({
  landing,
}: {
  landing: StorefrontLandingResponse
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const cart = useStorefrontCart()
  const featuredItems = landing.featured.length > 0 ? landing.featured : landing.newArrivals
  const activeItem = featuredItems[selectedIndex] ?? featuredItems[0] ?? null
  const activeBadge = activeItem?.badge ?? activeItem?.categoryName ?? landing.settings.hero.eyebrow

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
    <section className="relative overflow-hidden rounded-[2.6rem] border border-[#e1d3c4] bg-[linear-gradient(90deg,#3d2219_0%,#5a3a2b_34%,#856252_62%,#d6c1b0_84%,#efe3d6_100%)] text-white shadow-[0_35px_95px_-46px_rgba(52,26,15,0.42)] lg:h-[520px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.14),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_32%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:flex lg:h-full lg:px-12 lg:py-12">
        <div className="space-y-5 lg:hidden">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/78 bg-white/12 p-3 shadow-[0_28px_72px_-42px_rgba(24,12,7,0.48)] backdrop-blur-[2px]">
            <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-3">
              <Badge className="w-fit rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/92 backdrop-blur-sm">
                {activeBadge}
              </Badge>
              {featuredItems.length > 1 ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-9 rounded-full border-white/0 bg-white text-[#241913] shadow-sm hover:bg-white/92"
                    onClick={goPrevious}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-9 rounded-full border-white/0 bg-white text-[#241913] shadow-sm hover:bg-white/92"
                    onClick={goNext}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              ) : null}
            </div>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${activeItem.id}:mobile-image`}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 36 : -36, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: direction > 0 ? -28 : 28, scale: 0.985 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-[260px] w-full sm:h-[320px]"
              >
                <div className="flex h-full overflow-hidden rounded-[1.7rem] border border-white/48 bg-white p-px">
                  <div className="h-full w-full overflow-hidden rounded-[1.58rem]">
                    <img
                      src={activeItem.primaryImageUrl ?? landing.settings.hero.heroImageUrl}
                      alt={activeItem.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${activeItem.id}:mobile-content`}
              custom={direction}
              initial={{ opacity: 0, y: direction > 0 ? 24 : -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction > 0 ? -18 : 18 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4 px-1 pb-1"
            >
              <div className="space-y-3">
                <h1 className="line-clamp-2 font-heading text-[1.9rem] font-semibold tracking-tight leading-[1.02] text-white sm:text-[2.2rem]">
                  {activeItem.name}
                </h1>
                <p className="line-clamp-2 text-sm leading-6 text-white/88 sm:text-base sm:leading-7">
                  {activeItem.shortDescription ?? landing.settings.hero.summary}
                </p>
              </div>

              <div className="flex items-center gap-5 py-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/72">
                    Special Price
                  </span>
                  <span className="text-2xl font-semibold text-white sm:text-[1.9rem]">
                    {formatCurrency(activeItem.sellingPrice)}
                  </span>
                </div>
                <div className="h-9 w-px bg-white/16" />
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/72">
                    Rating & Reviews
                  </span>
                  <div className="flex items-center gap-2 text-amber-300">
                    <Star className="size-4 fill-current" />
                    <span className="text-lg font-semibold text-white">
                      {activeItem.isBestSeller ? "4.8" : activeItem.isFeaturedLabel ? "4.6" : "4.5"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  className="h-10 rounded-full bg-white px-5 text-sm font-semibold text-[#241913] hover:bg-white/92 sm:flex-1"
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
                  Buy now
                </Button>
                <Link
                  to={storefrontPaths.product(activeItem.slug)}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 rounded-xl border-white/18 bg-white/16 px-5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/22 hover:text-white sm:flex-1"
                  )}
                >
                  View details
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden h-full w-full items-center gap-10 lg:grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex h-full flex-col">
            <Badge className="mt-1 w-fit self-start rounded-full border border-white/20 bg-white/12 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/92 backdrop-blur-sm">
              {activeBadge}
            </Badge>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${activeItem.id}:content`}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 36 : -36 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -24 : 24 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="my-auto -translate-y-4 space-y-6"
              >
                <div className="space-y-5">
                  <h1 className="line-clamp-2 max-w-xl font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.6rem] lg:leading-[0.98]">
                    {activeItem.name}
                  </h1>
                  <p className="line-clamp-2 max-w-2xl overflow-hidden text-base leading-8 text-white/88 sm:text-lg">
                    {activeItem.shortDescription ?? landing.settings.hero.summary}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-7 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/72">
                      Special Price
                    </span>
                    <span className="text-3xl font-semibold text-white sm:text-4xl">
                      {formatCurrency(activeItem.sellingPrice)}
                    </span>
                  </div>
                  <div className="h-10 w-px bg-white/16" />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/72">
                      Rating & Reviews
                    </span>
                    <div className="flex items-center gap-2 text-amber-300">
                      <Star className="size-4 fill-current sm:size-5" />
                      <span className="text-xl font-semibold text-white">
                        {activeItem.isBestSeller ? "4.8" : activeItem.isFeaturedLabel ? "4.6" : "4.5"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    type="button"
                    className="h-11 rounded-full bg-white px-6 text-base font-semibold text-[#241913] hover:bg-white/92"
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
                    Buy now
                  </Button>
                  <Link
                    to={storefrontPaths.product(activeItem.slug)}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-11 rounded-xl border-white/18 bg-white/16 px-6 text-base font-medium text-white backdrop-blur-sm hover:bg-white/22 hover:text-white"
                    )}
                  >
                    View details
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative flex h-full items-center justify-center sm:-my-4 lg:-my-7">
            <div className="relative flex h-full w-full items-center justify-center">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`${activeItem.id}:image`}
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 48 : -48, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: direction > 0 ? -34 : 34, scale: 0.985 }}
                  transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
                  className="relative h-[360px] w-full max-w-[360px] rounded-[2rem] border border-white/78 bg-white/12 p-3 shadow-[0_28px_72px_-42px_rgba(24,12,7,0.48)] backdrop-blur-[2px] sm:h-[420px] sm:max-w-[440px] lg:h-[480px] lg:w-[520px] lg:max-w-[520px]"
                >
                  <div className="flex h-full overflow-hidden rounded-[1.7rem] border border-white/48 bg-white p-px">
                    <div className="h-full w-full overflow-hidden rounded-[1.58rem]">
                      <img
                        src={activeItem.primaryImageUrl ?? landing.settings.hero.heroImageUrl}
                        alt={activeItem.name}
                        className="h-full w-full object-cover"
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
                    className="size-11 rounded-full border-white/0 bg-white text-[#241913] shadow-sm hover:bg-white/92"
                    onClick={goPrevious}
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <div className="flex items-center gap-1.5">
                    {featuredItems.map((item, index) => (
                      <span
                        key={item.id}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          index === selectedIndex ? "w-6 bg-[#241913]" : "w-1.5 bg-white/70"
                        )}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-11 rounded-full border-white/0 bg-white text-[#241913] shadow-sm hover:bg-white/92"
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
