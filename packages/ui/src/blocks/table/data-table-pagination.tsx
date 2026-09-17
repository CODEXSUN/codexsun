import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@codexsun/ui/components/select'
import { cn } from '@codexsun/ui/lib/utils'

export function DataTablePagination({
  className,
  firstRow,
  itemLabel,
  lastRow,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions,
  totalItems,
  totalPages,
}: {
  className?: string
  firstRow: number
  itemLabel: string
  lastRow: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  page: number
  pageSize: number
  pageSizeOptions: readonly number[]
  totalItems: number
  totalPages: number
}) {
  return (
    <footer
      className={cn(
        'flex flex-col gap-3 rounded-md border bg-card px-4 py-2 text-sm shadow-sm lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
        <span>
          Total {itemLabel}: <strong className="font-semibold text-foreground">{totalItems}</strong>
        </span>
        <span>Rows per page</span>
        <Select
          items={pageSizeOptions.map((size) => ({ label: String(size), value: String(size) }))}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          value={String(pageSize)}
        >
          <SelectTrigger className="w-20" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectGroup>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-1 lg:justify-end">
        <span className="mr-2 whitespace-nowrap text-muted-foreground">
          Showing {firstRow} to {lastRow} of {totalItems}
        </span>
        <Button
          className="px-2 text-muted-foreground"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          size="sm"
          variant="ghost"
        >
          <ChevronLeft />
          Previous
        </Button>
        {buildPageItems(page, totalPages).map((item, index) =>
          item === 'ellipsis' ? (
            <span className="px-1.5 text-muted-foreground" key={`ellipsis-${index}`}>
              …
            </span>
          ) : (
            <Button
              className="min-w-8 px-2"
              key={item}
              onClick={() => onPageChange(item)}
              size="sm"
              variant={item === page ? 'default' : 'ghost'}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          className="px-2 text-muted-foreground"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          size="sm"
          variant="ghost"
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </footer>
  )
}

function buildPageItems(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1)
  const candidates = [1, page - 1, page, page + 1, totalPages]
  const pages = [...new Set(candidates.filter((item) => item >= 1 && item <= totalPages))]
  const result: Array<number | 'ellipsis'> = []
  pages.forEach((item, index) => {
    if (index > 0 && item - pages[index - 1]! > 1) result.push('ellipsis')
    result.push(item)
  })
  return result
}
