import { ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

import { storefrontHomeSectionFrameClassName } from "@ecommerce/web/src/features/storefront-home/blocks/storefront-home-section-frame"
import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
import { cn } from "@/lib/utils"
import { useHorizontalRailControls } from "./use-horizontal-rail-controls"

type TrendingCard = {
  id: string
  title: string
  caption: string
  href: string | null
  imageUrl: string
  backgroundColor: string
  titleColor: string
  captionBackgroundColor: string
  captionTextColor: string
}

type TrendingSectionProps = {
  className?: string
  config: {
    enabled?: boolean
    title: string
    description: string
    featureTitle: string
    featureSummary: string
    featureImageUrl: string
    featureHref: string | null
    featureBackgroundColor: string
    featureTextColor: string
    cards: TrendingCard[]
  }
}

function hasContent(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function TrendCard({
  card,
  className,
  tiltDirection = "right",
}: {
  card: TrendingCard
  className?: string
  tiltDirection?: "left" | "right"
}) {
  const content = (
    <article
      data-technical-name="block.storefront.home.trending.card"
      className={cn(
        "group relative h-[23rem] max-w-full overflow-hidden rounded-[1.2rem] shadow-[0_26px_50px_-38px_rgba(30,23,19,0.45)] transition-transform duration-500 ease-out will-change-transform hover:-translate-y-2",
        tiltDirection === "left"
          ? "hover:rotate-[-2deg] hover:[transform:perspective(1400px)_rotateX(3deg)_rotateY(-7deg)_translateY(-0.35rem)]"
          : "hover:rotate-[2deg] hover:[transform:perspective(1400px)_rotateX(3deg)_rotateY(7deg)_translateY(-0.35rem)]",
        className
      )}
      style={{ backgroundColor: card.backgroundColor }}
    >
      <div className="flex h-full flex-col justify-between">
        <div
          data-technical-name="block.storefront.home.trending.card-media"
          className="relative min-h-[17rem] overflow-hidden px-4 pt-4"
        >
          <img
            src={card.imageUrl}
            alt={card.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 256px, 70vw"
          />
        </div>
        <div
          data-technical-name="block.storefront.home.trending.card-caption"
          className="px-4 py-3 text-center text-[1.05rem] font-medium"
          style={{
            backgroundColor: card.captionBackgroundColor,
            color: card.captionTextColor,
          }}
        >
          {card.caption}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-4 top-5">
        <h3
          className="max-w-[11rem] text-center font-heading text-[1.55rem] font-semibold leading-[0.94] tracking-tight"
          style={{ color: card.titleColor }}
        >
          {card.title}
        </h3>
      </div>
    </article>
  )

  if (hasContent(card.href)) {
    return (
      <Link to={card.href ?? "/shop/catalog"} className="block h-[23rem]">
        {content}
      </Link>
    )
  }

  return content
}

export function TrendingSection({ className, config }: TrendingSectionProps) {
  const { scrollRef, showLeftChevron, showRightChevron, scrollLeft, scrollRight } =
    useHorizontalRailControls(config.cards.length + 1)
  const hasHorizontalOverflow = showLeftChevron || showRightChevron

  if (
    config.enabled === false ||
    !Array.isArray(config.cards) ||
    config.cards.length === 0 ||
    !hasContent(config.title) ||
    !hasContent(config.description) ||
    !hasContent(config.featureTitle) ||
    !hasContent(config.featureSummary)
  ) {
    return null
  }

  const featureContent = (
    <article
      data-technical-name="block.storefront.home.trending.feature-card"
      className="relative h-[23rem] w-[16rem] min-w-[16rem] max-w-[16rem] shrink-0 overflow-hidden rounded-[1.2rem] shadow-[0_26px_50px_-38px_rgba(30,23,19,0.5)] transition-transform duration-500 ease-out will-change-transform hover:[transform:perspective(1600px)_rotateX(3deg)_rotateY(-6deg)_translateY(-0.4rem)]"
      style={{ backgroundColor: config.featureBackgroundColor }}
    >
      <img
        src={config.featureImageUrl}
        alt={config.featureTitle}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        sizes="(min-width: 1024px) 256px, 70vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.24)_100%)]" />
      <div className="relative flex h-full flex-col justify-end p-5">
        <div className="max-w-[11rem] space-y-1">
          <h2 className="font-heading text-[2.05rem] font-semibold leading-[0.92]" style={{ color: config.featureTextColor }}>
            {config.featureTitle}
          </h2>
          <p className="text-[0.92rem] leading-6" style={{ color: config.featureTextColor }}>
            {config.featureSummary}
          </p>
        </div>
      </div>
    </article>
  )

  return (
    <section
      data-technical-name="block.storefront.home.trending"
      className={cn("relative min-w-0 max-w-full space-y-4 overflow-x-clip overflow-y-visible", className)}
    >
      <TechnicalNameBadge
        alwaysVisible
        name="block.storefront.home.trending"
        className="absolute right-3 top-0 z-20 max-w-[calc(100%-1.5rem)]"
      />
      <div
        data-technical-name="block.storefront.home.trending.header"
        className={cn(storefrontHomeSectionFrameClassName, "space-y-2")}
      >
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1c1c1c]">
          {config.title}
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-[#6b7280]">
          {config.description}
        </p>
      </div>
      <div
        data-technical-name="block.storefront.home.trending.rail-shell"
        className={cn(storefrontHomeSectionFrameClassName, "group relative overflow-x-clip overflow-y-visible")}
      >
        <div
          data-technical-name="block.storefront.home.trending.rail"
          ref={scrollRef}
          className="w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="inline-flex w-max min-w-0 max-w-none gap-3 pr-3">
            {hasContent(config.featureHref) ? (
              <Link
                to={config.featureHref ?? "/shop/catalog"}
                data-technical-name="block.storefront.home.trending.feature-link"
                className="block h-[23rem] shrink-0"
              >
                {featureContent}
              </Link>
            ) : (
              featureContent
            )}
            {config.cards.map((card, index) => (
              <TrendCard
                key={card.id}
                card={card}
                className="h-[23rem] w-[16rem] min-w-[16rem] max-w-[16rem] shrink-0"
                tiltDirection={index % 2 === 0 ? "right" : "left"}
              />
            ))}
          </div>
        </div>

        {hasHorizontalOverflow ? (
          <>
            <button
              type="button"
              aria-label="Scroll trending cards left"
              disabled={!showLeftChevron}
              className={cn(
                "absolute left-0 top-[11rem] z-10 flex -translate-y-1/2 items-center justify-center rounded-full border p-2 shadow-[0_14px_28px_-18px_rgba(43,26,12,0.38)] transition-all duration-300",
                showLeftChevron
                  ? "border-[#dfc9b3] bg-[#fcf8f3]/92 text-[#705440] opacity-100 hover:border-[#8b5e34] hover:bg-[#8b5e34] hover:text-white"
                  : "cursor-default border-[#eadbca] bg-white/72 text-[#c4ae96] opacity-100"
              )}
              onClick={scrollLeft}
            >
              <ChevronLeft className="size-4" />
            </button>

            <button
              type="button"
              aria-label="Scroll trending cards right"
              disabled={!showRightChevron}
              className={cn(
                "absolute right-0 top-[11rem] z-10 flex -translate-y-1/2 items-center justify-center rounded-full border p-2 shadow-[0_14px_28px_-18px_rgba(43,26,12,0.38)] transition-all duration-300",
                showRightChevron
                  ? "border-[#dfc9b3] bg-[#fcf8f3]/92 text-[#705440] opacity-100 hover:border-[#8b5e34] hover:bg-[#8b5e34] hover:text-white"
                  : "cursor-default border-[#eadbca] bg-white/72 text-[#c4ae96] opacity-100"
              )}
              onClick={scrollRight}
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        ) : null}
      </div>
    </section>
  )
}
