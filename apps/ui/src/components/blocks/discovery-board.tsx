import { Link } from "react-router-dom"

import { storefrontHomeSectionFrameClassName } from "@ecommerce/web/src/features/storefront-home/blocks/storefront-home-section-frame"
import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
import { cn } from "@/lib/utils"

type DiscoveryBoardCard = {
  id: string
  title: string
  href: string | null
  imageTitles?: Array<string | null>
  imageLinks?: Array<string | null>
  images: Array<string | null>
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

function DiscoveryBoardImageTile({
  card,
  imageUrl,
  imageTitle,
  index,
}: {
  card: DiscoveryBoardCard
  imageUrl: string | null
  imageTitle?: string | null
  index: number
}) {
  if (!hasContent(imageUrl)) {
    return (
      <div
        data-technical-name="block.storefront.home.discovery-board.image"
        className="aspect-square overflow-hidden rounded-[0.5rem] border border-dashed bg-[var(--storefront-card-muted-bg,#f5efe7)] [border-color:var(--storefront-card-border,#e7ddd1)]"
      />
    )
  }

  const tileHref = card.imageLinks?.[index] ?? card.href
  const tileTitle = card.imageTitles?.[index] ?? imageTitle ?? card.title
  const content = (
    <div
      data-technical-name="block.storefront.home.discovery-board.image"
      className="group/image aspect-square overflow-hidden rounded-[0.5rem] bg-[var(--storefront-card-muted-bg,#f5efe7)]"
    >
      <img
        src={imageUrl}
        alt={hasContent(tileTitle) ? tileTitle ?? `${card.title} image ${index + 1}` : `${card.title} image ${index + 1}`}
        className="h-full w-full object-cover transition-transform duration-300 group-hover/image:scale-[1.04]"
        loading="lazy"
        decoding="async"
        sizes="(min-width: 1280px) 17vw, (min-width: 768px) 22vw, 42vw"
      />
    </div>
  )

  if (hasContent(tileHref)) {
    return (
      <Link
        to={tileHref ?? "/shop/catalog"}
        aria-label={hasContent(tileTitle) ? tileTitle ?? `${card.title} image ${index + 1}` : `${card.title} image ${index + 1}`}
        data-technical-name="block.storefront.home.discovery-board.image-link"
        className="block"
      >
        {content}
      </Link>
    )
  }

  return content
}

function DiscoveryBoardCardView({ card }: { card: DiscoveryBoardCard }) {
  return (
    <article
      data-technical-name="block.storefront.home.discovery-board.card"
      className="overflow-hidden rounded-[0.9rem] border bg-[var(--storefront-card-bg,#ffffff)] p-2 [border-color:var(--storefront-card-border,#e7ddd1)] [box-shadow:var(--storefront-card-shadow,0_20px_40px_-32px_rgba(38,29,24,0.28))]"
    >
      <div
        data-technical-name="block.storefront.home.discovery-board.card-grid"
        className="grid grid-cols-2 gap-1.5"
      >
        {card.images.slice(0, 4).map((imageUrl, index) => (
          <DiscoveryBoardImageTile
            key={`${card.id}:${index}`}
            card={card}
            imageUrl={imageUrl}
            imageTitle={card.imageTitles?.[index]}
            index={index}
          />
        ))}
      </div>
    </article>
  )
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
    <section
      data-technical-name="block.storefront.home.discovery-board"
      className={cn("relative space-y-4", className)}
    >
      <TechnicalNameBadge
        alwaysVisible
        name="block.storefront.home.discovery-board"
        className="absolute right-3 top-0 z-20 max-w-[calc(100%-1.5rem)]"
      />
      <div
        data-technical-name="block.storefront.home.discovery-board.header"
        className={cn(storefrontHomeSectionFrameClassName, "space-y-2")}
      >
        <h2 className="font-heading text-[2rem] font-semibold tracking-tight text-[#1f1813]">
          {config.title}
        </h2>
        {hasContent(config.summary) ? (
          <p className="max-w-3xl text-sm leading-7 text-[#726355]">{config.summary}</p>
        ) : null}
      </div>
      <div
        data-technical-name="block.storefront.home.discovery-board.grid"
        className={cn(storefrontHomeSectionFrameClassName, "grid min-w-0 max-w-full gap-4 md:grid-cols-2 xl:grid-cols-4")}
      >
        {config.cards.slice(0, 4).map((card) => (
          <DiscoveryBoardCardView key={card.id} card={card} />
        ))}
      </div>
    </section>
  )
}
