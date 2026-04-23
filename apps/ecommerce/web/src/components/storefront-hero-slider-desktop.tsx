import { AnimatePresence, motion } from "motion/react"
import { ChevronLeft, ChevronRight, ShoppingBag, Star } from "lucide-react"
import { Link } from "react-router-dom"

import type { StorefrontLandingResponse } from "@ecommerce/shared"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { storefrontPaths } from "../lib/storefront-routes"
import { StorefrontHeroMedia } from "./storefront-hero-media"
import {
  formatStorefrontHeroCurrency,
  smoothContentTransition,
  smoothImageTransition,
  staggeredContentItem,
  staggeredContentTransition,
  useStorefrontHeroSliderModel,
} from "./storefront-hero-slider-shared"

export function StorefrontHeroSliderDesktop({ landing }: { landing: StorefrontLandingResponse }) {
  const model = useStorefrontHeroSliderModel(landing)

  if (!model.activeItem || !model.sliderStyles) {
    return null
  }

  return (
    <section
      className="relative isolate hidden w-full max-w-full min-w-0 overflow-hidden rounded-[2.2rem] border border-[#e1d3c4] shadow-[0_35px_95px_-46px_rgba(52,26,15,0.42)] lg:block lg:h-[calc(100svh-12.5rem)] lg:min-h-[26rem] lg:max-h-[33rem] xl:h-[calc(100svh-13.5rem)] xl:min-h-[29rem] xl:max-h-[40.5rem]"
      style={{ background: model.sliderStyles.background, color: model.sliderStyles.textColor }}
      data-technical-name="section.storefront.home.hero"
      data-shell-mode="desktop"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.14),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_32%)]" />
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,0.08)" }} />
      <div className="pointer-events-none absolute -right-20 bottom-6 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,0.12)" }} />
      <div className="relative mx-auto flex h-full w-full max-w-none min-w-0 px-5 py-5 lg:px-6 xl:px-12 xl:py-7 2xl:px-16">
        <div className="grid h-full w-full grid-cols-[minmax(0,0.98fr)_minmax(430px,0.94fr)] items-center gap-5 xl:grid-cols-[minmax(0,0.94fr)_minmax(610px,1.08fr)] xl:gap-9 2xl:grid-cols-[minmax(0,0.96fr)_minmax(610px,1.1fr)]">
          <div className="flex h-full flex-col">
            <Badge className="mt-1 w-fit self-start rounded-full border px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] backdrop-blur-sm" style={{ background: model.sliderStyles.badgeBackground, color: model.sliderStyles.badgeTextColor, borderColor: model.sliderStyles.innerFrameBorderColor }}>
              {model.activeBadge}
            </Badge>
            <AnimatePresence mode="wait" initial={false} custom={model.direction}>
              <motion.div key={`${model.activeItem.id}:content`} custom={model.direction} initial={{ opacity: 0, x: model.direction > 0 ? 24 : -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: model.direction > 0 ? -16 : 16 }} transition={smoothContentTransition} className="my-auto space-y-5 lg:-translate-y-2 xl:-translate-y-5 xl:space-y-[1.45rem]">
                <motion.div initial="initial" animate="animate" exit="exit" transition={staggeredContentTransition}>
                  <motion.div variants={staggeredContentItem} className="space-y-3 xl:space-y-4">
                    <h1 className="line-clamp-3 max-w-[24rem] font-heading text-[2.25rem] font-semibold tracking-tight lg:text-[2.5rem] lg:leading-[0.98] xl:max-w-2xl xl:text-[3rem] xl:leading-[0.96] 2xl:text-[3.25rem]">
                      {model.activeTitle}
                    </h1>
                  </motion.div>
                  <motion.p variants={staggeredContentItem} className="line-clamp-3 max-w-[25rem] overflow-hidden pt-1 text-[0.88rem] leading-6 xl:max-w-3xl xl:pt-2 xl:text-[0.93rem] xl:leading-[1.58rem]" style={{ color: model.sliderStyles.mutedTextColor }}>
                    {model.activeSummary}
                  </motion.p>
                  <motion.div variants={staggeredContentItem} className="flex flex-wrap items-center gap-4 py-2 xl:gap-5 xl:py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: model.sliderStyles.mutedTextColor }}>Special Price</span>
                      <span className="text-[1.5rem] font-semibold xl:text-[1.9rem]">{formatStorefrontHeroCurrency(model.activeItem.sellingPrice)}</span>
                    </div>
                    <div className="hidden h-10 w-px xl:block" style={{ background: `${model.sliderStyles.mutedTextColor}33` }} />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: model.sliderStyles.mutedTextColor }}>Rating & Reviews</span>
                      <div className="flex items-center gap-2 text-amber-300">
                        <Star className="size-4 fill-current xl:size-5" />
                        <span className="text-lg font-semibold xl:text-xl">{model.activeItem.isBestSeller ? "4.8" : model.activeItem.isFeaturedLabel ? "4.6" : "4.5"}</span>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div variants={staggeredContentItem} className="flex flex-wrap items-center gap-3 pt-2">
                    <Button type="button" aria-label={`Buy now: ${model.activeItem.name}`} className="h-10 rounded-full px-4 text-[0.88rem] font-semibold xl:h-[2.375rem] xl:px-5 xl:text-[0.92rem]" style={{ background: model.sliderStyles.primaryButtonBackground, color: model.sliderStyles.primaryButtonTextColor }} onClick={model.addToCart}>
                      <ShoppingBag className="size-4" />
                      {model.activePrimaryCtaLabel}
                    </Button>
                    <Link to={storefrontPaths.product(model.activeItem.slug)} aria-label={`View details for ${model.activeItem.name}`} className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-xl px-4 text-[0.88rem] font-medium backdrop-blur-sm xl:h-[2.375rem] xl:px-5 xl:text-[0.92rem]")} style={{ background: model.sliderStyles.secondaryButtonBackground, color: model.sliderStyles.secondaryButtonTextColor, borderColor: model.sliderStyles.innerFrameBorderColor }}>
                      {model.sliderStyles.secondaryButtonLabel}
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="relative flex h-full items-center justify-center">
            <div className="relative flex h-full w-full items-center justify-center">
              <AnimatePresence mode="wait" initial={false} custom={model.direction}>
                <motion.div key={`${model.activeItem.id}:image`} custom={model.direction} initial={{ opacity: 0, x: model.direction > 0 ? 24 : -24, scale: 0.992 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: model.direction > 0 ? -18 : 18, scale: 0.992 }} transition={{ ...smoothImageTransition, delay: 0.06 }} className="relative z-[1] h-[420px] w-[430px] max-w-full rounded-[1.7rem] p-2.5 backdrop-blur-[24px] xl:h-[560px] xl:w-[610px] xl:rounded-[2rem] xl:p-3" style={{ background: model.sliderStyles.frameBackground, boxShadow: "0 28px 72px -42px rgba(24,12,7,0.34), 0 12px 38px -20px rgba(255,255,255,0.18)" }}>
                  <div className="flex h-full overflow-hidden rounded-[1.7rem]" style={{ background: model.sliderStyles.imagePanelBackground }}>
                    <div className="h-full w-full overflow-hidden rounded-[1.58rem]" style={{ background: model.sliderStyles.imagePanelBackground }}>
                      <StorefrontHeroMedia
                        imageUrl={model.activeItem.primaryImageUrl ?? landing.settings.hero.heroImageUrl}
                        fallbackLabel={model.activeItem.name}
                        alt={model.activeItem.name}
                        width={1240}
                        height={1500}
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              {model.featuredItems.length > 1 ? (
                <div className="absolute bottom-[-0.8rem] right-0 z-10 flex items-center gap-2.5 xl:bottom-[-1.1rem] xl:right-4 xl:gap-3">
                  <Button type="button" size="icon" variant="outline" aria-label="Previous featured product" className="size-9 rounded-full border shadow-sm xl:size-10" style={{ background: model.sliderStyles.navBackground, color: model.sliderStyles.navTextColor, borderColor: model.sliderStyles.innerFrameBorderColor }} onClick={model.goPrevious}>
                    <ChevronLeft className="size-5" />
                  </Button>
                  <div className="flex items-center gap-1.5">
                    {model.featuredItems.map((item, index) => (
                      <span key={item.id} aria-hidden="true" className="h-1.5 rounded-full transition-all duration-300" style={{ width: index === model.selectedIndex ? "1.5rem" : "0.375rem", background: index === model.selectedIndex ? model.sliderStyles.activeIndicatorColor : model.sliderStyles.inactiveIndicatorColor }} />
                    ))}
                  </div>
                  <Button type="button" size="icon" variant="outline" aria-label="Next featured product" className="size-9 rounded-full border shadow-sm xl:size-10" style={{ background: model.sliderStyles.navBackground, color: model.sliderStyles.navTextColor, borderColor: model.sliderStyles.innerFrameBorderColor }} onClick={model.goNext}>
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
