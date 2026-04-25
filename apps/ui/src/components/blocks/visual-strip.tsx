import { ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

import { storefrontHomeSectionFrameClassName } from "@ecommerce/web/src/features/storefront-home/blocks/storefront-home-section-frame"
import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
import { cn } from "@/lib/utils"
import { useHorizontalRailControls } from "./use-horizontal-rail-controls"

type VisualStripCard = {
  id: string
  label: string
  href: string | null
  imageUrl: string
}

type VisualStripProps = {
  className?: string
  config: {
    enabled?: boolean
    title: string
    ctaLabel?: string | null
    ctaHref?: string | null
    cards: VisualStripCard[]
  }
}

function hasContent(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function VisualStripCardView({ card }: { card: VisualStripCard }) {
  const content = (
    <article
      data-technical-name="block.storefront.home.visual-strip.card"
      className="overflow-hidden rounded-[0.35rem] border bg-[var(--storefront-card-bg,#ffffff)] [border-color:var(--storefront-card-border,#e1d8ce)] [box-shadow:var(--storefront-card-shadow,0_18px_34px_-28px_rgba(42,31,24,0.24))]"
    >
      <img
        src={card.imageUrl}
        alt={card.label}
        className="h-[12.5rem] w-full object-cover"
        loading="lazy"
        decoding="async"
        sizes="(min-width: 1280px) 15vw, (min-width: 768px) 22vw, 42vw"
      />
    </article>
  )

  if (hasContent(card.href)) {
    return (
      <Link to={card.href ?? "/shop/catalog"} aria-label={card.label} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export function VisualStrip({ className, config }: VisualStripProps) {
  const { scrollRef, showLeftChevron, showRightChevron, scrollLeft, scrollRight } =
    useHorizontalRailControls(config.cards.length)

  if (
    config.enabled === false ||
    !hasContent(config.title) ||
    !Array.isArray(config.cards) ||
    config.cards.length === 0
  ) {
    return null
  }

  return (
    <section
      data-technical-name="block.storefront.home.visual-strip"
      className={cn("relative space-y-4", className)}
    >
      <TechnicalNameBadge
        alwaysVisible
        name="block.storefront.home.visual-strip"
        className="absolute right-3 top-0 z-20 max-w-[calc(100%-1.5rem)]"
      />
      <div
        data-technical-name="block.storefront.home.visual-strip.header"
        className={cn(storefrontHomeSectionFrameClassName, "flex flex-wrap items-baseline justify-between gap-3")}
      >
        <h2 className="font-heading text-[1.85rem] font-semibold tracking-tight text-[#1f1813]">
          {config.title}
        </h2>
        {hasContent(config.ctaLabel) && hasContent(config.ctaHref) ? (
          <Link to={config.ctaHref ?? "/shop/catalog"} className="text-sm font-medium text-[#8b5e34]">
            {config.ctaLabel}
          </Link>
        ) : null}
      </div>
      <div
        data-technical-name="block.storefront.home.visual-strip.rail-shell"
        className={cn(storefrontHomeSectionFrameClassName, "group relative overflow-x-clip overflow-y-visible")}
      >
        <div
          data-technical-name="block.storefront.home.visual-strip.rail"
          ref={scrollRef}
          className="w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="inline-flex w-max min-w-0 gap-3 pr-3">
            {config.cards.map((card) => (
              <div
                key={card.id}
                data-technical-name="block.storefront.home.visual-strip.card-slot"
                className="w-[10.5rem] min-w-[10.5rem] shrink-0 md:w-[11.5rem] md:min-w-[11.5rem]"
              >
                <VisualStripCardView card={card} />
              </div>
            ))}
          </div>
        </div>
        {showLeftChevron ? (
          <button
            type="button"
            aria-label="Scroll visual strip left"
            className="absolute left-0 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-[#dfc9b3] bg-[#fcf8f3]/92 p-2 text-[#705440] shadow-[0_14px_28px_-18px_rgba(43,26,12,0.38)] opacity-0 transition-all duration-300 hover:border-[#8b5e34] hover:bg-[#8b5e34] hover:text-white group-hover:opacity-100"
            onClick={scrollLeft}
          >
            <ChevronLeft className="size-4" />
          </button>
        ) : null}
        {showRightChevron ? (
          <button
            type="button"
            aria-label="Scroll visual strip right"
            className="absolute right-0 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-[#dfc9b3] bg-[#fcf8f3]/92 p-2 text-[#705440] shadow-[0_14px_28px_-18px_rgba(43,26,12,0.38)] opacity-0 transition-all duration-300 hover:border-[#8b5e34] hover:bg-[#8b5e34] hover:text-white group-hover:opacity-100"
            onClick={scrollRight}
          >
            <ChevronRight className="size-4" />
          </button>
        ) : null}
      </div>
    </section>
  )
}
