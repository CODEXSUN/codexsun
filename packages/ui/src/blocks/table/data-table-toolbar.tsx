import type { ReactNode } from 'react'
import { Columns3, Search } from 'lucide-react'
import { DropdownMenu, DropdownMenuCheckboxItem } from '@codexsun/ui/components/dropdown-menu'
import { Input } from '@codexsun/ui/components/input'
import { DataTableIconMenuTrigger } from './data-table-icon-menu-trigger'
import { DataTableMenuContent, dataTableMenuOptionClass } from './data-table-menu-content'

export type DataTableColumnControl = {
  id: string
  label: string
  onVisibleChange: (visible: boolean) => void
  visible: boolean
}

export function DataTableToolbar({
  columns,
  filters,
  onSearchChange,
  search,
  searchPlaceholder,
}: {
  columns: DataTableColumnControl[]
  filters?: ReactNode
  onSearchChange: (value: string) => void
  search: string
  searchPlaceholder: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-card p-2 shadow-sm sm:flex-row sm:items-center">
      <label className="relative w-full min-w-0 sm:max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <span className="sr-only">{searchPlaceholder}</span>
        <Input
          className="h-8 pl-9"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          value={search}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        {filters}
        <DropdownMenu>
          <DataTableIconMenuTrigger label="Columns">
            <Columns3 />
          </DataTableIconMenuTrigger>
          <DataTableMenuContent
            actionLabel="Show all"
            onAction={() => columns.forEach((column) => column.onVisibleChange(true))}
            title="Visible columns"
          >
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                checked={column.visible}
                className={dataTableMenuOptionClass}
                key={column.id}
                onCheckedChange={(visible) => column.onVisibleChange(Boolean(visible))}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DataTableMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
