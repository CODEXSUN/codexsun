import { useEffect, useState } from "react"
import { ArrowRight, CircleCheckBig, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

import type { StorefrontLandingResponse } from "@ecommerce/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CommerceProductCard } from "@/components/ux/commerce-product-card"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontLayout } from "../components/storefront-layout"
import {
  normalizeStorefrontHref,
  storefrontPaths,
} from "../lib/storefront-routes"

export function StorefrontHomePage() {
  const [data, setData] = useState<StorefrontLandingResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const cart = useStorefrontCart()

  useEffect(() => {
    async function load() {
      try {
        setData(await storefrontApi.getHome())
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load storefront.")
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <StorefrontLayout>
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 pt-8 lg:px-8 lg:pt-10">
        {error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-border/70 bg-background/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {data?.settings.hero.eyebrow ?? "Storefront"}
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-heading text-5xl font-semibold tracking-tight text-[#241913] sm:text-6xl">
                {data?.settings.hero.title ?? "Shared core products. Fresh ecommerce flows."}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                {data?.settings.hero.summary ??
                  "This storefront rebuild reads shared masters from core and keeps the commerce journey fully inside ecommerce."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link
                  to={
                    normalizeStorefrontHref(data?.settings.hero.primaryCtaHref) ??
                    storefrontPaths.catalog()
                  }
                  className="gap-2"
                >
                  {data?.settings.hero.primaryCtaLabel ?? "Shop now"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link
                  to={
                    normalizeStorefrontHref(data?.settings.hero.secondaryCtaHref) ??
                    storefrontPaths.trackOrder()
                  }
                >
                  {data?.settings.hero.secondaryCtaLabel ?? "Track order"}
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(data?.settings.hero.highlights ?? []).map((highlight) => (
                <div
                  key={highlight.id}
                  className="rounded-[1.3rem] border border-border/70 bg-background/85 p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold">{highlight.label}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {highlight.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[#e8ddd1] p-4 shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.5),transparent_38%),linear-gradient(160deg,rgba(255,255,255,0.2),transparent_55%)]" />
            <img
              src={
                data?.settings.hero.heroImageUrl ??
                "https://placehold.co/1200x900/e9ddcf/2d211b?text=Storefront"
              }
              alt="Storefront hero"
              className="relative h-full w-full rounded-[1.5rem] object-cover"
            />
          </div>
        </section>
        <section className="rounded-[1.8rem] border border-[#d6c8b6] bg-[#221812] px-6 py-4 text-sm text-stone-100 shadow-lg">
          <div className="flex flex-wrap items-center gap-3">
            <Sparkles className="size-4 text-amber-300" />
            <span>{data?.settings.announcement ?? "Storefront announcement will appear here."}</span>
          </div>
        </section>
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Featured
              </p>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                Spotlight picks
              </h2>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to={storefrontPaths.catalog()}>View catalog</Link>
            </Button>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {(data?.featured ?? []).map((item) => (
              <CommerceProductCard
                key={item.id}
                href={storefrontPaths.product(item.slug)}
                name={item.name}
                imageUrl={item.primaryImageUrl}
                badge={item.badge}
                brandName={item.brandName}
                categoryName={item.categoryName}
                shortDescription={item.shortDescription}
                amount={item.sellingPrice}
                compareAtAmount={item.mrp}
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
              Categories
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
              Browse by category
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(data?.categories ?? []).map((category) => (
              <Card key={category.id} className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div className="space-y-2">
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {category.description ?? `${category.productCount} products in this category.`}
                    </p>
                  </div>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link
                      to={
                        normalizeStorefrontHref(category.href) ??
                        storefrontPaths.catalog()
                      }
                    >
                      {category.productCount}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                New arrivals
              </p>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                Fresh into the catalog
              </h2>
            </div>
            <div className="grid gap-4">
              {(data?.newArrivals ?? []).slice(0, 3).map((item) => (
                <Card key={item.id} className="rounded-[1.5rem] border-border/70 py-0 shadow-sm">
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={
                        item.primaryImageUrl ??
                        "https://placehold.co/360x420/e8ddd1/2d211b?text=New"
                      }
                      alt={item.name}
                      className="h-24 w-20 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={storefrontPaths.product(item.slug)}
                        className="line-clamp-2 font-medium text-foreground transition hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.shortDescription}
                      </p>
                    </div>
                    <CircleCheckBig className="size-5 text-emerald-600" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Best sellers
              </p>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                Fast movers right now
              </h2>
            </div>
            <div className="grid gap-4">
              {(data?.bestSellers ?? []).slice(0, 3).map((item) => (
                <Card key={item.id} className="rounded-[1.5rem] border-border/70 py-0 shadow-sm">
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <Link
                        to={storefrontPaths.product(item.slug)}
                        className="line-clamp-1 font-medium text-foreground transition hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.brandName ?? item.categoryName ?? "Catalog product"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() =>
                        cart.addItem({
                          productId: item.id,
                          slug: item.slug,
                          name: item.name,
                          imageUrl: item.primaryImageUrl,
                          unitPrice: item.sellingPrice,
                          mrp: item.mrp,
                        })
                      }
                    >
                      Add
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        {isLoading ? (
          <div className="pb-10 text-sm text-muted-foreground">Loading storefront...</div>
        ) : null}
      </div>
    </StorefrontLayout>
  )
}
