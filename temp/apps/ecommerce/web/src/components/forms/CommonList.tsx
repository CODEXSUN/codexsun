import { useMemo, useState, type ReactNode } from "react"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  FunnelIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type SortDirection = "asc" | "desc"
type PrimitiveSortValue = string | number | boolean | Date | null | undefined

export type CommonListActiveFilter = {
  key: string
  label: string
  value: string
}

export type CommonListFilterOption = {
  key: string
  label: string
  isActive?: boolean
  onSelect: () => void
  onCheckedChange?: (checked: boolean) => void
}

export type CommonListColumn<TData> = {
  id: string
  header: string
  cell: (row: TData) => ReactNode
  accessor?: (row: TData) => PrimitiveSortValue
  sortable?: boolean
  className?: string
  headerClassName?: string
  defaultVisible?: boolean
  sticky?: "left" | "right"
}

export type CommonListHeaderConfig = {
  pageTitle: string
  pageDescription: string
  addLabel?: string
  onAddClick?: () => void
  addDisabled?: boolean
}

export type CommonListSearchConfig = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export type CommonListFiltersConfig = {
  buttonLabel?: string
  options?: CommonListFilterOption[]
  activeFilters?: CommonListActiveFilter[]
  onRemoveFilter?: (key: string) => void
  onClearAllFilters?: () => void
}

export type CommonListTableConfig<TData> = {
  columns: CommonListColumn<TData>[]
  data: TData[]
  loading?: boolean
  loadingMessage?: string
  emptyMessage?: string
  rowKey?: (row: TData, index: number) => string | number
}

export type CommonListFooterConfig = {
  content?: ReactNode
}

export type CommonListPaginationConfig = {
  currentPage: number
  pageSize: number
  totalRecords: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

export type CommonListProps<TData> = {
  header: CommonListHeaderConfig
  search?: CommonListSearchConfig
  filters?: CommonListFiltersConfig
  table: CommonListTableConfig<TData>
  footer?: CommonListFooterConfig
  pagination?: CommonListPaginationConfig
}

type SortState = {
  columnId: string
  direction: SortDirection
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50]

function getStickyClass(sticky?: "left" | "right", surface: "header" | "body" = "body") {
  const backgroundClass = surface === "header"
    ? "bg-muted"
    : "bg-card group-hover/table-row:bg-muted/50 group-data-[state=selected]/table-row:bg-muted"

  if (sticky === "left") {
    return `sticky left-0 z-20 ${backgroundClass}`
  }

  if (sticky === "right") {
    return `sticky right-0 z-20 ${backgroundClass}`
  }

  return ""
}

function compareSortValues(left: PrimitiveSortValue, right: PrimitiveSortValue) {
  if (left == null && right == null) {
    return 0
  }

  if (left == null) {
    return -1
  }

  if (right == null) {
    return 1
  }

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime()
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right
  }

  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right)
  }

  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" })
}

function getPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, totalPages]
  }

  if (currentPage >= totalPages - 2) {
    return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, currentPage - 1, currentPage, currentPage + 1, totalPages]
}

export function CommonList<TData>({
  header,
  search,
  filters,
  table,
  footer,
  pagination,
}: CommonListProps<TData>) {
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(
    () => table.columns.filter((column) => column.defaultVisible !== false).map((column) => column.id)
  )
  const [sortState, setSortState] = useState<SortState | null>(null)

  const defaultVisibleColumnIds = useMemo(
    () => table.columns.filter((column) => column.defaultVisible !== false).map((column) => column.id),
    [table.columns],
  )
  const visibleColumns = table.columns.filter((column) =>
    (visibleColumnIds.length > 0 ? visibleColumnIds : defaultVisibleColumnIds).includes(column.id),
  )
  const fallbackColumns = visibleColumns.length > 0 ? visibleColumns : table.columns.slice(0, 1)
  const sortColumn = sortState ? table.columns.find((column) => column.id === sortState.columnId) : undefined

  const sortedData = sortColumn && sortColumn.sortable
    ? [...table.data].sort((left, right) => {
        const leftValue = sortColumn.accessor ? sortColumn.accessor(left) : undefined
        const rightValue = sortColumn.accessor ? sortColumn.accessor(right) : undefined
        const comparison = compareSortValues(leftValue, rightValue)
        return sortState?.direction === "asc" ? comparison : -comparison
      })
    : table.data

  const derivedActiveFilters: CommonListActiveFilter[] = search?.value.trim()
    ? [{ key: "__search__", label: "Search", value: search.value.trim() }]
    : []
  const activeFilters = [...derivedActiveFilters, ...(filters?.activeFilters ?? [])]

  const pageSizeOptions = pagination?.pageSizeOptions?.length ? pagination.pageSizeOptions : DEFAULT_PAGE_SIZE_OPTIONS
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.totalRecords / pagination.pageSize)) : 1
  const pageNumbers = pagination ? getPageNumbers(pagination.currentPage, totalPages) : []
  const paginationStart = pagination && pagination.totalRecords > 0
    ? (pagination.currentPage - 1) * pagination.pageSize + 1
    : 0
  const paginationEnd = pagination
    ? Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)
    : sortedData.length

  const showSearchSection = Boolean(search || (filters?.options && filters.options.length > 0) || table.columns.length > 1)
  const showActiveFilters = activeFilters.length > 0
  const hasRows = sortedData.length > 0

  const handleSort = (column: CommonListColumn<TData>) => {
    if (!column.sortable) {
      return
    }

    setSortState((current) => {
      if (!current || current.columnId !== column.id) {
        return { columnId: column.id, direction: "asc" }
      }

      if (current.direction === "asc") {
        return { columnId: column.id, direction: "desc" }
      }

      return null
    })
  }

  const handleRemoveFilter = (key: string) => {
    if (key === "__search__") {
      search?.onChange("")
      return
    }

    filters?.onRemoveFilter?.(key)
  }

  const handleClearAllFilters = () => {
    if (search?.value) {
      search.onChange("")
    }

    filters?.onClearAllFilters?.()
  }

  return (
    <div className="space-y-4 ">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between px-3">
        <div className="space-y-1">
          {/*<h1 className="text-2xl font-semibold tracking-tight text-foreground/80">{header.pageTitle}</h1>*/}
          <p className="max-w-3xl text-sm text-muted-foreground/80">{header.pageDescription}</p>
        </div>
        {header.addLabel && header.onAddClick ? (
          <Button
            type="button"
            className="h-9 shrink-0 cursor-pointer gap-2 self-start rounded-md px-3 lg:mt-1 lg:mr-2"
            onClick={header.onAddClick}
            disabled={header.addDisabled}
          >
            <PlusIcon className="size-4" />
            <span>{header.addLabel}</span>
          </Button>
        ) : null}
      </section>

      {showSearchSection ? (
        <section className="bg-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search?.value ?? ""}
                onChange={(event) => search?.onChange(event.target.value)}
                placeholder={search?.placeholder ?? "Search records"}
                className="h-10 rounded-md pr-3 pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {filters?.options && filters.options.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="gap-2 rounded-md">
                      <FunnelIcon className="size-4" />
                      <span>{filters.buttonLabel ?? "Filters"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuGroup>
                      <div className="flex items-center justify-between px-1.5 py-1">
                        <DropdownMenuLabel className="p-0">Filter options</DropdownMenuLabel>
                        <button
                          type="button"
                          className="text-xs font-medium text-primary transition hover:text-primary/80"
                          onClick={handleClearAllFilters}
                        >
                          Clear
                        </button>
                      </div>
                      <DropdownMenuSeparator />
                      {filters.options.map((option) => (
                        <DropdownMenuCheckboxItem
                          key={option.key}
                          checked={Boolean(option.isActive)}
                          onCheckedChange={(checked) => {
                            if (option.onCheckedChange) {
                              option.onCheckedChange(checked)
                              return
                            }

                            option.onSelect()
                          }}
                        >
                          {option.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              {table.columns.length > 1 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="gap-2 rounded-md">
                      <SlidersHorizontalIcon className="size-4" />
                      <span>Columns</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuGroup>
                      <div className="flex items-center justify-between px-1.5 py-1">
                        <DropdownMenuLabel className="p-0">Visible columns</DropdownMenuLabel>
                        <button
                          type="button"
                          className="text-xs font-medium text-primary transition hover:text-primary/80"
                          onClick={() => {
                            setVisibleColumnIds(table.columns.map((column) => column.id))
                          }}
                        >
                          Show all
                        </button>
                      </div>
                      <DropdownMenuSeparator />
                      {table.columns.map((column) => {
                        const activeVisibleColumnIds = visibleColumnIds.length > 0 ? visibleColumnIds : defaultVisibleColumnIds
                        const isVisible = activeVisibleColumnIds.includes(column.id)
                        const disableToggle = isVisible && activeVisibleColumnIds.length === 1

                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            checked={isVisible}
                            disabled={disableToggle}
                            onCheckedChange={(checked) => {
                              setVisibleColumnIds((current) => {
                                const nextCurrent = current.length > 0 ? current : defaultVisibleColumnIds
                                if (checked) {
                                  return nextCurrent.includes(column.id) ? nextCurrent : [...nextCurrent, column.id]
                                }

                                if (nextCurrent.length === 1) {
                                  return nextCurrent
                                }

                                return nextCurrent.filter((id) => id !== column.id)
                              })
                            }}
                          >
                            {column.header}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {showActiveFilters ? (
        <section className="rounded-md border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <Badge key={filter.key} variant="secondary" className="h-auto gap-2 rounded-md px-3 py-1 text-xs">
                  <span>{filter.label}: {filter.value}</span>
                  <button
                    type="button"
                    className="rounded-full text-muted-foreground transition hover:text-foreground"
                    onClick={() => handleRemoveFilter(filter.key)}
                    aria-label={`Remove filter ${filter.label}`}
                  >
                    <XIcon className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Button type="button" variant="ghost" className="h-8 justify-start rounded-md px-0 text-sm sm:px-3" onClick={handleClearAllFilters}>
              Clear all filters
            </Button>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-md border bg-card shadow-sm">
        <Table className="min-w-full">
          <TableHeader className="bg-muted">
            <TableRow className="sticky top-0 z-10 hover:bg-muted">
              {fallbackColumns.map((column) => {
                const isSorted = sortState?.columnId === column.id

                return (
                  <TableHead key={column.id} className={cn("px-4 py-3", getStickyClass(column.sticky, "header"), column.headerClassName)}>
                    {column.sortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-left font-medium text-foreground transition hover:text-primary"
                        onClick={() => handleSort(column)}
                      >
                        <span>{column.header}</span>
                        {isSorted ? (
                          sortState?.direction === "asc" ? <ArrowUpIcon className="size-4" /> : <ArrowDownIcon className="size-4" />
                        ) : (
                          <ArrowUpDownIcon className="size-4 text-muted-foreground" />
                        )}
                      </button>
                    ) : (
                      <span className="font-medium text-foreground">{column.header}</span>
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {table.loading && !hasRows ? (
              <TableRow>
                <TableCell colSpan={fallbackColumns.length} className="px-4 py-10 text-center text-muted-foreground">
                  <div className="space-y-3">
                    <div className="mx-auto h-3 w-40 animate-pulse rounded-full bg-muted" />
                    <div className="space-y-2">
                      {Array.from({ length: 5 }, (_, index) => (
                        <div key={index} className="h-10 animate-pulse rounded-md bg-muted/70" />
                      ))}
                    </div>
                    <span className="block text-sm">{table.loadingMessage ?? "Loading records..."}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : hasRows ? (
              sortedData.map((row, index) => (
                <TableRow key={table.rowKey ? table.rowKey(row, index) : index}>
                  {fallbackColumns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn("px-4 py-3 align-top text-muted-foreground", getStickyClass(column.sticky), column.className)}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={fallbackColumns.length} className="px-4 py-10 text-center text-muted-foreground">
                  {table.emptyMessage ?? "No records found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      {!pagination ? (
        <section className="rounded-md border bg-card px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div>
              {footer?.content ?? (
                <span>
                  Total records: <span className="font-medium text-foreground">{sortedData.length}</span>
                </span>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {pagination ? (
        <section className="rounded-md border bg-card px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex items-center gap-3 text-sm text-muted-foreground md:gap-4">
              <div className="hidden shrink-0 md:block">
                {footer?.content ?? (
                  <span>
                    Total records: <span className="font-medium text-foreground">{pagination.totalRecords}</span>
                  </span>
                )}
              </div>
              <span className="shrink-0">Rows per page</span>
              <select
                value={String(pagination.pageSize)}
                onChange={(event) => pagination.onPageSizeChange(Number(event.target.value))}
                className="h-8 min-w-20 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={String(option)}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-start gap-4 md:justify-end">
              <span className="hidden shrink-0 text-sm text-muted-foreground md:block">
                  Showing <span className="font-medium text-foreground">{paginationStart}</span> to{" "}
                  <span className="font-medium text-foreground">{paginationEnd}</span> of{" "}
                  <span className="font-medium text-foreground">{pagination.totalRecords}</span>
              </span>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent className="flex-nowrap items-center justify-end gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={cn(pagination.currentPage <= 1 && "pointer-events-none opacity-50")}
                    onClick={(event) => {
                      event.preventDefault()
                      if (pagination.currentPage > 1) {
                        pagination.onPageChange(pagination.currentPage - 1)
                      }
                    }}
                  />
                </PaginationItem>

                {pageNumbers.map((pageNumber, index) => {
                  const previousPage = pageNumbers[index - 1]
                  const showGap = previousPage && pageNumber - previousPage > 1

                  return (
                    <div key={pageNumber} className="flex items-center">
                      {showGap ? (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : null}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          isActive={pageNumber === pagination.currentPage}
                          onClick={(event) => {
                            event.preventDefault()
                            pagination.onPageChange(pageNumber)
                          }}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    </div>
                  )
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className={cn(pagination.currentPage >= totalPages && "pointer-events-none opacity-50")}
                    onClick={(event) => {
                      event.preventDefault()
                      if (pagination.currentPage < totalPages) {
                        pagination.onPageChange(pagination.currentPage + 1)
                      }
                    }}
                  />
                </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
