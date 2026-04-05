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
import { useEffect, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

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

import { storefrontPaths } from "../lib/storefront-routes"

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

export function StorefrontSearchBar({
  className,
  departmentLabel = "Department",
  departments = [],
  placeholder = "Search products",
}: {
  className?: string
  departmentLabel?: string
  departments?: { value: string; label: string }[]
  placeholder?: string
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "")
  const [department, setDepartment] = useState(searchParams.get("department") ?? "all")

  useEffect(() => {
    setSearchValue(searchParams.get("search") ?? "")
    setDepartment(searchParams.get("department") ?? "all")
  }, [searchParams])

  const safeDepartments =
    departments.length > 0 ? departments : [{ value: "all", label: "All" }]

  return (
    <form
      className={cn(
        "group flex w-full items-stretch overflow-hidden rounded-full border border-[#ddd4c9] bg-[#fffdfa] shadow-[0_20px_42px_-30px_rgba(58,34,18,0.5)] transition-[border-color,box-shadow,transform] duration-300 focus-within:-translate-y-0.5 focus-within:border-[#efb15a] focus-within:shadow-[0_28px_56px_-32px_rgba(240,179,93,0.65)]",
        className
      )}
      onSubmit={(event) => {
        event.preventDefault()
        const next = new URLSearchParams()

        if (searchValue.trim()) {
          next.set("search", searchValue.trim())
        }

        if (department && department !== "all") {
          next.set("department", department)
        }

        const href = storefrontPaths.catalog()
        const search = next.toString()
        void navigate(search ? `${href}?${search}` : href)
      }}
    >
      <label className="sr-only" htmlFor="storefront-department-trigger">
        {departmentLabel}
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            id="storefront-department-trigger"
            type="button"
            variant="ghost"
            className="h-14 min-w-[6.5rem] justify-start gap-2 rounded-none border-r border-[#ebe3d9] bg-transparent px-3.5 text-sm font-medium text-[#5c5147] shadow-none transition-all duration-200 hover:bg-transparent hover:text-[#8b5e34] focus-visible:ring-0 data-[state=open]:bg-transparent data-[state=open]:text-[#8b5e34] [&_svg:last-child]:transition-transform [&_svg:last-child]:duration-200 data-[state=open]:[&_svg:last-child]:rotate-180 sm:min-w-[7.25rem]"
            aria-label={departmentLabel}
          >
            <span className="truncate">
              {safeDepartments.find((item) => item.value === department)?.label ?? "All"}
            </span>
            <ChevronDown className="ml-auto size-4 text-[#9a8b7c]" />
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
              const isSelected = item.value === department

              return (
                <DropdownMenuItem
                  key={item.value}
                  className={cn(
                    "mx-2 rounded-xl px-3 py-3 text-[14px] font-medium text-[#241913] transition-colors duration-200 focus:bg-[#f6efe8] focus:text-[#8b5e34]",
                    isSelected && "bg-[#f6efe8] text-[#8b5e34]"
                  )}
                  onSelect={() => {
                    setDepartment(item.value)
                  }}
                >
                  <Icon className={cn("size-4 text-[#8e7b67]", isSelected && "text-[#8b5e34]")} />
                  <span className="flex-1">{item.label}</span>
                  {isSelected ? <Check className="size-4 text-[#8b5e34]" /> : null}
                </DropdownMenuItem>
              )
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex min-w-0 flex-1 items-center gap-2 px-5">
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          className="h-14 border-0 bg-transparent px-0 text-[15px] font-medium text-[#1f1a16] shadow-none placeholder:text-[#9b9084] focus-visible:ring-0"
          placeholder={placeholder}
        />
      </div>
      <Button
        type="submit"
        size="icon"
        className="relative z-10 mr-1.5 h-[calc(100%-12px)] min-h-11 w-12 shrink-0 self-center rounded-full border border-[#efbb72] bg-[#f3c27c] text-[#241913] shadow-[0_12px_20px_-16px_rgba(161,98,23,0.7)] transition-all duration-200 hover:scale-[1.02] hover:border-[#e6ac57] hover:bg-[#efb15a] hover:shadow-[0_16px_24px_-16px_rgba(240,177,90,0.7)] active:scale-[0.97]"
      >
        <Search className="size-5" />
      </Button>
      {location.pathname === storefrontPaths.catalog() &&
      (searchParams.get("search") || searchParams.get("department")) ? (
        <Button
          type="button"
          variant="ghost"
          className="mr-1 h-12 rounded-full px-4 text-[#6f655b] transition-colors duration-200 hover:bg-[#f4ece3] hover:text-[#1f1a16]"
          onClick={() => {
            setSearchValue("")
            setDepartment("all")
            void navigate(storefrontPaths.catalog())
          }}
        >
          Clear
        </Button>
      ) : null}
    </form>
  )
}
