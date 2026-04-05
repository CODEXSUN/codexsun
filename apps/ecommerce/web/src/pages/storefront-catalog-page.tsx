import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"

import type { StorefrontCatalogResponse } from "@ecommerce/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CommerceProductCard } from "@/components/ux/commerce-product-card"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontLayout } from "../components/storefront-layout"
import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "")
  const [data, setData] = useState<StorefrontCatalogResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const cart = useStorefrontCart()

  useEffect(() => {
    setSearchValue(searchParams.get("search") ?? "")
  }, [searchParams])

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        setData(await storefrontApi.getCatalog(searchParams))
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load catalog.")
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [searchParams])

  const categoryOptions = useMemo(
    () => data?.availableCategories ?? [],
    [data]
  )

  return (
    <StorefrontLayout>
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 pt-8 lg:px-8">
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Catalog
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            Browse the storefront
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Filter by category, department, and price while the catalog stays sourced from shared core products.
          </p>
        </section>
        <Card className="rounded-[1.8rem] border-border/70 bg-card/90 py-0 shadow-sm">
          <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search products, brands, or categories"
            />
            <Select
              value={searchParams.get("category") ?? "__all__"}
              onValueChange={(value) => {
                const next = new URLSearchParams(searchParams)
                if (value === "__all__") {
                  next.delete("category")
                } else {
                  next.set("category", value)
                }
                setSearchParams(next)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All categories</SelectItem>
                {categoryOptions.map((item) => (
                  <SelectItem key={item.id} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={searchParams.get("department") ?? "__all__"}
              onValueChange={(value) => {
                const next = new URLSearchParams(searchParams)
                if (value === "__all__") {
                  next.delete("department")
                } else {
                  next.set("department", value)
                }
                setSearchParams(next)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All departments</SelectItem>
                {(data?.availableDepartments ?? []).map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={searchParams.get("sort") ?? "featured"}
              onValueChange={(value) => {
                const next = new URLSearchParams(searchParams)
                next.set("sort", value)
                setSearchParams(next)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="price-asc">Price: Low to high</SelectItem>
                <SelectItem value="price-desc">Price: High to low</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                if (searchValue.trim()) {
                  next.set("search", searchValue.trim())
                } else {
                  next.delete("search")
                }
                setSearchParams(next)
              }}
            >
              Apply
            </Button>
          </CardContent>
        </Card>
        {error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading catalog...</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {(data?.items ?? []).map((item) => (
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
        )}
      </div>
    </StorefrontLayout>
  )
}
