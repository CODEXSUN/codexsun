import { Link } from "react-router-dom"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"
import { resolveStorefrontImageUrl } from "../../../lib/storefront-image"
import { StorefrontHomeSectionHeader } from "../blocks/storefront-home-section-header"

function hasContent(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

export function StorefrontHomeTrendingSectionMobile({
  landing,
}: {
  landing: StorefrontLandingResponse
}) {
  const config = landing.settings.trendingSection

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

  return (
    <section
      className="relative min-w-0 max-w-full space-y-4 overflow-hidden"
      data-technical-name="section.storefront.home.trending"
      data-shell-mode="mobile"
    >
      <StorefrontTechnicalNameBadge
        name="section.storefront.home.trending"
        className="right-0 top-0"
      />
      <StorefrontHomeSectionHeader
        eyebrow={null}
        title={config.title}
        summary={config.description}
        technicalName="block.storefront.home.trending.header"
        compact
      />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-5 bg-gradient-to-r from-white/38 via-white/16 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-5 bg-gradient-to-l from-white/38 via-white/16 to-transparent" />
        <div
          className="w-full max-w-full overflow-x-auto overflow-y-hidden pb-2 pl-1 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
          aria-label="Trending products rail"
        >
          <div className="flex w-max min-w-0 snap-x snap-mandatory gap-3 pr-4 touch-pan-x">
            {hasContent(config.featureHref) ? (
              <Link to={config.featureHref ?? "/shop/catalog"} className="block snap-start">
                <TrendingFeatureCard config={config} />
              </Link>
            ) : (
              <div className="snap-start">
                <TrendingFeatureCard config={config} />
              </div>
            )}
            {config.cards.map((card) => (
              <TrendingCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TrendingFeatureCard({
  config,
}: {
  config: StorefrontLandingResponse["settings"]["trendingSection"]
}) {
  return (
    <article
      className="relative h-[19rem] w-[min(82vw,18rem)] shrink-0 overflow-hidden rounded-[1.35rem] shadow-[0_24px_48px_-34px_rgba(30,23,19,0.5)]"
      style={{ backgroundColor: config.featureBackgroundColor }}
    >
      <img
        src={resolveStorefrontImageUrl(config.featureImageUrl)}
        alt={config.featureTitle}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.34)_100%)]" />
      <div className="relative flex h-full flex-col justify-end p-4">
        <div className="max-w-[11rem] space-y-1.5">
          <h3
            className="font-heading text-[1.75rem] font-semibold leading-[0.94]"
            style={{ color: config.featureTextColor }}
          >
            {config.featureTitle}
          </h3>
          <p
            className="line-clamp-3 text-[0.84rem] leading-5"
            style={{ color: config.featureTextColor }}
          >
            {config.featureSummary}
          </p>
        </div>
      </div>
    </article>
  )
}

function TrendingCard({
  card,
}: {
  card: StorefrontLandingResponse["settings"]["trendingSection"]["cards"][number]
}) {
  const content = (
    <article
      className="relative h-[19rem] w-[min(74vw,16rem)] shrink-0 overflow-hidden rounded-[1.25rem] shadow-[0_22px_44px_-34px_rgba(30,23,19,0.46)]"
      style={{ backgroundColor: card.backgroundColor }}
    >
      <div className="pointer-events-none absolute inset-x-4 top-4 z-[1]">
        <h3
          className="max-w-[10rem] font-heading text-[1.4rem] font-semibold leading-[0.95] tracking-tight"
          style={{ color: card.titleColor }}
        >
          {card.title}
        </h3>
      </div>
      <div className="flex h-full flex-col justify-between">
        <div className="relative min-h-0 flex-1 overflow-hidden px-4 pt-4">
          <img
            src={resolveStorefrontImageUrl(card.imageUrl)}
            alt={card.title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div
          className="px-4 py-3 text-center text-[0.95rem] font-medium"
          style={{
            backgroundColor: card.captionBackgroundColor,
            color: card.captionTextColor,
          }}
        >
          {card.caption}
        </div>
      </div>
    </article>
  )

  if (hasContent(card.href)) {
    return (
      <Link to={card.href ?? "/shop/catalog"} className="block snap-start">
        {content}
      </Link>
    )
  }

  return <div className="snap-start">{content}</div>
}
