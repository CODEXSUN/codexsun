import { useDeferredValue, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { buildShowingLabel } from "@codexsun/ui/workspace";
import { ActivitiesList, activityColumns } from "./activities.list";
import { useActivities, useActivityStatuses } from "./activities.hooks";
import type { ActivityColumnFilter, ActivityFilters } from "./activities.types";

export function ActivitiesWorkspace({ onOpenEnquiry }: { onOpenEnquiry: (id: number) => void }) {
  const [filters, setFilters] = useState<ActivityFilters>({
    page: 1,
    pageSize: 50,
    search: "",
    contact: "",
    enquiry: "",
    allocatedTo: "",
    listIn: "",
    status: "",
    action: "",
    actor: ""
  });
  const [showInlineFilters, setShowInlineFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const deferredFilters = useDeferredValue(filters);
  const query = useActivities(deferredFilters);
  const statuses = useActivityStatuses();
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const updateFilters = (patch: Partial<ActivityFilters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  return (
    <WorkspacePage variant="list" title="" technicalName="page.crm.activities.list" className="pt-0 lg:pt-0">
      <WorkspaceFilters
        searchPlaceholder="Search activities, contacts, or enquiry ID"
        searchValue={filters.search}
        onSearchValueChange={(search) => updateFilters({ search })}
        filterValue={filters.status || "all"}
        onFilterValueChange={(status) => updateFilters({ status: status === "all" ? "" : status })}
        filterOptions={[
          { id: "all", label: "All statuses" },
          ...(statuses.data ?? []).map((status) => ({
            id: status.code ?? status.name.toLowerCase(),
            label: status.name
          }))
        ]}
        columnOptions={activityColumns.map((column) => ({
          ...column,
          checked: visibleColumns[column.id] !== false,
          onCheckedChange: (checked: boolean) =>
            setVisibleColumns((current) => ({ ...current, [column.id]: checked }))
        }))}
        onShowAllColumns={() => setVisibleColumns({})}
        toolbarAction={
          <Button
            aria-label="Toggle column search filters"
            aria-pressed={showInlineFilters}
            className="h-8 min-w-8 px-2"
            title="Toggle column search filters"
            type="button"
            variant={showInlineFilters ? "default" : "outline"}
            onClick={() => setShowInlineFilters((open) => !open)}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        }
      />
      {query.error ? (
        <p role="alert" className="text-sm text-destructive">
          {query.error.message}
        </p>
      ) : null}
      {statuses.error ? (
        <p role="alert" className="text-sm text-destructive">
          Status filters could not load.
        </p>
      ) : null}
      <ActivitiesList
        records={query.data?.items ?? []}
        loading={query.isLoading}
        filters={filters}
        showInlineFilters={showInlineFilters}
        visibleColumns={visibleColumns}
        onFilterChange={(column: ActivityColumnFilter, value) => updateFilters({ [column]: value })}
        onHideInlineFilters={() => setShowInlineFilters(false)}
        onOpenEnquiry={onOpenEnquiry}
      />
      {totalPages > 1 ? (
        <WorkspacePagination
          page={Math.min(filters.page, totalPages)}
          rowsPerPage={filters.pageSize}
          rowsPerPageOptions={[20, 50, 100]}
          showingLabel={buildShowingLabel(
            Math.min(filters.page, totalPages),
            filters.pageSize,
            total
          )}
          singularLabel="activity"
          totalCount={total}
          totalPages={totalPages}
          onNextPage={() => updateFilters({ page: Math.min(totalPages, filters.page + 1) })}
          onPageChange={(page) => updateFilters({ page })}
          onPreviousPage={() => updateFilters({ page: Math.max(1, filters.page - 1) })}
          onRowsPerPageChange={(pageSize) => updateFilters({ pageSize })}
        />
      ) : null}
    </WorkspacePage>
  );
}
