import { useState } from "react"

import { StorefrontSearchSurface } from "@/components/ux/storefront-search-surface"

export default function StorefrontSearch01() {
  const departments = [
    { value: "all", label: "All" },
    { value: "women", label: "Women" },
    { value: "men", label: "Men" },
    { value: "kids", label: "Kids" },
    { value: "accessories", label: "Accessories" },
    { value: "workwear", label: "Workwear" },
  ]
  const [searchValue, setSearchValue] = useState("")
  const [department, setDepartment] = useState("all")

  return (
    <div className="mx-auto w-full space-y-10 xl:w-9/12">
      <StorefrontSearchSurface
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        selectedDepartment={department}
        onDepartmentChange={setDepartment}
        onSubmit={() => undefined}
        showClearButton={Boolean(searchValue || department !== "all")}
        onClear={() => {
          setSearchValue("")
          setDepartment("all")
        }}
        placeholder="Search for products, brands, and categories"
        departments={departments}
        filterOptions={[
          { label: "All categories" },
          { label: "All departments" },
          { label: "Featured" },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <p className="text-[15px] font-medium text-[#7f644f]">4 products available</p>
        <div className="flex flex-wrap justify-end gap-2">
          {["accessories", "cotton", "daily", "festive", "linen", "workwear"].map((item) => (
            <div
              key={item}
              className="rounded-full border border-[#e6d8c8] bg-white px-4 py-2 text-xs font-medium text-[#3b2a20] shadow-sm"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
