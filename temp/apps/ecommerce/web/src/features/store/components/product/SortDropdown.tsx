import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { StorefrontSortOption } from "@/features/store/types/storefront"

const options: { label: string; value: StorefrontSortOption }[] = [
  { label: "Featured", value: "featured" },
  { label: "Latest", value: "latest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Top Rated", value: "rating-desc" },
  { label: "Name", value: "name-asc" },
]

export function SortDropdown({
  value,
  onChange,
}: {
  value: StorefrontSortOption
  onChange: (value: StorefrontSortOption) => void
}) {
  return (
    <Select value={value} onValueChange={(next: string) => onChange(next as StorefrontSortOption)}>
      <SelectTrigger className="h-12 w-full rounded-2xl border-[#e2d5c6] bg-white px-4 text-left shadow-none md:w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-2xl border-[#e2d5c6] bg-white">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="rounded-xl">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
