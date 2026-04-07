import { ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"
import { useHorizontalRailControls } from "./use-horizontal-rail-controls"

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
  const { scrollRef, showLeftChevron, showRightChevron, scrollLeft, scrollRight } =
    useHorizontalRailControls(cards.length)

  if (cards.length === 0) {
    return null
  }

  return (
    <section className={cn("min-w-0 max-w-full space-y-5 overflow-hidden", className)}>
      <div className="space-y-2">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1c1c1c]">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-7 text-[#6b7280]">{description}</p>
        ) : null}
      </div>

      <div className="group relative min-w-0 max-w-full overflow-hidden">
        <div
          ref={scrollRef}
          className="w-full max-w-full overflow-x-auto overflow-y-hidden pb-2 [scrollbar-color:#c9b7a5_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#ccb9a6] [&::-webkit-scrollbar-track]:bg-transparent"
        >
          <div className="flex min-w-max gap-5 pr-3">
            {cards.map((card) => (
              <Link
                key={card.id}
                to={card.href}
                className="group/card w-[16rem] shrink-0"
              >
                <article className="space-y-3">
                  <div className="relative overflow-hidden rounded-[1.1rem] bg-[#f3eee7] shadow-[0_28px_54px_-42px_rgba(32,23,17,0.4)] transition-transform duration-300 group-hover/card:-translate-y-1">
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      className="h-[22.5rem] w-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                      sizes="(min-width: 1024px) 256px, 70vw"
                    />
                    <div className="absolute left-3 top-3 rounded-[0.75rem] bg-white/92 px-4 py-3 shadow-[0_14px_24px_-20px_rgba(34,22,13,0.38)] backdrop-blur-sm">
                      <p className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[#2f2a26]">
                        {card.brandName}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-0.5 px-0.5">
                    <h3 className="line-clamp-1 text-[1.1rem] font-semibold tracking-tight text-[#0f172a]">
                      {card.title}
                    </h3>
                    <p className="line-clamp-2 text-[0.95rem] leading-6 text-[#64748b]">
                      {card.summary}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>

        {showLeftChevron ? (
          <button
            type="button"
            aria-label="Scroll brands left"
            className="absolute left-0 top-[11rem] z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-[#dfc9b3] bg-[#fcf8f3]/92 p-2 text-[#705440] shadow-[0_14px_28px_-18px_rgba(43,26,12,0.38)] opacity-0 transition-all duration-300 hover:border-[#8b5e34] hover:bg-[#8b5e34] hover:text-white group-hover:opacity-100"
            onClick={scrollLeft}
          >
            <ChevronLeft className="size-4" />
          </button>
        ) : null}

        {showRightChevron ? (
          <button
            type="button"
            aria-label="Scroll brands right"
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
