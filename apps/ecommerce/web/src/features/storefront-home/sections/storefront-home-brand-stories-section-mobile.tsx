import { Link } from "react-router-dom"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"
import { resolveStorefrontImageUrl } from "../../../lib/storefront-image"
import { StorefrontHomeSectionHeader } from "../blocks/storefront-home-section-header"

export function StorefrontHomeBrandStoriesSectionMobile({
  landing,
}: {
  landing: StorefrontLandingResponse
}) {
  const section = landing.settings.brandShowcase
  const cards = section.cards ?? landing.brands

  if (section.enabled === false || cards.length === 0) {
    return null
  }

  return (
    <section
      className="relative min-w-0 max-w-full space-y-4 overflow-hidden"
      data-technical-name="section.storefront.home.brand-stories"
      data-shell-mode="mobile"
    >
      <StorefrontTechnicalNameBadge
        name="section.storefront.home.brand-stories"
        className="right-0 top-0"
      />
      <StorefrontHomeSectionHeader
        eyebrow={null}
        title={section.title ?? "More Beauty To Love"}
        summary={section.description}
        technicalName="block.storefront.home.brand-stories.header"
        compact
      />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-5 bg-gradient-to-r from-white/34 via-white/12 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-5 bg-gradient-to-l from-white/34 via-white/12 to-transparent" />
        <div
          className="w-full max-w-full overflow-x-auto overflow-y-hidden pb-2 pl-1 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
          aria-label="Brand stories rail"
        >
          <div className="flex w-max min-w-0 snap-x snap-mandatory gap-3 pr-4 touch-pan-x">
            {cards.map((card) => (
              <Link
                key={card.id}
                to={card.href}
                className="block snap-start"
              >
                <article className="w-[min(76vw,17rem)] shrink-0 space-y-3">
                  <div className="relative overflow-hidden rounded-[1.1rem] bg-[#f3eee7] shadow-[0_24px_46px_-34px_rgba(32,23,17,0.38)]">
                    <img
                      src={resolveStorefrontImageUrl(card.imageUrl)}
                      alt={card.title}
                      className="h-[18rem] w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute left-3 top-3 rounded-[0.75rem] bg-white/88 px-3 py-2 shadow-[0_14px_24px_-20px_rgba(34,22,13,0.38)] backdrop-blur-sm">
                      <p className="text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[#2f2a26]">
                        {card.brandName}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 px-0.5">
                    <h3 className="line-clamp-1 text-[1.05rem] font-semibold tracking-tight text-[#0f172a]">
                      {card.title}
                    </h3>
                    <p className="line-clamp-2 text-[0.9rem] leading-6 text-[#64748b]">
                      {card.summary}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
