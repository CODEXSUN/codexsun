import type { ReactNode } from 'react';
import { Columns3, Filter, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuCheckboxItem } from '@codexsun/ui/components/dropdown-menu';
import { Input } from '@codexsun/ui/components/input';
import { DataTableIconMenuTrigger } from './data-table-icon-menu-trigger';
import { DataTableMenuContent, dataTableMenuOptionClass } from './data-table-menu-content';
import { TopologyRegion, type InterfaceTopologyController } from '@codexsun/ui/features/interface-topology';

export type DataTableColumnControl = {
  id: string;
  label: string;
  onVisibleChange: (visible: boolean) => void;
  visible: boolean;
};

export function DataTableToolbar({
  columns,
  filters,
  onSearchChange,
  search,
  searchPlaceholder,
  topology,
  topologyIds,
  filterOptions,
  filterValue,
  onFilterChange,
}: {
  columns: DataTableColumnControl[];
  filters?: ReactNode;
  onSearchChange: (value: string) => void;
  search: string;
  searchPlaceholder: string;
  topology?: InterfaceTopologyController;
  topologyIds?: { searchBar?: string; columnFilter?: string };
  filterOptions?: readonly { label: string; value: string }[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
}) {
  const searchBar = (
    <label className="relative w-full min-w-0 sm:max-w-3xl">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <span className="sr-only">{searchPlaceholder}</span>
      <Input
        className="h-8 pl-9"
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        value={search}
      />
    </label>
  );
  const filterMenu =
    filterOptions?.length && onFilterChange ? (
      <DropdownMenu>
        <DataTableIconMenuTrigger active={Boolean(filterValue)} label="Filter">
          <Filter />
        </DataTableIconMenuTrigger>
        <DataTableMenuContent actionLabel="Clear" onAction={() => onFilterChange('')} title="Filter options">
          <DropdownMenuCheckboxItem
            checked={!filterValue}
            className={dataTableMenuOptionClass}
            onCheckedChange={() => onFilterChange('')}
          >
            All records
          </DropdownMenuCheckboxItem>
          {filterOptions.map((option) => (
            <DropdownMenuCheckboxItem
              checked={filterValue === option.value}
              className={dataTableMenuOptionClass}
              key={option.value}
              onCheckedChange={() => onFilterChange(option.value)}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DataTableMenuContent>
      </DropdownMenu>
    ) : null;
  const columnFilter = (
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
  );

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-card p-2 shadow-sm sm:flex-row sm:items-center">
      {topology && topologyIds?.searchBar ? (
        <TopologyRegion as="div" className="w-full min-w-0 sm:max-w-3xl" id={topologyIds.searchBar} topology={topology}>
          {searchBar}
        </TopologyRegion>
      ) : (
        searchBar
      )}
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        {filters}
        {filterMenu}
        {topology && topologyIds?.columnFilter ? (
          <TopologyRegion as="div" id={topologyIds.columnFilter} topology={topology}>
            {columnFilter}
          </TopologyRegion>
        ) : (
          columnFilter
        )}
      </div>
    </div>
  );
}
