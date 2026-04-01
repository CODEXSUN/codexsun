import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { SearchIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function StorefrontSearchBar({
  initialValue = "",
  initialDepartment = "all",
  className,
}: {
  initialValue?: string
  initialDepartment?: string
  className?: string
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initialValue)
  const [department, setDepartment] = useState(initialDepartment)

  useEffect(() => {
    setQuery(initialValue)
  }, [initialValue])

  useEffect(() => {
    setDepartment(initialDepartment)
  }, [initialDepartment])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const params = new URLSearchParams()
    const normalizedQuery = query.trim()

    if (normalizedQuery) {
      params.set("q", normalizedQuery)
    }

    if (department !== "all") {
      params.set("department", department)
    }

    void navigate(`/search${params.size > 0 ? `?${params.toString()}` : ""}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full items-stretch overflow-hidden rounded-md border border-border shadow-sm focus-within:ring-2 focus-within:ring-orange-500/50",
        className,
      )}
    >
      <select
        value={department}
        onChange={(event) => setDepartment(event.target.value)}
        className="h-10 w-19.5 cursor-pointer border-0 border-r bg-muted/60 px-2 text-center text-sm outline-none sm:w-[96px] sm:px-3"
        aria-label="Select department"
      >
        <option value="all">All</option>
        <option value="women">Women</option>
        <option value="men">Men</option>
        <option value="kids">Kids</option>
        <option value="accessories">Accessories</option>
      </select>
      <div className="relative flex-1">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-10 rounded-none border-0 bg-background px-3 focus-visible:ring-0 sm:px-4"
        />
      </div>
      <Button type="submit" size="icon" className="h-10 w-12 cursor-pointer rounded-l-none bg-[#febd69] text-black hover:bg-[#f3a847] sm:w-14">
        <SearchIcon className="size-5" />
      </Button>
    </form>
  )
}
