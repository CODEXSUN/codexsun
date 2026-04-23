import { Link } from "react-router-dom"

import { storefrontHomeSectionFrameClassName } from "@ecommerce/web/src/features/storefront-home/blocks/storefront-home-section-frame"
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
  if (cards.length === 0) {
    return null
  }

  const marqueeCards = cards.map((card) => (
    <Link
      key={card.id}
      to={card.href}
      className="block w-[10.5rem] min-w-[10.5rem] shrink-0 md:w-[12rem] md:min-w-[12rem]"
      aria-label={card.brandName}
    >
      <article className="flex h-[4.75rem] items-center justify-center rounded-[0.75rem] border border-[#e7ddd1] bg-white px-5 py-4 shadow-[0_18px_34px_-28px_rgba(42,31,24,0.24)] transition-transform duration-300 hover:-translate-y-0.5">
        <img
          src={card.imageUrl}
          alt={card.brandName}
          className="h-full w-full object-contain"
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1024px) 192px, 168px"
        />
      </article>
    </Link>
  ))

  return (
    <section className={cn("min-w-0 max-w-full space-y-5 overflow-x-hidden overflow-y-visible", className)}>
      <div className={cn(storefrontHomeSectionFrameClassName, "space-y-2")}>
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1c1c1c]">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-7 text-[#6b7280]">{description}</p>
        ) : null}
      </div>
      <div className={cn(storefrontHomeSectionFrameClassName, "overflow-hidden rounded-[1rem] bg-[#efe9fb] px-3 py-2.5 sm:px-4")}>
        <Marquee pauseOnHover repeat={2} className="[--duration:34s] [--gap:1rem] md:[--duration:42s]">
          {marqueeCards}
        </Marquee>
      </div>
    </section>
  )
}
