import { Link } from "react-router-dom"

import { storefrontHomeSectionFrameClassName } from "@ecommerce/web/src/features/storefront-home/blocks/storefront-home-section-frame"
import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
import { cn } from "@/lib/utils"
import { Marquee } from "@/components/ui/marquee"

type BrandStoryCard = {
  id: string
  brandName: string
  title: string
  summary: string
  imageUrl: string
  href: string
}

export function BrandStoryRail({
  cards,
  className,
  title = "More Beauty To Love",
  description,
}: {
  cards: BrandStoryCard[]
  className?: string
  title?: string
  description?: string
}) {
  const visibleCards = cards.filter((card) => card.imageUrl.trim().length > 0)

  if (visibleCards.length === 0) {
    return null
  }

  const marqueeCards = visibleCards.map((card) => (
    <Link
      key={card.id}
      to={card.href}
      data-technical-name="block.storefront.home.brand-story.card-link"
      className="block w-[11.5rem] min-w-[11.5rem] shrink-0 md:w-[13rem] md:min-w-[13rem]"
      aria-label={card.brandName}
    >
      <article
        data-technical-name="block.storefront.home.brand-story.card"
        className="flex h-[5.5rem] items-center justify-center rounded-[0.75rem] border bg-[var(--storefront-card-bg,#fffaf4)] px-4 py-3.5 [border-color:var(--storefront-card-border,#e4d8ca)] [box-shadow:var(--storefront-card-shadow,0_18px_34px_-28px_rgba(42,31,24,0.24))] transition-transform duration-300 hover:-translate-y-0.5 hover:[box-shadow:var(--storefront-card-shadow-hover,0_18px_34px_-28px_rgba(42,31,24,0.24))]"
      >
        <img
          src={card.imageUrl}
          alt={card.brandName}
          className="h-full max-h-[4.75rem] w-full object-contain"
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1024px) 208px, 184px"
        />
      </article>
    </Link>
  ))

  return (
    <section
      data-technical-name="block.storefront.home.brand-story"
      className={cn("relative min-w-0 max-w-full space-y-5 overflow-x-clip overflow-y-visible", className)}
    >
      <TechnicalNameBadge
        alwaysVisible
        name="block.storefront.home.brand-story"
        className="absolute right-3 top-0 z-20 max-w-[calc(100%-1.5rem)]"
      />
      <div
        data-technical-name="block.storefront.home.brand-story.header"
        className={cn(storefrontHomeSectionFrameClassName, "space-y-2")}
      >
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1c1c1c]">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-7 text-[#6b7280]">{description}</p>
        ) : null}
      </div>
      <div
        data-technical-name="block.storefront.home.brand-story.marquee-shell"
        className={cn(storefrontHomeSectionFrameClassName, "overflow-x-clip overflow-y-visible rounded-[1rem] border bg-[var(--storefront-section-bg,#f7f1ea)] px-3 py-3 [border-color:var(--storefront-card-border,#eadfd3)] [box-shadow:var(--storefront-card-shadow,0_22px_44px_-36px_rgba(42,31,24,0.28))] sm:px-4")}
      >
        <Marquee pauseOnHover repeat={2} className="[--duration:34s] [--gap:1rem] md:[--duration:42s]">
          {marqueeCards}
        </Marquee>
      </div>
    </section>
  )
}
