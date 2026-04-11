import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"

import { resolveStorefrontImageUrl } from "../lib/storefront-image"

function hasImageCandidate(imageUrl: string | null | undefined) {
  return typeof imageUrl === "string" && imageUrl.trim().length > 0
}

export function StorefrontHeroMedia({
  imageUrl,
  fallbackLabel,
  alt,
  width,
  height,
  className,
}: {
  imageUrl: string | null | undefined
  fallbackLabel: string
  alt: string
  width: number
  height: number
  className?: string
}) {
  const hasImage = hasImageCandidate(imageUrl)
  const [hasImageLoadFailed, setHasImageLoadFailed] = useState(false)
  const resolvedImageUrl = useMemo(
    () => (hasImage ? resolveStorefrontImageUrl(imageUrl) : null),
    [hasImage, imageUrl]
  )

  useEffect(() => {
    setHasImageLoadFailed(false)
  }, [resolvedImageUrl])

  if (hasImage && resolvedImageUrl && !hasImageLoadFailed) {
    return (
      <img
        src={resolvedImageUrl}
        alt={alt}
        width={width}
        height={height}
        className={cn("block h-full w-full object-cover object-center", className)}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        onError={() => {
          setHasImageLoadFailed(true)
        }}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-[inherit] bg-[linear-gradient(180deg,#ebe4da_0%,#ddd2c5_100%)] p-5 text-center",
        className
      )}
    >
      <div className="flex h-full w-full items-center justify-center rounded-[calc(theme(borderRadius.[1.3rem])-0.35rem)] border border-white/70 bg-white/45 px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <span className="line-clamp-3 text-balance text-[clamp(0.95rem,3.6vw,1.25rem)] font-semibold leading-tight text-[#3b2b22]">
          {fallbackLabel}
        </span>
      </div>
    </div>
  )
}
