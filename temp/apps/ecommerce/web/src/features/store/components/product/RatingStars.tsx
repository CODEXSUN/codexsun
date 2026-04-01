import { StarIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function RatingStars({
  rating,
  reviewCount,
  size = "sm",
}: {
  rating: number
  reviewCount?: number
  size?: "sm" | "md"
}) {
  const rounded = Math.round(rating || 0)

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <StarIcon
            key={index}
            className={cn(
              size === "sm" ? "size-3.5" : "size-4",
              index < rounded ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
            )}
          />
        ))}
      </div>
      {reviewCount !== undefined ? (
        <span className="text-xs text-muted-foreground">{reviewCount} reviews</span>
      ) : null}
    </div>
  )
}
