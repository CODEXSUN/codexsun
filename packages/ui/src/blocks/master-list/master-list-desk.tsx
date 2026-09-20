import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDownWideNarrow,
  ChevronDown,
  Ellipsis,
  List,
  Monitor,
  PauseCircle,
  Pencil,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@codexsun/ui/components/button';
import { Checkbox } from '@codexsun/ui/components/checkbox';
import { Input } from '@codexsun/ui/components/input';
import { DataTableRowActions } from '@codexsun/ui/blocks/table';
import { cn } from '@codexsun/ui/lib/utils';

export type MasterListDeskFilter = {
  id: string;
  label: string;
  operator?: boolean;
};

export type MasterListDeskColumn<TRecord> = {
  id: string;
  label: string;
  render: (record: TRecord) => ReactNode;
  width?: string;
};

export type MasterListDeskRecord = {
  age?: string;
  commentCount?: number;
  favorite?: boolean;
  id: string;
};

export type MasterListDeskProps<TRecord extends MasterListDeskRecord> = {
  columns: readonly MasterListDeskColumn<TRecord>[];
  filters: readonly MasterListDeskFilter[];
  records: readonly TRecord[];
  title: string;
  primaryActionLabel: string;
  getFilterValue: (record: TRecord, filterId: string) => string;
  filterPlacement?: 'top' | 'columns';
  onPrimaryAction?: () => void;
  onEdit?: (record: TRecord) => void;
  onDelete?: (record: TRecord) => void;
  onSuspend?: (record: TRecord) => void;
  onRefresh?: () => void;
  sortLabel?: string;
  totalLabel?: string;
};

export function MasterListDesk<TRecord extends MasterListDeskRecord>({
  columns,
  filters,
  records,
  title,
  primaryActionLabel,
  getFilterValue,
  filterPlacement = 'top',
  onPrimaryAction,
  onEdit,
  onDelete,
  onSuspend,
  onRefresh,
  sortLabel = 'Last Updated',
  totalLabel,
}: MasterListDeskProps<TRecord>) {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [pageSize, setPageSize] = useState(20);
  const visibleRecords = useMemo(
    () =>
      records.filter((record) =>
        filters.every((filter) => {
          const query = filterValues[filter.id]?.trim().toLowerCase();
          return !query || getFilterValue(record, filter.id).toLowerCase().includes(query);
        }),
      ),
    [filterValues, filters, getFilterValue, records],
  );
  const gridTemplateColumns = `32px ${columns.map((column) => column.width ?? 'minmax(140px, 1fr)').join(' ')} 52px`;
  const allSelected = visibleRecords.length > 0 && visibleRecords.every(({ id }) => selectedIds.has(id));
  const activeFilterCount = Object.values(filterValues).filter((value) => value.trim()).length;

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(visibleRecords.map(({ id }) => id)) : new Set());
  }

  function toggleRecord(recordId: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(recordId);
      else next.delete(recordId);
      return next;
    });
  }

  return (
    <section className="w-full bg-background text-sm">
      <header className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex items-center gap-2 font-semibold">
          <Monitor className="size-4 text-muted-foreground" />
          <span aria-hidden="true">/</span>
          <h2>{title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary">
            <List />
            List View
            <ChevronDown />
          </Button>
          <Button size="sm" variant="secondary">
            Saved Filters
            <ChevronDown />
          </Button>
          <Button aria-label="Refresh list" onClick={onRefresh} size="icon-sm" variant="secondary">
            <RefreshCw />
          </Button>
          <Button aria-label="More list actions" size="icon-sm" variant="secondary">
            <Ellipsis />
          </Button>
          <Button onClick={onPrimaryAction} size="sm">
            <Plus />
            {primaryActionLabel}
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3 p-3">
        {filterPlacement === 'top' ? (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
              {filters.map((filter) => (
                <div className="relative" key={filter.id}>
                  <Input
                    aria-label={filter.label}
                    className="h-8 rounded-sm border-transparent bg-muted pr-8 shadow-none focus-visible:bg-background"
                    onChange={(event) =>
                      setFilterValues((current) => ({ ...current, [filter.id]: event.target.value }))
                    }
                    value={filterValues[filter.id] ?? ''}
                  />
                  {filter.operator ? (
                    <SlidersHorizontal className="pointer-events-none absolute right-2 top-2 size-4 text-muted-foreground" />
                  ) : null}
                </div>
              ))}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="secondary">
                <SlidersHorizontal />
                Filter{activeFilterCount ? ` ${activeFilterCount}` : ''}
              </Button>
              {activeFilterCount ? (
                <Button
                  aria-label="Clear all filters"
                  onClick={() => setFilterValues({})}
                  size="icon-sm"
                  variant="secondary"
                >
                  <X />
                </Button>
              ) : null}
              <Button size="sm" variant="secondary">
                <ArrowDownWideNarrow />
                {sortLabel}
                <ChevronDown />
              </Button>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto border-y border-border/70">
          <div className="min-w-[1180px]">
            <div
              aria-label="Table header"
              className="grid min-h-8 items-center border-b border-border bg-muted px-2 text-sm text-muted-foreground"
              role="row"
              style={{ gridTemplateColumns }}
            >
              <Checkbox aria-label="Select all" checked={allSelected} onCheckedChange={toggleAll} />
              {columns.map((column) => (
                <span className="truncate px-2" key={column.id}>
                  {column.label}
                </span>
              ))}
              <span aria-label={`${visibleRecords.length} of ${totalLabel ?? records.length}`} />
            </div>
            {filterPlacement === 'columns' ? (
              <div
                aria-label="Column filters"
                className="grid min-h-10 items-center border-t border-border/60 bg-background px-2"
                data-row="filters"
                role="row"
                style={{ gridTemplateColumns }}
              >
                <span aria-hidden="true" />
                {columns.map((column) => {
                  const filter = filters.find((candidate) => candidate.id === column.id);
                  return (
                    <div className="min-w-0 px-2" key={column.id}>
                      {filter ? (
                        <Input
                          aria-label={filter.label}
                          className="h-7 rounded-sm border-transparent bg-muted px-2 text-xs shadow-none focus-visible:bg-background"
                          onChange={(event) =>
                            setFilterValues((current) => ({ ...current, [filter.id]: event.target.value }))
                          }
                          value={filterValues[filter.id] ?? ''}
                        />
                      ) : null}
                    </div>
                  );
                })}
                <span aria-hidden="true" />
              </div>
            ) : null}
            {visibleRecords.map((record) => (
              <div
                className="grid min-h-10 items-center border-t border-border/60 px-2 hover:bg-muted/70"
                key={record.id}
                role="row"
                style={{ gridTemplateColumns }}
              >
                <Checkbox
                  aria-label={`Select ${record.id}`}
                  checked={selectedIds.has(record.id)}
                  onCheckedChange={(checked) => toggleRecord(record.id, checked)}
                />
                {columns.map((column, index) => (
                  <div
                    className={cn('truncate px-2 text-muted-foreground', index === 0 && 'font-medium text-foreground')}
                    key={column.id}
                  >
                    {column.render(record)}
                  </div>
                ))}
                <DataTableRowActions
                  actions={[
                    { id: 'edit', label: 'Edit', icon: <Pencil />, onSelect: () => onEdit?.(record) },
                    {
                      id: 'suspend',
                      label: 'Suspend',
                      icon: <PauseCircle />,
                      onSelect: () => onSuspend?.(record),
                    },
                    {
                      id: 'delete',
                      label: 'Delete',
                      icon: <Trash2 />,
                      onSelect: () => onDelete?.(record),
                      separatorBefore: true,
                      tone: 'destructive',
                    },
                  ]}
                  label={`Actions for ${record.id}`}
                />
              </div>
            ))}
            {!visibleRecords.length ? (
              <p className="p-8 text-center text-muted-foreground">No records match these filters.</p>
            ) : null}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1" aria-label="Rows per page">
            {[20, 100, 500, 2500].map((size) => (
              <Button
                aria-pressed={pageSize === size}
                key={size}
                onClick={() => setPageSize(size)}
                size="xs"
                variant={pageSize === size ? 'secondary' : 'ghost'}
              >
                {size}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="secondary">
            Load More
          </Button>
        </footer>
      </div>
    </section>
  );
}
