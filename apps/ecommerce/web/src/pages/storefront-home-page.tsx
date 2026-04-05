import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontAnnouncementBar } from "../components/storefront-announcement-bar"
import { StorefrontHeroSlider } from "../components/storefront-hero-slider"
import { StorefrontLayout } from "../components/storefront-layout"
import { StorefrontProductCard } from "../components/storefront-product-card"
import { useStorefrontShellData } from "../hooks/use-storefront-shell-data"
import {
  normalizeStorefrontHref,
  storefrontPaths,
} from "../lib/storefront-routes"

export function StorefrontHomePage() {
  const { data, error, isLoading } = useStorefrontShellData()
  const cart = useStorefrontCart()

  return (
    <StorefrontLayout>
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 pt-8 lg:px-8 lg:pt-10">
        {error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}
        {data ? <StorefrontHeroSlider landing={data} /> : null}
        <StorefrontAnnouncementBar
          landing={data}
          cartSubtotalAmount={cart.subtotalAmount}
        />
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {data?.settings.sections.featured.eyebrow ?? "Featured"}
              </p>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                {data?.settings.sections.featured.title ?? "Spotlight picks"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                {data?.settings.sections.featured.summary}
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link
                to={
                  normalizeStorefrontHref(data?.settings.sections.featured.ctaHref) ??
                  storefrontPaths.catalog()
                }
                className="gap-2"
              >
                {data?.settings.sections.featured.ctaLabel ?? "View catalog"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {(data?.featured ?? []).map((item) => (
              <StorefrontProductCard
                key={item.id}
                item={item}
                href={storefrontPaths.product(item.slug)}
                onAddToCart={() =>
                  cart.addItem({
                    productId: item.id,
                    slug: item.slug,
                    name: item.name,
                    imageUrl: item.primaryImageUrl,
                    unitPrice: item.sellingPrice,
                    mrp: item.mrp,
                  })
                }
              />
            ))}
          </div>
        </section>
        <section className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {data?.settings.sections.categories.eyebrow ?? "Categories"}
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
              {data?.settings.sections.categories.title ?? "Browse by category"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
              {data?.settings.sections.categories.summary}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(data?.categories ?? [])
              .filter((category) => category.productCount > 0 && category.slug !== "all-items")
              .map((category) => (
              <Card
                key={category.id}
                className="overflow-hidden rounded-[1.8rem] border-[#e3d5c6] py-0 shadow-[0_22px_50px_-40px_rgba(48,31,19,0.24)]"
              >
                <CardContent className="space-y-4 p-0">
                  <div className="aspect-[16/10] bg-[linear-gradient(135deg,#f1e6da,#fbf7f1)]">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-4 p-5 pt-0">
                    <div className="space-y-2">
                      <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#8a6b55]">
                        {category.productCount} products
                      </p>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.description ??
                          `${category.productCount} products in this category.`}
                      </p>
                    </div>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link
                        to={
                          normalizeStorefrontHref(category.href) ??
                          storefrontPaths.catalog()
                        }
                      >
                        Explore
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {data?.settings.sections.newArrivals.eyebrow ?? "New arrivals"}
              </p>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                {data?.settings.sections.newArrivals.title ?? "Fresh into the catalog"}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                {data?.settings.sections.newArrivals.summary}
              </p>
            </div>
            <div className="grid gap-5">
              {(data?.newArrivals ?? []).slice(0, 2).map((item) => (
                <StorefrontProductCard
                  key={item.id}
                  item={item}
                  href={storefrontPaths.product(item.slug)}
                  onAddToCart={() =>
                    cart.addItem({
                      productId: item.id,
                      slug: item.slug,
                      name: item.name,
                      imageUrl: item.primaryImageUrl,
                      unitPrice: item.sellingPrice,
                      mrp: item.mrp,
                    })
                  }
                />
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {data?.settings.sections.bestSellers.eyebrow ?? "Best sellers"}
              </p>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                {data?.settings.sections.bestSellers.title ?? "Fast movers right now"}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                {data?.settings.sections.bestSellers.summary}
              </p>
            </div>
            <div className="grid gap-5">
              {(data?.bestSellers ?? []).slice(0, 2).map((item) => (
                <StorefrontProductCard
                  key={item.id}
                  item={item}
                  href={storefrontPaths.product(item.slug)}
                  onAddToCart={() =>
                    cart.addItem({
                      productId: item.id,
                      slug: item.slug,
                      name: item.name,
                      imageUrl: item.primaryImageUrl,
                      unitPrice: item.sellingPrice,
                      mrp: item.mrp,
                    })
                  }
                />
              ))}
            </div>
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-[2rem] border-[#decfbd] bg-[linear-gradient(135deg,#221812_0%,#3b2a20_100%)] py-0 text-stone-100 shadow-[0_30px_80px_-52px_rgba(28,15,8,0.75)]">
            <CardContent className="space-y-5 p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">
                {data?.settings.sections.cta.eyebrow ?? "Storefront ready"}
              </p>
              <div className="space-y-3">
                <h2 className="font-heading text-3xl font-semibold tracking-tight">
                  {data?.settings.sections.cta.title ??
                    "One storefront, one checkout, one customer portal."}
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-stone-200/80">
                  {data?.settings.sections.cta.summary}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-white text-[#241913] hover:bg-white/90">
                  <Link
                    to={
                      normalizeStorefrontHref(data?.settings.sections.cta.primaryCtaHref) ??
                      storefrontPaths.catalog()
                    }
                  >
                    {data?.settings.sections.cta.primaryCtaLabel ?? "Start browsing"}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10"
                >
                  <Link
                    to={
                      normalizeStorefrontHref(data?.settings.sections.cta.secondaryCtaHref) ??
                      storefrontPaths.cart()
                    }
                  >
                    {data?.settings.sections.cta.secondaryCtaLabel ?? "Open cart"}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4">
            {(data?.settings.trustNotes ?? []).map((note) => {
              const Icon =
                note.iconKey === "truck"
                  ? Truck
                  : note.iconKey === "shield"
                    ? ShieldCheck
                    : Sparkles

              return (
                <Card key={note.id} className="rounded-[1.6rem] border-[#e4d6c7] py-0 shadow-sm">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-[#f4e8da] text-[#6d5140]">
                      <Icon className="size-5" />
                    </div>
                    <p className="font-medium">{note.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {note.summary}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
        {isLoading ? (
          <div className="pb-10 text-sm text-muted-foreground">Loading storefront...</div>
        ) : null}
      </div>
    </StorefrontLayout>
  )
}
