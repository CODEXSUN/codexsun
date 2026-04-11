import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export type CategoryCardDesign = {
  titleColor: string
  metaColor: string
  descriptionColor: string
  buttonLabel: string
  buttonBackgroundColor: string
  buttonTextColor: string
  showProductCount: boolean
  showDescription: boolean
  showAction: boolean
}

export type CategoryCardSurfaceItem = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  productCount: number
  href: string
}

export function CategoryCardSurface({
  item,
  design,
}: {
  item: CategoryCardSurfaceItem
  design?: CategoryCardDesign
}) {
  const categoryNavigationState = { focus: "top" as const }

  return (
    <Card className="min-w-0 overflow-hidden rounded-[1.8rem] border-[#e3d5c6] py-0 shadow-[0_22px_50px_-40px_rgba(48,31,19,0.24)]">
      <CardContent className="space-y-4 p-0">
        <div className="aspect-[16/10] bg-[linear-gradient(135deg,#f1e6da,#fbf7f1)]">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col items-start gap-4 p-5 pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            {design?.showProductCount !== false ? (
              <p
                className="line-clamp-1 break-words text-sm font-medium uppercase tracking-[0.16em]"
                style={{ color: design?.metaColor ?? "#8a6b55" }}
              >
                {item.productCount} products
              </p>
            ) : null}
            <p className="break-words font-medium" style={{ color: design?.titleColor ?? "#241913" }}>
              {item.name}
            </p>
            {design?.showDescription !== false && item.description ? (
              <p
                className="line-clamp-2 break-words text-sm"
                style={{ color: design?.descriptionColor ?? "#6a5241" }}
              >
                {item.description}
              </p>
            ) : null}
          </div>
          {design?.showAction !== false ? (
            <Button
              asChild
              variant="outline"
              className="w-full shrink-0 rounded-full border-[#e3d5c6] sm:w-auto"
              style={{
                backgroundColor: design?.buttonBackgroundColor ?? "#ffffff",
                color: design?.buttonTextColor ?? "#241913",
              }}
            >
              <Link to={item.href} state={categoryNavigationState}>
                {design?.buttonLabel ?? "Explore"}
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
