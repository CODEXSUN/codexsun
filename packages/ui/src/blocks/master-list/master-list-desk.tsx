import { useMemo, useState, type HTMLAttributes, type ReactNode } from "react";
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
} from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import { Input } from "@codexsun/ui/components/input";
import { DataTableRowActions } from "@codexsun/ui/blocks/table";
import { TopologyRegion, type InterfaceTopologyController } from "@codexsun/ui/features/interface-topology";
import { cn } from "@codexsun/ui/lib/utils";

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
  filterPlacement?: "top" | "columns";
  onPrimaryAction?: () => void;
  onEdit?: (record: TRecord) => void;
  onDelete?: (record: TRecord) => void;
  onSuspend?: (record: TRecord) => void;
  onRefresh?: () => void;
  sortLabel?: string;
  totalLabel?: string;
  topology?: InterfaceTopologyController;
  topologyIds?: {
    content?: string;
    deskFilters?: string;
    filterActions?: string;
    filterRow?: string;
    header?: string;
    loadMore?: string;
    newButton?: string;
    pagination?: string;
    rowHeader?: string;
    rows?: string;
    title?: string;
  };
};

function DeskRegion({
  as = "div",
  children,
  className,
  id,
  topology,
  ...props
}: {
  as?: "div" | "header" | "footer" | "h2";
  children: ReactNode;
  className?: string;
  id?: string;
  topology?: InterfaceTopologyController;
} & Omit<HTMLAttributes<HTMLElement>, "id">) {
  if (topology && id) {
    return (
      <TopologyRegion as={as} className={className} id={id} topology={topology} {...props}>
        {children}
      </TopologyRegion>
    );
  }
  const Component = as;
  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
}

export function MasterListDesk<TRecord extends MasterListDeskRecord>({
  columns,
  filters,
  records,
  title,
  primaryActionLabel,
  getFilterValue,
  filterPlacement = "top",
  onPrimaryAction,
  onEdit,
  onDelete,
  onSuspend,
  onRefresh,
  sortLabel = "Last Updated",
  totalLabel,
  topology,
  topologyIds,
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
  const gridTemplateColumns = `32px ${columns.map((column) => column.width ?? "minmax(140px, 1fr)").join(" ")} 52px`;
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
      <DeskRegion
        as="header"
        className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b px-3 py-2"
        id={topologyIds?.header}
        topology={topology}
      >
        <DeskRegion
          as="h2"
          className="flex items-center gap-2 font-semibold"
          id={topologyIds?.title}
          topology={topology}
        >
          <Monitor className="size-4 text-muted-foreground" />
          <span aria-hidden="true">/</span>
          {title}
        </DeskRegion>
        <DeskRegion className="flex flex-wrap items-center gap-2" id={topologyIds?.newButton} topology={topology}>
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
        </DeskRegion>
      </DeskRegion>

      <div className="flex flex-col gap-3 p-3">
        {filterPlacement === "top" ? (
          <DeskRegion
            className="flex flex-wrap items-start justify-between gap-3"
            id={topologyIds?.deskFilters}
            topology={topology}
          >
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
              {filters.map((filter) => (
                <div className="relative" key={filter.id}>
                  <Input
                    aria-label={filter.label}
                    className="h-8 rounded-sm border-transparent bg-muted pr-8 shadow-none focus-visible:bg-background"
                    onChange={(event) =>
                      setFilterValues((current) => ({ ...current, [filter.id]: event.target.value }))
                    }
                    value={filterValues[filter.id] ?? ""}
                  />
                  {filter.operator ? (
                    <SlidersHorizontal className="pointer-events-none absolute right-2 top-2 size-4 text-muted-foreground" />
                  ) : null}
                </div>
              ))}
            </div>
            <DeskRegion className="flex shrink-0 gap-2" id={topologyIds?.filterActions} topology={topology}>
              <Button size="sm" variant="secondary">
                <SlidersHorizontal />
                Filter{activeFilterCount ? ` ${activeFilterCount}` : ""}
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
            </DeskRegion>
          </DeskRegion>
        ) : null}

        <DeskRegion className="overflow-x-auto border-y border-border/70" id={topologyIds?.content} topology={topology}>
          <div className="min-w-[1180px]">
            <DeskRegion
              className="grid min-h-8 items-center border-b border-border bg-muted px-2 text-sm text-muted-foreground"
              aria-label="Table header"
              id={topologyIds?.rowHeader}
              topology={topology}
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
            </DeskRegion>
            {filterPlacement === "columns" ? (
              <DeskRegion
                aria-label="Column filters"
                className="grid min-h-10 items-center border-t border-border/60 bg-background px-2"
                data-row="filters"
                id={topologyIds?.filterRow}
                topology={topology}
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
                          value={filterValues[filter.id] ?? ""}
                        />
                      ) : null}
                    </div>
                  );
                })}
                <span aria-hidden="true" />
              </DeskRegion>
            ) : null}
            <DeskRegion id={topologyIds?.rows} topology={topology}>
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
                      className={cn(
                        "truncate px-2 text-muted-foreground",
                        index === 0 && "font-medium text-foreground",
                      )}
                      key={column.id}
                    >
                      {column.render(record)}
                    </div>
                  ))}
                  <DataTableRowActions
                    actions={[
                      { id: "edit", label: "Edit", icon: <Pencil />, onSelect: () => onEdit?.(record) },
                      {
                        id: "suspend",
                        label: "Suspend",
                        icon: <PauseCircle />,
                        onSelect: () => onSuspend?.(record),
                      },
                      {
                        id: "delete",
                        label: "Delete",
                        icon: <Trash2 />,
                        onSelect: () => onDelete?.(record),
                        separatorBefore: true,
                        tone: "destructive",
                      },
                    ]}
                    label={`Actions for ${record.id}`}
                  />
                </div>
              ))}
            </DeskRegion>
            {!visibleRecords.length ? (
              <p className="p-8 text-center text-muted-foreground">No records match these filters.</p>
            ) : null}
          </div>
        </DeskRegion>

        <DeskRegion
          as="footer"
          className="flex items-center justify-between gap-3"
          id={topologyIds?.pagination}
          topology={topology}
        >
          <div className="flex items-center gap-1" aria-label="Rows per page">
            {[20, 100, 500, 2500].map((size) => (
              <Button
                aria-pressed={pageSize === size}
                key={size}
                onClick={() => setPageSize(size)}
                size="xs"
                variant={pageSize === size ? "secondary" : "ghost"}
              >
                {size}
              </Button>
            ))}
          </div>
          <DeskRegion id={topologyIds?.loadMore} topology={topology}>
            <Button size="sm" variant="secondary">
              Load More
            </Button>
          </DeskRegion>
        </DeskRegion>
      </div>
    </section>
  );
}
