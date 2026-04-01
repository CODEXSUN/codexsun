import { FilterIcon, RotateCcwIcon, SparklesIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CatalogFilters, StorefrontCategory } from "@/features/store/types/storefront"
import { cn } from "@/lib/utils"

type FilterOptions = {
  sizes: string[]
  colors: string[]
  fabrics: string[]
  fits: string[]
  sleeves: string[]
  occasions: string[]
}

type ToggleOption = {
  value: string
  label: string
}

type MultiValueFilterKey =
  | "categories"
  | "sizes"
  | "colors"
  | "fabrics"
  | "fits"
  | "sleeves"
  | "occasions"

const departmentOptions: { value: CatalogFilters["department"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "kids", label: "Kids" },
  { value: "accessories", label: "Accessories" },
]

const ratingOptions = [0, 3, 4, 5] as const

function FilterSection({
  title,
  subtitle,
  count,
  children,
}: {
  title: string
  subtitle?: string
  count?: number
  children: ReactNode
}) {
  return (
    <section className="rounded-[1.35rem] border border-[#e7dbcb] bg-white/88 p-4 shadow-[0_18px_40px_-34px_rgba(45,29,19,0.2)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {title}
          </h3>
          {subtitle ? <p className="text-xs leading-5 text-muted-foreground">{subtitle}</p> : null}
        </div>
        {typeof count === "number" && count > 0 ? (
          <Badge variant="outline" className="shrink-0 px-2.5 py-1 normal-case tracking-normal">
            {count}
          </Badge>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function ToggleGroup({
  title,
  subtitle,
  options,
  selected,
  onToggle,
}: {
  title: string
  subtitle?: string
  options: ToggleOption[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  if (options.length === 0) return null

  const shouldScroll = options.length > 8

  return (
    <FilterSection title={title} subtitle={subtitle} count={selected.length}>
      <div className={shouldScroll ? "max-h-40 overflow-y-auto pr-1" : undefined}>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isActive = selected.includes(option.value)

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onToggle(option.value)}
                className={isActive
                  ? "rounded-full border border-foreground bg-foreground px-3 py-1.5 text-sm text-white shadow-sm"
                  : "rounded-full border border-border bg-white px-3 py-1.5 text-sm text-foreground transition hover:border-foreground/30 hover:bg-accent/50"}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </FilterSection>
  )
}

function countActiveFilters(filters: CatalogFilters) {
  return [
    filters.department !== "all",
    filters.categories.length,
    filters.sizes.length,
    filters.colors.length,
    filters.fabrics.length,
    filters.fits.length,
    filters.sleeves.length,
    filters.occasions.length,
    filters.rating > 0,
    filters.availabilityOnly,
    filters.minPrice > 0,
    filters.maxPrice < 10000,
  ].reduce<number>((total, value) => total + Number(Boolean(value)), 0)
}

export function FilterSidebar({
  filters,
  categories,
  options,
  onChange,
  onReset,
  className,
}: {
  filters: CatalogFilters
  categories: StorefrontCategory[]
  options: FilterOptions
  onChange: (next: CatalogFilters) => void
  onReset: () => void
  className?: string
}) {
  const toggleValue = (key: MultiValueFilterKey, value: string) => {
    const current = filters[key]

    onChange({
      ...filters,
      [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    })
  }

  const activeCount = countActiveFilters(filters)

  return (
    <aside className={cn("space-y-4 self-start xl:sticky xl:top-24", className)}>
      <section className="rounded-[1.8rem] border border-[#e7dbcb] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,246,241,0.95)_100%)] p-5 shadow-[0_24px_50px_-38px_rgba(45,29,19,0.2)]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <FilterIcon className="size-3.5" />
              Filters
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">Refine the catalog</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Narrow the collection with clean grouped filters.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={onReset}>
            <RotateCcwIcon className="size-4" />
            Reset
          </Button>
        </div>

        <div className="mt-4 rounded-[1.25rem] border border-[#eadfce] bg-white/82 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <SparklesIcon className="size-4 text-muted-foreground" />
              Active filters
            </div>
            <Badge variant={activeCount > 0 ? "default" : "outline"} className="px-2.5 py-1 normal-case tracking-normal">
              {activeCount}
            </Badge>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {activeCount > 0
              ? "Results update instantly as you refine."
              : "Start with department, then narrow further."}
          </p>
        </div>
      </section>

      <div className="space-y-3">
        <FilterSection
          title="Department"
          subtitle="Choose the main segment first."
          count={filters.department === "all" ? 0 : 1}
        >
          <div className="flex flex-wrap gap-2">
            {departmentOptions.map((department) => {
              const active = filters.department === department.value

              return (
                <button
                  key={department.value}
                  type="button"
                  onClick={() => onChange({ ...filters, department: department.value })}
                  className={active
                    ? "rounded-full border border-foreground bg-foreground px-3 py-1.5 text-sm text-white shadow-sm"
                    : "rounded-full border border-border bg-white px-3 py-1.5 text-sm text-foreground transition hover:border-foreground/30 hover:bg-accent/50"}
                >
                  {department.label}
                </button>
              )
            })}
          </div>
        </FilterSection>

        <ToggleGroup
          title="Categories"
          subtitle="Browse by catalog group."
          options={categories.map((category) => ({ value: category.slug, label: category.name }))}
          selected={filters.categories}
          onToggle={(value) => toggleValue("categories", value)}
        />

        <ToggleGroup
          title="Sizes"
          subtitle="Available size values."
          options={options.sizes.map((value) => ({ value, label: value }))}
          selected={filters.sizes}
          onToggle={(value) => toggleValue("sizes", value)}
        />

        <ToggleGroup
          title="Colors"
          subtitle="Filter by visible color options."
          options={options.colors.map((value) => ({ value, label: value }))}
          selected={filters.colors}
          onToggle={(value) => toggleValue("colors", value)}
        />

        <ToggleGroup
          title="Fabrics"
          subtitle="Material-based filtering."
          options={options.fabrics.map((value) => ({ value, label: value }))}
          selected={filters.fabrics}
          onToggle={(value) => toggleValue("fabrics", value)}
        />

        <ToggleGroup
          title="Fits"
          subtitle="Silhouette and fit labels."
          options={options.fits.map((value) => ({ value, label: value }))}
          selected={filters.fits}
          onToggle={(value) => toggleValue("fits", value)}
        />

        <ToggleGroup
          title="Sleeves"
          subtitle="Sleeve styling options."
          options={options.sleeves.map((value) => ({ value, label: value }))}
          selected={filters.sleeves}
          onToggle={(value) => toggleValue("sleeves", value)}
        />

        <ToggleGroup
          title="Occasions"
          subtitle="Shop by occasion."
          options={options.occasions.map((value) => ({ value, label: value }))}
          selected={filters.occasions}
          onToggle={(value) => toggleValue("occasions", value)}
        />

        <FilterSection title="Price range" subtitle="Set the minimum and maximum visible product price.">
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Min</span>
              <Input
                type="number"
                value={filters.minPrice}
                onChange={(event) => onChange({ ...filters, minPrice: Number(event.target.value || 0) })}
                className="h-10 rounded-xl bg-white"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Max</span>
              <Input
                type="number"
                value={filters.maxPrice}
                onChange={(event) => onChange({ ...filters, maxPrice: Number(event.target.value || 0) })}
                className="h-10 rounded-xl bg-white"
              />
            </label>
          </div>
        </FilterSection>

        <FilterSection title="Rating" subtitle="Prefer products with stronger review scores.">
          <div className="flex flex-wrap gap-2">
            {ratingOptions.map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onChange({ ...filters, rating })}
                className={filters.rating === rating
                  ? "rounded-full border border-foreground bg-foreground px-3 py-1.5 text-sm text-white shadow-sm"
                  : "rounded-full border border-border bg-white px-3 py-1.5 text-sm text-foreground transition hover:border-foreground/30 hover:bg-accent/50"}
              >
                {rating === 0 ? "All ratings" : `${rating}+ stars`}
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Availability" subtitle="Keep only products that can be added to cart immediately.">
          <label className="flex items-center gap-3 rounded-[1rem] border border-border/70 bg-white px-4 py-3 text-sm transition hover:border-foreground/20">
            <input
              type="checkbox"
              checked={filters.availabilityOnly}
              onChange={(event) => onChange({ ...filters, availabilityOnly: event.target.checked })}
            />
            <span className="font-medium">Show only in-stock styles</span>
          </label>
        </FilterSection>
      </div>
    </aside>
  )
}
