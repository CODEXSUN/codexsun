import * as React from 'react';
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
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@codexsun/ui/components/table';
import { cn } from '@codexsun/ui/lib/utils';
import { TopologyRegion, type InterfaceTopologyController } from '@codexsun/ui/features/interface-topology';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar';

export const dataTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
});

export type DataTableColumn<TData extends RowData> = ColumnDef<typeof dataTableFeatures, TData, unknown>;

export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<typeof dataTableFeatures, TData>();
}

export type DataTableBlockProps<TData extends RowData> = {
  columns: DataTableColumn<TData>[];
  data: TData[];
  description?: string;
  emptyMessage: string;
  getRowId: (row: TData) => string;
  getSearchText: (row: TData) => string;
  filterOptions?: readonly { label: string; value: string }[];
  getFilterValue?: (row: TData) => string;
  layout?: 'page' | 'section';
  primaryAction?: React.ReactNode;
  pageWidth?: 'full' | 'wide';
  defaultPageSize?: number;
  itemLabel?: string;
  pageSizeOptions?: readonly number[];
  searchPlaceholder?: string;
  showSerialNumber?: boolean;
  summary?: React.ReactNode;
  tableFooter?: React.ReactNode;
  title?: string;
  toolbarFilters?: React.ReactNode;
  withPagination?: boolean;
  withToolbar?: boolean;
  topology?: InterfaceTopologyController;
  topologyIds?: {
    header: string;
    search: string;
    content: string;
    pagination: string;
    searchBar?: string;
    columnFilter?: string;
    rowHeader?: string;
    rows?: string;
    pageSize?: string;
    pageNavigation?: string;
  };
};

export function DataTableBlock<TData extends RowData>({
  columns,
  data,
  description,
  emptyMessage,
  getRowId,
  getSearchText,
  filterOptions,
  getFilterValue,
  primaryAction,
  pageWidth = 'wide',
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
  topology,
  topologyIds,
}: DataTableBlockProps<TData>) {
  const [search, setSearch] = React.useState('');
  const [filterValue, setFilterValue] = React.useState('');
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });
  const visibleData = React.useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    return data.filter((row) => {
      const matchesSearch = !normalized || getSearchText(row).toLocaleLowerCase().includes(normalized);
      const matchesFilter = !filterValue || !getFilterValue || getFilterValue(row) === filterValue;
      return matchesSearch && matchesFilter;
    });
  }, [data, filterValue, getFilterValue, getSearchText, search]);
  const table = useTable({
    columns,
    data: visibleData,
    getRowId,
    state: { columnVisibility, pagination },
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    features: dataTableFeatures,
  });
  const pageCount = Math.max(table.getPageCount(), 1);
  const firstRow = visibleData.length ? pagination.pageIndex * pagination.pageSize + 1 : 0;
  const lastRow = Math.min((pagination.pageIndex + 1) * pagination.pageSize, visibleData.length);

  function updateSearch(value: string) {
    setSearch(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  const isSection = layout === 'section';

  function renderRegion(id: string, content: React.ReactNode) {
    return topology ? (
      <TopologyRegion as="div" id={id} topology={topology}>
        {content}
      </TopologyRegion>
    ) : (
      content
    );
  }

  const header =
    title || description || primaryAction ? (
      <header
        className={cn(
          'flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between',
          isSection && 'px-4 py-3',
          topologyIds?.header === '27.1.1' && 'h-12 pb-0',
        )}
      >
        <div className="min-w-0">
          {title ? (
            <h2 className={cn('font-semibold tracking-tight', isSection ? 'text-sm' : 'text-2xl')}>{title}</h2>
          ) : null}
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {primaryAction ? <div className="flex shrink-0 items-center gap-2 sm:justify-end">{primaryAction}</div> : null}
      </header>
    ) : null;

  const searchRegion = withToolbar ? (
    <div className={cn(isSection && 'border-b p-2')}>
      <DataTableToolbar
        columns={table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => ({
            id: column.id,
            label: typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
            onVisibleChange: (visible: boolean) => column.toggleVisibility(visible),
            visible: column.getIsVisible(),
          }))}
        filters={toolbarFilters}
        onSearchChange={updateSearch}
        search={search}
        searchPlaceholder={searchPlaceholder}
        topology={topology}
        topologyIds={{ columnFilter: topologyIds?.columnFilter, searchBar: topologyIds?.searchBar }}
        filterOptions={filterOptions}
        filterValue={filterValue}
        onFilterChange={(value) => {
          setFilterValue(value);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        }}
      />
    </div>
  ) : null;

  const content = (
    <div
      className={cn(
        'overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:h-0',
        !isSection && 'rounded-md border bg-card shadow-sm',
      )}
    >
      <Table>
        <TableHeader
          className="bg-muted data-[ito-highlighted=true]:outline data-[ito-highlighted=true]:outline-2 data-[ito-highlighted=true]:outline-violet-600"
          {...(topology && topologyIds?.rowHeader ? topology.regionProps(topologyIds.rowHeader) : {})}
        >
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
        <TableBody
          className="data-[ito-highlighted=true]:outline data-[ito-highlighted=true]:outline-2 data-[ito-highlighted=true]:outline-violet-600"
          {...(topology && topologyIds?.rows ? topology.regionProps(topologyIds.rows) : {})}
        >
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
  );

  const paginationContent = withPagination ? (
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
      topology={topology}
      topologyIds={{ pageNavigation: topologyIds?.pageNavigation, pageSize: topologyIds?.pageSize }}
    />
  ) : null;

  return (
    <section
      className={cn(
        isSection ? 'w-full' : pageWidth === 'wide' ? 'mx-auto w-full lg:w-[90%]' : 'w-full',
        isSection ? 'overflow-hidden rounded-lg border bg-card' : 'space-y-4',
      )}
    >
      {header ? renderRegion(topologyIds?.header ?? 'data-table-header', header) : null}
      {searchRegion ? renderRegion(topologyIds?.search ?? 'data-table-search', searchRegion) : null}
      {renderRegion(topologyIds?.content ?? 'data-table-content', content)}
      {summary}
      {tableFooter ? <footer className="border-t p-3">{tableFooter}</footer> : null}
      {paginationContent ? renderRegion(topologyIds?.pagination ?? 'data-table-pagination', paginationContent) : null}
    </section>
  );
}

function getUtilityColumnClass(columnId: string) {
  return columnId === 'action' || columnId === 'actions'
    ? 'w-14 min-w-14 max-w-14 text-center [&>button]:mx-auto [&>div]:mx-auto [&>svg]:mx-auto'
    : undefined;
}
