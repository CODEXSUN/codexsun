import {
  Baby,
  Check,
  ChevronDown,
  Grid2x2,
  Search,
  Shirt,
  ShoppingBag,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type StorefrontSearchDepartmentOption = {
  value: string
  label: string
}

export type StorefrontSearchFilterOption = {
  label: string
}

function resolveDepartmentIcon(value: string, label: string) {
  const token = `${value} ${label}`.toLowerCase()

  if (token.includes("women") || token.includes("beauty")) {
    return Sparkles
  }

  if (token.includes("men")) {
    return Shirt
  }

  if (token.includes("kid") || token.includes("baby")) {
    return Baby
  }

  if (token.includes("accessor") || token.includes("bag")) {
    return ShoppingBag
  }

  return Grid2x2
}

export function StorefrontSearchSurface({
  className,
  departmentLabel = "Department",
  departments = [],
  placeholder = "Search products",
  searchValue = "",
  onSearchValueChange,
  selectedDepartment = "all",
  onDepartmentChange,
  onSubmit,
  showClearButton = false,
  onClear,
  readOnly = false,
  leadingLabel,
  filterOptions = [],
  tagOptions = [],
  resetLabel = "Reset",
}: {
  className?: string
  departmentLabel?: string
  departments?: StorefrontSearchDepartmentOption[]
  placeholder?: string
  searchValue?: string
  onSearchValueChange?: (value: string) => void
  selectedDepartment?: string
  onDepartmentChange?: (value: string) => void
  onSubmit?: () => void
  showClearButton?: boolean
  onClear?: () => void
  readOnly?: boolean
  leadingLabel?: string
  filterOptions?: StorefrontSearchFilterOption[]
  tagOptions?: string[]
  resetLabel?: string
}) {
  const safeDepartments =
    departments.length > 0 ? departments : [{ value: "all", label: "All" }]
  const selectedDepartmentLabel =
    leadingLabel ??
    safeDepartments.find((item) => item.value === selectedDepartment)?.label ??
    "All"

  const searchField = readOnly ? (
    <div className="flex h-12 items-center px-0 text-[14px] font-medium text-[#7f6b59] sm:h-14 sm:text-[15px]">
      {searchValue || placeholder}
    </div>
  ) : (
    <Input
      value={searchValue}
      onChange={(event) => onSearchValueChange?.(event.target.value)}
      aria-label={placeholder}
      className="h-12 border-0 bg-transparent px-0 text-[14px] font-medium text-[#1f1a16] shadow-none placeholder:text-[#9b9084] focus-visible:ring-0 sm:h-14 sm:text-[15px]"
      placeholder={placeholder}
    />
  )

  const searchButton = (
    <Button
      type={readOnly ? "button" : "submit"}
      size="icon"
      aria-label={readOnly ? "Open storefront search" : "Submit storefront search"}
      className="relative z-10 mr-1 h-[calc(100%-8px)] min-h-10 w-11 shrink-0 self-center rounded-full border border-[#efbb72] bg-[#f3c27c] text-[#241913] shadow-[0_12px_20px_-16px_rgba(161,98,23,0.7)] transition-all duration-200 hover:scale-[1.02] hover:border-[#e6ac57] hover:bg-[#efb15a] hover:shadow-[0_16px_24px_-16px_rgba(240,177,90,0.7)] active:scale-[0.97] sm:mr-1.5 sm:h-[calc(100%-12px)] sm:min-h-11 sm:w-12"
      onClick={() => {
        if (readOnly) {
          return
        }
        onSubmit?.()
      }}
    >
      <Search className="size-5" />
    </Button>
  )

  return (
    <div className={cn("space-y-4", className)}>
      <form
        className="group flex w-full items-stretch overflow-hidden rounded-[1.6rem] border border-[#ddd4c9] bg-[#fffdfa] shadow-[0_20px_42px_-30px_rgba(58,34,18,0.5)] transition-[border-color,box-shadow,transform] duration-300 focus-within:-translate-y-0.5 focus-within:border-[#efb15a] focus-within:shadow-[0_28px_56px_-32px_rgba(240,179,93,0.65)] sm:rounded-full"
        onSubmit={(event) => {
          event.preventDefault()
          if (readOnly) {
            return
          }
          onSubmit?.()
        }}
      >
        <label className="sr-only" htmlFor="storefront-search-surface-department">
          {departmentLabel}
        </label>
        {readOnly ? (
          <div className="flex min-w-[136px] items-center justify-center gap-3 border-b border-[#ebe3d9] px-4 py-4 text-sm font-medium text-[#5c5147] md:border-b-0 md:border-r">
            <span>{selectedDepartmentLabel}</span>
            <ChevronDown className="size-4 text-[#9a8b7c]" />
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id="storefront-search-surface-department"
                type="button"
                variant="ghost"
                className="h-12 min-w-[5.5rem] justify-center gap-2 rounded-none border-r border-[#ebe3d9] bg-transparent px-3 text-sm font-medium text-[#5c5147] shadow-none transition-all duration-200 hover:bg-transparent hover:text-[#8b5e34] focus-visible:ring-0 data-[state=open]:bg-transparent data-[state=open]:text-[#8b5e34] [&_svg:last-child]:transition-transform [&_svg:last-child]:duration-200 data-[state=open]:[&_svg:last-child]:rotate-180 sm:h-14 sm:min-w-[7.25rem] sm:px-3.5"
                aria-label={departmentLabel}
              >
                <span className="truncate">{selectedDepartmentLabel}</span>
                <ChevronDown className="size-4 text-[#9a8b7c]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={10}
              className="w-[240px] rounded-[1.35rem] border-[#e2ddd6] bg-white p-0 shadow-[0_22px_44px_-26px_rgba(44,26,14,0.35)]"
            >
              <div className="px-4 py-4">
                <p className="text-[1.02rem] font-semibold text-[#241913]">
                  Browse Departments
                </p>
              </div>
              <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
              <div className="py-2">
                {safeDepartments.map((item) => {
                  const Icon = resolveDepartmentIcon(item.value, item.label)
                  const isSelected = item.value === selectedDepartment

                  return (
                    <DropdownMenuItem
                      key={item.value}
                      className={cn(
                        "mx-2 rounded-xl px-3 py-3 text-[14px] font-medium text-[#241913] transition-colors duration-200 focus:bg-[#f6efe8] focus:text-[#8b5e34]",
                        isSelected && "bg-[#f6efe8] text-[#8b5e34]"
                      )}
                      onSelect={() => onDepartmentChange?.(item.value)}
                    >
                      <Icon
                        className={cn(
                          "size-4 text-[#8e7b67]",
                          isSelected && "text-[#8b5e34]"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {isSelected ? <Check className="size-4 text-[#8b5e34]" /> : null}
                    </DropdownMenuItem>
                  )
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2 px-4 sm:px-5">
          {searchField}
        </div>
        {searchButton}
        {showClearButton ? (
          <Button
            type="button"
            variant="ghost"
            aria-label="Clear storefront search"
            className="mr-1 hidden h-12 rounded-full px-4 text-[#6f655b] transition-colors duration-200 hover:bg-[#f4ece3] hover:text-[#1f1a16] sm:inline-flex"
            onClick={() => onClear?.()}
          >
            Clear
          </Button>
        ) : null}
      </form>

      {filterOptions.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-[1.15fr_1.15fr_1.15fr_auto]">
          {filterOptions.map((item, index) => (
            <div
              key={`${item.label}:${index}`}
              className="flex items-center justify-between rounded-full border border-[#e6d8c8] bg-white px-4 py-3 text-sm text-[#3b2a20] shadow-sm"
            >
              <span>{item.label}</span>
              <ChevronDown className="size-4 text-[#c2ac95]" />
            </div>
          ))}
          <div className="flex items-center justify-center rounded-full border border-[#e6d8c8] bg-white px-4 py-3 text-sm font-medium text-[#3b2a20] shadow-sm">
            {resetLabel}
          </div>
        </div>
      ) : null}

      {tagOptions.length > 0 ? (
        <div className="flex flex-wrap justify-end gap-2">
          {tagOptions.map((item) => (
            <div
              key={item}
              className="rounded-full border border-[#e6d8c8] bg-white px-4 py-2 text-xs font-medium text-[#3b2a20] shadow-sm"
            >
              {item}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
