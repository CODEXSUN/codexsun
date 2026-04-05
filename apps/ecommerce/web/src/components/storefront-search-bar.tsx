import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { storefrontPaths } from "../lib/storefront-routes"

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
        "flex w-full items-stretch overflow-hidden rounded-md border border-[#d9d9d9] bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#febd69]/60",
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
      <label className="sr-only" htmlFor="storefront-department-select">
        {departmentLabel}
      </label>
      <select
        id="storefront-department-select"
        value={department}
        onChange={(event) => setDepartment(event.target.value)}
        className="h-11 min-w-[5.5rem] border-0 border-r border-[#dddddd] bg-[#f7f7f7] px-3 text-sm text-[#2f2f2f] outline-none sm:min-w-[6rem]"
        aria-label={departmentLabel}
      >
          {safeDepartments.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
      </select>
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          className="h-11 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          placeholder={placeholder}
        />
      </div>
      <Button
        type="submit"
        size="icon"
        className="relative z-10 -ml-px h-11 w-14 rounded-none rounded-r-md border border-[#f1ac52] bg-[#febd69] text-[#1f1f1f] hover:bg-[#f1ac52]"
      >
        <Search className="size-5" />
      </Button>
      {location.pathname === storefrontPaths.catalog() &&
      (searchParams.get("search") || searchParams.get("department")) ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11 rounded-none border-l border-[#dddddd] px-4 text-[#666666] hover:bg-[#f7f7f7] hover:text-[#1f1f1f]"
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
