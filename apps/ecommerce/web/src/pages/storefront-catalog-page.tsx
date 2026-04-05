import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useSearchParams } from "react-router-dom"

import type { StorefrontCatalogResponse } from "@ecommerce/shared"
import { queryKeys } from "@cxapp/web/src/query/query-keys"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontLayout } from "../components/storefront-layout"
import { StorefrontProductCard } from "../components/storefront-product-card"
import { StorefrontSearchBar } from "../components/storefront-search-bar"
import { StorefrontCatalogSkeleton } from "../components/storefront-skeletons"
import { useStorefrontCustomerPortal } from "../hooks/use-storefront-customer-portal"
import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontCatalogPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryString = searchParams.toString()
  const cart = useStorefrontCart()
  const customerAuth = useStorefrontCustomerAuth()
  const customerPortal = useStorefrontCustomerPortal()

  const { data, error, isLoading, isFetching } = useQuery<StorefrontCatalogResponse>({
    queryKey: queryKeys.storefrontCatalog(queryString),
    queryFn: () => storefrontApi.getCatalog(searchParams),
    placeholderData: (previousData) => previousData,
  })

  const categoryOptions = useMemo(() => data?.availableCategories ?? [], [data])
  const showSearchSection = Boolean(data?.settings.visibility.search)

  async function handleToggleWishlist(productId: string) {
    if (!customerAuth.isAuthenticated || !customerAuth.accessToken) {
      void navigate(storefrontPaths.accountLogin(storefrontPaths.accountSection("wishlist")))
      return
    }

    await customerPortal.toggleWishlist(productId)
  }

  return (
    <StorefrontLayout>
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 pt-8 lg:px-8">
        {showSearchSection ? (
          <>
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#866651]">
                {data?.settings.search.catalogIntro.eyebrow ?? "Catalog"}
              </p>
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-[#241913]">
                {data?.settings.search.catalogIntro.title ?? "Browse the storefront"}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-[#6a5241]">
                {data?.settings.search.catalogIntro.summary ??
                  "Shared core products are merchandised here with ecommerce-owned discovery, filter, cart, and checkout behavior."}
              </p>
            </section>
            <Card className="rounded-[2rem] border-[#e3d5c6] bg-white/85 py-0 shadow-[0_26px_55px_-42px_rgba(48,31,19,0.28)]">
              <CardContent className="grid gap-5 p-5">
                <StorefrontSearchBar
                  className="shadow-none"
                  placeholder={data?.settings.search.placeholder}
                  departmentLabel={data?.settings.search.departmentLabel}
                  departments={data?.settings.search.departments}
                />
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
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
                    <SelectTrigger className="w-full rounded-full bg-[#fbf7f1]">
                      <SelectValue placeholder={data?.settings.search.categoryFilterLabel ?? "Category"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">
                        {data?.settings.search.categoryFilterLabel ?? "All Category"}
                      </SelectItem>
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
                    <SelectTrigger className="w-full rounded-full bg-[#fbf7f1]">
                      <SelectValue placeholder={data?.settings.search.departmentFilterLabel ?? "Department"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">
                        {data?.settings.search.departmentFilterLabel ?? "All departments"}
                      </SelectItem>
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
                    <SelectTrigger className="w-full rounded-full bg-[#fbf7f1]">
                      <SelectValue placeholder={data?.settings.search.sortFilterLabel ?? "Sort"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">
                        {data?.settings.search.sortFilterLabel ?? "Featured"}
                      </SelectItem>
                      <SelectItem value="latest">Latest</SelectItem>
                      <SelectItem value="price-asc">Price: Low to high</SelectItem>
                      <SelectItem value="price-desc">Price: High to low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setSearchParams(new URLSearchParams())}
                  >
                    {data?.settings.search.resetLabel ?? "Reset"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
        {error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6 text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to load catalog."}
            </CardContent>
          </Card>
        ) : null}
        {isLoading && !data ? (
          <StorefrontCatalogSkeleton />
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-[#6a5241]">
                {(data?.items ?? []).length}{" "}
                {data?.settings.search.resultsLabel ?? "products available"}
              </p>
              <div className="flex flex-wrap gap-2">
                {(data?.availableTags ?? []).slice(0, 6).map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant="outline"
                    className="rounded-full text-xs"
                    onClick={() => {
                      const next = new URLSearchParams(searchParams)
                      next.set("tag", tag)
                      setSearchParams(next)
                    }}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
            {isFetching ? (
              <div className="text-sm text-muted-foreground">Refreshing catalog…</div>
            ) : null}
            <div className="grid gap-5 lg:grid-cols-3">
              {(data?.items ?? []).map((item) => (
                <StorefrontProductCard
                  key={item.id}
                  item={item}
                  href={storefrontPaths.product(item.slug)}
                  isWishlisted={customerPortal.isWishlisted(item.id)}
                  onToggleWishlist={() => void handleToggleWishlist(item.id)}
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
          </>
        )}
      </div>
    </StorefrontLayout>
  )
}
