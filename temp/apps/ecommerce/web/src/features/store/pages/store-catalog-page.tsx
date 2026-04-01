import { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { BarChart3Icon, SlidersHorizontalIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { StorefrontSearchBar } from "@/features/store/components/navigation/storefront-search-bar"
import { CatalogMobileFilterSheet } from "@/features/store/components/product/catalog-mobile-filter-sheet"
import { FilterSidebar } from "@/features/store/components/product/FilterSidebar"
import { ProductGrid } from "@/features/store/components/product/ProductGrid"
import { SortDropdown } from "@/features/store/components/product/SortDropdown"
import { useStorefront } from "@/features/store/context/storefront-context"
import {
  buildDefaultFilters,
  filterProducts,
  getCategoryBySlug,
  getFilterOptions,
  sortProducts,
} from "@/features/store/lib/storefront-utils"
import type { StorefrontSortOption } from "@/features/store/types/storefront"

export function StoreCatalogPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const { categories, products, isLoading, errorMessage } = useStorefront()
  const [sort, setSort] = useState<StorefrontSortOption>("featured")
  const [filters, setFilters] = useState(() => buildDefaultFilters(slug))
  const query = searchParams.get("q") ?? ""
  const selectedDepartment = searchParams.get("department") ?? "all"
  const routeCategory = getCategoryBySlug(categories, slug)

  useEffect(() => {
    const nextFilters = buildDefaultFilters(slug)
    const department = searchParams.get("department")
    const occasion = searchParams.get("occasion")

    if (
      department === "women" ||
      department === "men" ||
      department === "kids" ||
      department === "accessories"
    ) {
      nextFilters.department = department
    }

    if (occasion) {
      nextFilters.occasions = [occasion]
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(nextFilters)
  }, [searchParams, slug])

  const filteredProducts = useMemo(
    () => sortProducts(filterProducts(products, filters, query), sort),
    [filters, products, query, sort],
  )
  const filterOptions = useMemo(() => getFilterOptions(products), [products])

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground sm:px-6">Loading catalog...</div>
  }

  if (errorMessage) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-destructive sm:px-6">{errorMessage}</div>
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <section className="overflow-hidden rounded-[2.3rem] border border-[#eadfce] bg-[linear-gradient(135deg,rgba(255,251,246,0.97)_0%,rgba(247,239,228,0.9)_52%,rgba(255,255,255,0.96)_100%)] p-6 shadow-[0_28px_70px_-48px_rgba(53,35,20,0.32)] sm:p-8">
        <div className="space-y-3">
          <Badge variant="outline" className="w-fit border-[#dbc9af] bg-white/80 text-foreground">
            Catalog
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {routeCategory ? routeCategory.name : query ? `Results for "${query}"` : "All styles"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Browse the catalog with a cleaner layout, focused controls, and refined product cards.
          </p>
        </div>
      </section>

      <section className="hidden gap-4 md:grid lg:grid-cols-2">
        <div className="rounded-[1.7rem] border border-[#e8dccd] bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(247,241,233,0.92)_100%)] p-5 shadow-[0_22px_48px_-42px_rgba(45,29,19,0.24)]">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f5ebdd] text-foreground">
              <BarChart3Icon className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Results
              </div>
              <div className="text-3xl font-semibold text-foreground">{filteredProducts.length}</div>
              <div className="text-sm text-muted-foreground">Visible styles in the current catalog view.</div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-[#e8dccd] bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(247,241,233,0.92)_100%)] p-5 shadow-[0_22px_48px_-42px_rgba(45,29,19,0.24)]">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f5ebdd] text-foreground">
              <SlidersHorizontalIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="space-y-1">
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Sort
                </div>
                <div className="text-sm text-muted-foreground">Choose how catalog items are ordered.</div>
              </div>
              <SortDropdown value={sort} onChange={setSort} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <FilterSidebar
          filters={filters}
          categories={categories}
          options={filterOptions}
          onChange={setFilters}
          onReset={() => setFilters(buildDefaultFilters(slug))}
          className="hidden md:block"
        />

        <section className="space-y-5">
          <div className="rounded-[1.8rem] border border-[#eee3d3] bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(251,247,241,0.92)_100%)] p-4 shadow-[0_22px_48px_-42px_rgba(45,29,19,0.28)] sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Search and refine
                </div>
                <p className="text-sm text-muted-foreground">
                  Use search, department, and filters to narrow the catalog quickly.
                </p>
              </div>
              <div className="rounded-full bg-[#f4ede3] px-3 py-1 text-xs font-medium text-foreground/75">
                {routeCategory ? routeCategory.name : selectedDepartment === "all" ? "All departments" : selectedDepartment}
              </div>
            </div>
            <div className="mt-4">
              <StorefrontSearchBar
                initialValue={query}
                initialDepartment={selectedDepartment}
                className="w-full"
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#eee3d3] bg-white/92 p-4 shadow-[0_18px_38px_-34px_rgba(45,29,19,0.24)] md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Results
                </div>
                <div className="mt-1 text-2xl font-semibold text-foreground">{filteredProducts.length}</div>
              </div>
              <div className="rounded-full bg-[#f4ede3] px-3 py-1 text-xs font-medium text-foreground/75">
                {routeCategory ? routeCategory.name : "Catalog"}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <SortDropdown value={sort} onChange={setSort} />
              <CatalogMobileFilterSheet
                filters={filters}
                categories={categories}
                options={filterOptions}
                onChange={setFilters}
                onReset={() => setFilters(buildDefaultFilters(slug))}
              />
            </div>
          </div>

          <ProductGrid
            products={filteredProducts}
            emptyMessage="No styles match the current filters. Adjust the filters to broaden the catalog."
          />
        </section>
      </div>
    </div>
  )
}
