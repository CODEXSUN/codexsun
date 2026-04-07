import { ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

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
      className={cn(
        "group relative overflow-hidden rounded-[1.2rem] shadow-[0_26px_50px_-38px_rgba(30,23,19,0.45)] transition-transform duration-500 ease-out will-change-transform hover:-translate-y-2",
        tiltDirection === "left"
          ? "hover:rotate-[-2deg] hover:[transform:perspective(1400px)_rotateX(3deg)_rotateY(-7deg)_translateY(-0.35rem)]"
          : "hover:rotate-[2deg] hover:[transform:perspective(1400px)_rotateX(3deg)_rotateY(7deg)_translateY(-0.35rem)]",
        className
      )}
      style={{ backgroundColor: card.backgroundColor }}
    >
      <div className="flex h-full min-h-[23rem] flex-col justify-between">
        <div className="relative min-h-[17rem] overflow-hidden px-4 pt-4">
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
      <Link to={card.href ?? "/shop/catalog"} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export function TrendingSection({ className, config }: TrendingSectionProps) {
  const { scrollRef, showLeftChevron, showRightChevron, scrollLeft, scrollRight } =
    useHorizontalRailControls(config.cards.length + 1)

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
      className="relative w-[16rem] shrink-0 overflow-hidden rounded-[1.2rem] shadow-[0_26px_50px_-38px_rgba(30,23,19,0.5)] transition-transform duration-500 ease-out will-change-transform hover:[transform:perspective(1600px)_rotateX(3deg)_rotateY(-6deg)_translateY(-0.4rem)]"
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
      <div className="relative flex min-h-[23rem] flex-col justify-end p-5">
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
    <section className={cn("min-w-0 max-w-full space-y-4 overflow-hidden", className)}>
      <div className="space-y-2">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1c1c1c]">
          {config.title}
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-[#6b7280]">
          {config.description}
        </p>
      </div>
      <div className="group relative min-w-0 max-w-full overflow-hidden">
        <div
          ref={scrollRef}
          className="w-full max-w-full overflow-x-auto overflow-y-hidden pb-2 [scrollbar-color:#c9b7a5_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#ccb9a6] [&::-webkit-scrollbar-track]:bg-transparent"
        >
          <div className="flex min-w-max gap-3 pr-3">
            {hasContent(config.featureHref) ? (
              <Link to={config.featureHref ?? "/shop/catalog"} className="block shrink-0">
                {featureContent}
              </Link>
            ) : (
              featureContent
            )}
            {config.cards.map((card, index) => (
              <TrendCard
                key={card.id}
                card={card}
                className="w-[16rem] shrink-0"
                tiltDirection={index % 2 === 0 ? "right" : "left"}
              />
            ))}
          </div>
        </div>

        {showLeftChevron ? (
          <button
            type="button"
            aria-label="Scroll trending cards left"
            className="absolute left-0 top-[11rem] z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-[#dfc9b3] bg-[#fcf8f3]/92 p-2 text-[#705440] shadow-[0_14px_28px_-18px_rgba(43,26,12,0.38)] opacity-0 transition-all duration-300 hover:border-[#8b5e34] hover:bg-[#8b5e34] hover:text-white group-hover:opacity-100"
            onClick={scrollLeft}
          >
            <ChevronLeft className="size-4" />
          </button>
        ) : null}

        {showRightChevron ? (
          <button
            type="button"
            aria-label="Scroll trending cards right"
            className="absolute right-0 top-[11rem] z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-[#dfc9b3] bg-[#fcf8f3]/92 p-2 text-[#705440] shadow-[0_14px_28px_-18px_rgba(43,26,12,0.38)] opacity-0 transition-all duration-300 hover:border-[#8b5e34] hover:bg-[#8b5e34] hover:text-white group-hover:opacity-100"
            onClick={scrollRight}
          >
            <ChevronRight className="size-4" />
          </button>
        ) : null}
      </div>
    </section>
  )
}
