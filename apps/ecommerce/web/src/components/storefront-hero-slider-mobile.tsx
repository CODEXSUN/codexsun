import { AnimatePresence, motion } from "motion/react"
import { ChevronLeft, ChevronRight, ShoppingBag, Star } from "lucide-react"
import { Link } from "react-router-dom"

import type { StorefrontLandingResponse } from "@ecommerce/shared"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { storefrontPaths } from "../lib/storefront-routes"
import { StorefrontImage } from "./storefront-image"
import {
  formatStorefrontHeroCurrency,
  smoothContentTransition,
  smoothImageTransition,
  staggeredContentItem,
  staggeredContentTransition,
  useStorefrontHeroSliderModel,
} from "./storefront-hero-slider-shared"

export function StorefrontHeroSliderMobile({ landing }: { landing: StorefrontLandingResponse }) {
  const model = useStorefrontHeroSliderModel(landing)

  if (!model.activeItem || !model.sliderStyles) {
    return null
  }

  return (
    <section
      className="relative isolate w-full max-w-full min-w-0 overflow-hidden rounded-[2rem] border border-[#e1d3c4] shadow-[0_35px_95px_-46px_rgba(52,26,15,0.42)] sm:rounded-[2.3rem]"
      style={{ background: model.sliderStyles.background, color: model.sliderStyles.textColor }}
      data-technical-name="section.storefront.home.hero"
      data-shell-mode="mobile"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.14),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_32%)]" />
      <div className="relative mx-auto flex w-full max-w-none min-w-0 px-3 py-3 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-[1.7rem] shadow-[0_28px_72px_-42px_rgba(24,12,7,0.48)] sm:rounded-[2rem]">
            <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2 sm:inset-x-5 sm:items-center sm:gap-3">
              <Badge className="max-w-[calc(100%-5.25rem)] truncate rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] backdrop-blur-sm sm:max-w-none sm:px-3 sm:text-[10px] sm:tracking-[0.2em]" style={{ background: model.sliderStyles.badgeBackground, color: model.sliderStyles.badgeTextColor, borderColor: model.sliderStyles.innerFrameBorderColor }}>
                {model.activeBadge}
              </Badge>
              {model.featuredItems.length > 1 ? (
                <div className="flex shrink-0 items-center gap-1.5 sm:mr-1 sm:gap-2">
                  <Button type="button" size="icon" variant="outline" aria-label="Previous featured product" className="size-8 rounded-full border shadow-sm sm:size-9" style={{ background: model.sliderStyles.navBackground, color: model.sliderStyles.navTextColor, borderColor: model.sliderStyles.innerFrameBorderColor }} onClick={model.goPrevious}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button type="button" size="icon" variant="outline" aria-label="Next featured product" className="size-8 rounded-full border shadow-sm sm:size-9" style={{ background: model.sliderStyles.navBackground, color: model.sliderStyles.navTextColor, borderColor: model.sliderStyles.innerFrameBorderColor }} onClick={model.goNext}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="px-2 pt-11 pb-1 sm:px-0 sm:pt-10">
              <AnimatePresence mode="wait" initial={false} custom={model.direction}>
                <motion.div key={`${model.activeItem.id}:mobile-image`} initial={{ opacity: 0, scale: 0.992 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.992 }} transition={{ ...smoothImageTransition, delay: 0.05 }} className="relative mt-2 h-[clamp(248px,74vw,320px)] w-full max-w-full sm:mt-3 sm:h-[clamp(260px,62vw,340px)]">
                  <div className="flex h-full w-full overflow-hidden rounded-[1.78rem] p-2 backdrop-blur-[24px]" style={{ background: model.sliderStyles.frameBackground, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.34), 0 0 0 1px ${model.sliderStyles.outerFrameBorderColor}, 0 18px 40px -28px rgba(24,12,7,0.28), 0 10px 34px -18px rgba(255,255,255,0.16)` }}>
                    <div className="flex h-full w-full overflow-hidden rounded-[1.56rem] border p-2" style={{ background: model.sliderStyles.imagePanelBackground, borderColor: model.sliderStyles.innerFrameBorderColor }}>
                      <div className="h-full w-full overflow-hidden rounded-[1.3rem]" style={{ background: model.sliderStyles.imagePanelBackground }}>
                        <StorefrontImage imageUrl={model.activeItem.primaryImageUrl ?? landing.settings.hero.heroImageUrl} fallbackLabel={model.activeItem.name} alt={model.activeItem.name} width={960} height={1200} className="h-full w-full object-cover object-center" loading="eager" decoding="async" fetchPriority="high" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="relative h-[17rem] overflow-hidden px-1 pb-0 sm:h-[18.5rem]">
            <AnimatePresence mode="wait" initial={false} custom={model.direction}>
              <motion.div key={`${model.activeItem.id}:mobile-content`} initial={{ opacity: 0, scale: 0.996 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.996 }} transition={smoothContentTransition} className="absolute inset-0 flex flex-col justify-start space-y-4 pt-4">
                <motion.div initial="initial" animate="animate" exit="exit" transition={staggeredContentTransition}>
                  <motion.div variants={staggeredContentItem} className="h-[3.5rem] space-y-3 overflow-hidden sm:h-[4.5rem]">
                    <h1 className="line-clamp-2 font-heading text-[1.65rem] font-semibold leading-[1.02] tracking-tight sm:text-[2.2rem]">{model.activeTitle}</h1>
                  </motion.div>
                  <motion.p variants={staggeredContentItem} className="line-clamp-2 h-[3rem] overflow-hidden pt-2 text-[13px] leading-5 sm:h-[3.75rem] sm:pt-3 sm:text-base sm:leading-7" style={{ color: model.sliderStyles.mutedTextColor }}>
                    {model.activeSummary}
                  </motion.p>
                  <motion.div variants={staggeredContentItem} className="grid h-[4.9rem] grid-cols-2 items-stretch gap-3 overflow-hidden py-3 sm:flex sm:h-[5rem] sm:flex-wrap sm:items-center sm:gap-5 sm:py-5">
                    <div className="flex flex-col items-center justify-center gap-1 px-2 text-center sm:items-start sm:justify-start sm:px-0 sm:text-left">
                      <span className="text-[10px] font-medium uppercase tracking-[0.16em]" style={{ color: model.sliderStyles.mutedTextColor }}>Special Price</span>
                      <span className="text-[1.75rem] font-semibold leading-none sm:text-[1.9rem]">{formatStorefrontHeroCurrency(model.activeItem.sellingPrice)}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 px-2 text-center sm:items-start sm:justify-start sm:px-0 sm:text-left">
                      <span className="text-[10px] font-medium uppercase tracking-[0.16em]" style={{ color: model.sliderStyles.mutedTextColor }}>Rating & Reviews</span>
                      <div className="flex items-center justify-center gap-2 text-amber-300 sm:justify-start">
                        <Star className="size-[1.05rem] fill-current" />
                        <span className="text-[1.2rem] font-semibold leading-none">{model.activeItem.isBestSeller ? "4.8" : model.activeItem.isFeaturedLabel ? "4.6" : "4.5"}</span>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div variants={staggeredContentItem} className="mt-4 grid h-10 grid-cols-2 gap-2.5 overflow-hidden sm:mt-0 sm:flex sm:h-[2.5rem] sm:flex-row sm:gap-3">
                    <Button type="button" aria-label={`Buy now: ${model.activeItem.name}`} className="h-10 min-w-0 rounded-full px-4 text-sm font-semibold sm:flex-1 sm:px-5" style={{ background: model.sliderStyles.primaryButtonBackground, color: model.sliderStyles.primaryButtonTextColor }} onClick={model.addToCart}>
                      <ShoppingBag className="size-4" />
                      {model.activePrimaryCtaLabel}
                    </Button>
                    <Link to={storefrontPaths.product(model.activeItem.slug)} aria-label={`View details for ${model.activeItem.name}`} className={cn(buttonVariants({ variant: "outline" }), "h-10 min-w-0 rounded-xl px-4 text-sm font-medium leading-none backdrop-blur-sm sm:flex-1 sm:px-5")} style={{ background: model.sliderStyles.secondaryButtonBackground, color: model.sliderStyles.secondaryButtonTextColor, borderColor: model.sliderStyles.innerFrameBorderColor }}>
                      <span className="-translate-y-px leading-none">{model.sliderStyles.secondaryButtonLabel}</span>
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
