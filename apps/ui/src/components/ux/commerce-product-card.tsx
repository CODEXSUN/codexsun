import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CommercePrice } from "@/components/ux/commerce-price"

type CommerceProductCardProps = {
  href: string
  name: string
  imageUrl: string | null
  badge?: string | null
  brandName?: string | null
  categoryName?: string | null
  shortDescription?: string | null
  amount: number
  compareAtAmount?: number | null
  onAddToCart?: () => void
}

export function CommerceProductCard({
  href,
  name,
  imageUrl,
  badge,
  brandName,
  categoryName,
  shortDescription,
  amount,
  compareAtAmount,
  onAddToCart,
}: CommerceProductCardProps) {
  return (
    <Card className="group overflow-hidden rounded-[1.6rem] border-border/70 bg-card/90 py-0 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-border hover:shadow-lg">
      <div className="relative aspect-[4/5] overflow-hidden border-b border-border/60 bg-[linear-gradient(180deg,#f5ede4_0%,#efe3d8_100%)]">
        {badge ? (
          <Badge className="absolute left-4 top-4 z-10 rounded-full border-none bg-black/75 px-3 py-1 text-white">
            {badge}
          </Badge>
        ) : null}
        <img
          src={imageUrl ?? "https://placehold.co/900x1200/e8ddd1/2d211b?text=Catalog"}
          alt={name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>
      <CardContent className="grid gap-4 p-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {brandName ? <span>{brandName}</span> : null}
            {categoryName ? <span>{categoryName}</span> : null}
          </div>
          <div className="space-y-1">
            <Link
              to={href}
              className="block font-heading text-xl font-semibold tracking-tight text-foreground transition hover:text-primary"
            >
              {name}
            </Link>
            {shortDescription ? (
              <p className="text-sm leading-6 text-muted-foreground">
                {shortDescription}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <CommercePrice amount={amount} compareAtAmount={compareAtAmount} />
          <div className="flex items-center gap-2">
            {onAddToCart ? (
              <Button variant="outline" onClick={onAddToCart}>
                Add to cart
              </Button>
            ) : null}
            <Button asChild>
              <Link to={href} className="gap-2">
                View
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
