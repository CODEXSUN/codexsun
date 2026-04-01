import { SlidersHorizontalIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { FilterSidebar } from './FilterSidebar'
import type { CatalogFilters, StorefrontCategory } from '@/features/store/types/storefront'

type FilterOptions = {
  sizes: string[]
  colors: string[]
  fabrics: string[]
  fits: string[]
  sleeves: string[]
  occasions: string[]
}

function countActiveFilters(filters: CatalogFilters) {
  return [
    filters.department !== 'all',
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

export function CatalogMobileFilterSheet({
  filters,
  categories,
  options,
  onChange,
  onReset,
}: {
  filters: CatalogFilters
  categories: StorefrontCategory[]
  options: FilterOptions
  onChange: (next: CatalogFilters) => void
  onReset: () => void
}) {
  const activeCount = countActiveFilters(filters)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" className="rounded-full">
          <SlidersHorizontalIcon className="size-4" />
          Filters
          <Badge variant={activeCount > 0 ? 'default' : 'outline'} className="ml-1 rounded-full px-2 py-0 text-[10px]">
            {activeCount}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>Catalog Filters</SheetTitle>
          <SheetDescription>
            Refine products without leaving the visual product grid.
          </SheetDescription>
        </SheetHeader>
        <FilterSidebar
          filters={filters}
          categories={categories}
          options={options}
          onChange={onChange}
          onReset={onReset}
          className="space-y-3"
        />
      </SheetContent>
    </Sheet>
  )
}
