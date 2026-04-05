import { useEffect, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { StorefrontSearchSurface } from "@/components/ux/storefront-search-surface"
import { cn } from "@/lib/utils"

import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontSearchBar({
  className,
  departmentLabel = "Department",
  departments = [],
  placeholder = "Search products",
  readOnly = false,
}: {
  className?: string
  departmentLabel?: string
  departments?: { value: string; label: string }[]
  placeholder?: string
  readOnly?: boolean
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

  return (
    <StorefrontSearchSurface
      className={cn(className)}
      placeholder={placeholder}
      departmentLabel={departmentLabel}
      departments={departments}
      readOnly={readOnly}
      searchValue={searchValue}
      onSearchValueChange={setSearchValue}
      selectedDepartment={department}
      onDepartmentChange={setDepartment}
      onSubmit={() => {
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
      showClearButton={
        location.pathname === storefrontPaths.catalog() &&
        Boolean(searchParams.get("search") || searchParams.get("department"))
      }
      onClear={() => {
        setSearchValue("")
        setDepartment("all")
        void navigate(storefrontPaths.catalog())
      }}
    />
  )
}
