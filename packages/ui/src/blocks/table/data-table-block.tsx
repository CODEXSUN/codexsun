import * as React from 'react'
import {
  columnVisibilityFeature,
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  FlexRender,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type ColumnVisibilityState,
  type PaginationState,
  type RowData,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@codexsun/ui/components/table'
import { cn } from '@codexsun/ui/lib/utils'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'

export const dataTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
})

export type DataTableColumn<TData extends RowData> = ColumnDef<
  typeof dataTableFeatures,
  TData,
  unknown
>

export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<typeof dataTableFeatures, TData>()
}

export type DataTableBlockProps<TData extends RowData> = {
  columns: DataTableColumn<TData>[]
  data: TData[]
  description?: string
  emptyMessage: string
  getRowId: (row: TData) => string
  getSearchText: (row: TData) => string
  layout?: 'page' | 'section'
  primaryAction?: React.ReactNode
  defaultPageSize?: number
  itemLabel?: string
  pageSizeOptions?: readonly number[]
  searchPlaceholder?: string
  showSerialNumber?: boolean
  summary?: React.ReactNode
  tableFooter?: React.ReactNode
  title?: string
  toolbarFilters?: React.ReactNode
  withPagination?: boolean
  withToolbar?: boolean
}

export function DataTableBlock<TData extends RowData>({
  columns,
  data,
  description,
  emptyMessage,
  getRowId,
  getSearchText,
  primaryAction,
  defaultPageSize = 10,
  itemLabel = 'records',
  layout = 'page',
  pageSizeOptions = [10, 25, 50, 100],
  searchPlaceholder = 'Search',
  showSerialNumber = true,
  summary,
  tableFooter,
  title,
  toolbarFilters,
  withPagination = true,
  withToolbar = true,
}: DataTableBlockProps<TData>) {
  const [search, setSearch] = React.useState('')
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({})
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })
  const visibleData = React.useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase()
    return normalized
      ? data.filter((row) => getSearchText(row).toLocaleLowerCase().includes(normalized))
      : data
  }, [data, getSearchText, search])
  const table = useTable({
    columns,
    data: visibleData,
    getRowId,
    state: { columnVisibility, pagination },
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    features: dataTableFeatures,
  })
  const pageCount = Math.max(table.getPageCount(), 1)
  const firstRow = visibleData.length ? pagination.pageIndex * pagination.pageSize + 1 : 0
  const lastRow = Math.min((pagination.pageIndex + 1) * pagination.pageSize, visibleData.length)

  function updateSearch(value: string) {
    setSearch(value)
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  const isSection = layout === 'section'

  return (
    <section
      className={cn(
        'w-full',
        isSection ? 'overflow-hidden rounded-lg border bg-card' : 'space-y-4',
      )}
    >
      {title || description || primaryAction ? (
        <header
          className={cn(
            'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
            isSection && 'border-b px-4 py-3',
          )}
        >
          <div className="min-w-0">
            {title ? (
              <h2
                className={cn('font-semibold tracking-tight', isSection ? 'text-sm' : 'text-2xl')}
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {primaryAction ? (
            <div className="flex shrink-0 items-center gap-2">{primaryAction}</div>
          ) : null}
        </header>
      ) : null}
      {withToolbar ? (
        <div className={cn(isSection && 'border-b p-2')}>
          <DataTableToolbar
            columns={table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => ({
                id: column.id,
                label:
                  typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
                onVisibleChange: (visible: boolean) => column.toggleVisibility(visible),
                visible: column.getIsVisible(),
              }))}
            filters={toolbarFilters}
            onSearchChange={updateSearch}
            search={search}
            searchPlaceholder={searchPlaceholder}
          />
        </div>
      ) : null}
      <div className={cn('overflow-hidden', !isSection && 'rounded-md border bg-card shadow-sm')}>
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {showSerialNumber ? (
                  <TableHead className="h-11 w-12 min-w-12 max-w-12 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    #
                  </TableHead>
                ) : null}
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className={cn(
                      'h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                      getUtilityColumnClass(header.column.id),
                    )}
                    key={header.id}
                    colSpan={header.colSpan}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        className="flex items-center gap-1 text-left font-medium hover:text-foreground"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <FlexRender header={header} />
                      </button>
                    ) : (
                      <FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, rowIndex) => (
                <TableRow className="hover:bg-muted/60" key={row.id}>
                  {showSerialNumber ? (
                    <TableCell className="w-12 min-w-12 max-w-12 text-center tabular-nums text-muted-foreground">
                      {pagination.pageIndex * pagination.pageSize + rowIndex + 1}
                    </TableCell>
                  ) : null}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell className={getUtilityColumnClass(cell.column.id)} key={cell.id}>
                      <FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-36 text-center text-sm text-muted-foreground"
                  colSpan={table.getVisibleLeafColumns().length + (showSerialNumber ? 1 : 0)}
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {summary}
      {tableFooter ? <footer className="border-t p-3">{tableFooter}</footer> : null}
      {withPagination ? (
        <DataTablePagination
          firstRow={firstRow}
          itemLabel={itemLabel}
          lastRow={lastRow}
          onPageChange={(page) => table.setPageIndex(page - 1)}
          onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
          page={pagination.pageIndex + 1}
          pageSize={pagination.pageSize}
          pageSizeOptions={pageSizeOptions}
          totalItems={visibleData.length}
          totalPages={pageCount}
        />
      ) : null}
    </section>
  )
}

function getUtilityColumnClass(columnId: string) {
  return columnId === 'action' || columnId === 'actions'
    ? 'w-14 min-w-14 max-w-14 text-right'
    : undefined
}
