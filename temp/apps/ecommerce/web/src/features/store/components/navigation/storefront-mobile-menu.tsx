import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { MenuIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

type MobileMenuLink = {
  title: string
  url: string
  icon?: LucideIcon
}

type MobileMenuCategory = {
  label: string
  slug: string
}

export function StorefrontMobileMenu({
  title = "Browse Store",
  description = "Open storefront shortcuts and category links.",
  links,
  categories = [],
  wishlistCount = 0,
  cartCount = 0,
  side = "left",
  trigger,
}: {
  title?: string
  description?: string
  links: MobileMenuLink[]
  categories?: MobileMenuCategory[]
  wishlistCount?: number
  cartCount?: number
  side?: "left" | "right"
  trigger?: ReactNode
}) {
  const quickLinks = [
    { title: "Wishlist", url: "/wishlist", count: wishlistCount },
    { title: "Cart", url: "/cart", count: cartCount },
  ]

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="icon" className="rounded-full border-border/70 bg-background lg:hidden" aria-label={title}>
            <MenuIcon className="size-5" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side={side} className="w-[320px]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <nav className="mt-6 grid gap-3">
          {quickLinks.map((link) => (
            <SheetClose asChild key={link.url}>
              <Link
                to={link.url}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
              >
                <span>{link.title}</span>
                {link.count > 0 ? <Badge className="min-w-5 justify-center rounded-full px-1 text-[10px]">{link.count}</Badge> : null}
              </Link>
            </SheetClose>
          ))}
          {links.map((link) => (
            <SheetClose asChild key={link.url}>
              <Link
                to={link.url}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
              >
                {link.icon ? <link.icon className="size-4 text-muted-foreground" /> : null}
                <span>{link.title}</span>
              </Link>
            </SheetClose>
          ))}
        </nav>
        {categories.length > 0 ? (
          <div className="mt-8">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Popular Categories</div>
            <div className="grid gap-2">
              {categories.map((category) => (
                <SheetClose asChild key={category.slug}>
                  <Link
                    to={`/category/${category.slug}`}
                    className="rounded-2xl bg-muted/40 px-4 py-3 text-sm text-foreground transition hover:bg-accent"
                  >
                    {category.label}
                  </Link>
                </SheetClose>
              ))}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
