import { Link } from "react-router-dom"

import { storefrontHomeSectionFrameClassName } from "@ecommerce/web/src/features/storefront-home/blocks/storefront-home-section-frame"
import { cn } from "@/lib/utils"

type DiscoveryBoardCard = {
  id: string
  title: string
  href: string | null
  images: string[]
}

type DiscoveryBoardProps = {
  className?: string
  config: {
    enabled?: boolean
    title: string
    summary?: string | null
    cards: DiscoveryBoardCard[]
  }
}

function hasContent(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function DiscoveryBoardCardView({ card }: { card: DiscoveryBoardCard }) {
  const content = (
    <article className="overflow-hidden rounded-[0.9rem] border border-[#e7ddd1] bg-white p-3 shadow-[0_20px_40px_-32px_rgba(38,29,24,0.28)] transition-transform duration-300 hover:-translate-y-1">
      <div className="grid grid-cols-2 gap-2">
        {card.images.slice(0, 4).map((imageUrl, index) => (
          <div key={`${card.id}:${index}`} className="aspect-square overflow-hidden rounded-[0.5rem] bg-[#f5efe7]">
            <img
              src={imageUrl}
              alt={card.title}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              sizes="(min-width: 1280px) 17vw, (min-width: 768px) 22vw, 42vw"
            />
          </div>
        ))}
      </div>
    </article>
  )

  if (hasContent(card.href)) {
    return (
      <Link to={card.href ?? "/shop/catalog"} aria-label={card.title} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export function DiscoveryBoard({ className, config }: DiscoveryBoardProps) {
  if (
    config.enabled === false ||
    !hasContent(config.title) ||
    !Array.isArray(config.cards) ||
    config.cards.length === 0
  ) {
    return null
  }

  return (
    <section className={cn("space-y-4", className)}>
      <div className={cn(storefrontHomeSectionFrameClassName, "space-y-2")}>
        <h2 className="font-heading text-[2rem] font-semibold tracking-tight text-[#1f1813]">
          {config.title}
        </h2>
        {hasContent(config.summary) ? (
          <p className="max-w-3xl text-sm leading-7 text-[#726355]">{config.summary}</p>
        ) : null}
      </div>
      <div className={cn(storefrontHomeSectionFrameClassName, "grid gap-4 md:grid-cols-2 xl:grid-cols-4")}>
        {config.cards.slice(0, 4).map((card) => (
          <DiscoveryBoardCardView key={card.id} card={card} />
        ))}
      </div>
    </section>
  )
}
