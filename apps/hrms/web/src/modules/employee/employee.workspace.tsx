import { useDeferredValue, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@codexsun/ui/components/select";
import { WorkspaceFormBanner, WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import { buildShowingLabel, formatDate } from "@codexsun/ui/workspace/utils";
import { EmployeeList, employeeColumns } from "./employee.list";
import { employeeQueryKey, useEmployees } from "./employee.hooks";
import { EmployeeShow } from "./employee.show";
import { EmployeeUpsertPage } from "./employee.upsert";
import { employeeRouteFromPath } from "./employee.routing";
import type { EmployeeGateway } from "./employee.services";
import type {
  EmployeeAction,
  EmployeeColumnFilters,
  EmployeeColumnKey,
  EmployeeFilters,
  EmployeeRecord
} from "./employee.types";

export function EmployeeWorkspace({ gateway }: { gateway: EmployeeGateway }) {
  const location = useLocation();
  const route = employeeRouteFromPath(location.pathname);
  return route.mode === "list" ? (
    <EmployeeListWorkspace gateway={gateway} />
  ) : (
    <EmployeeUpsertPage
      key={route.mode === "edit" ? route.id : "new"}
      gateway={gateway}
      route={route}
    />
  );
}

function EmployeeListWorkspace({ gateway }: { gateway: EmployeeGateway }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<EmployeeFilters>({
    search: "",
    status: "all",
    deleted: false
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [showInlineFilters, setShowInlineFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<EmployeeColumnFilters>({});
  const [view, setView] = useState<EmployeeRecord | null>(null);
  const [confirmation, setConfirmation] = useState<{
    employee: EmployeeRecord;
    action: EmployeeAction;
  } | null>(null);
  const deferredSearch = useDeferredValue(filters.search);
  const deferredColumnFilters = useDeferredValue(columnFilters);
  const query = useEmployees(gateway, { ...filters, search: deferredSearch });
  const lifecycle = useMutation({
    mutationFn: ({ employee, action }: { employee: EmployeeRecord; action: EmployeeAction }) => {
      if (action === "status")
        return gateway.setStatus(employee.id, employee.status === "active" ? "inactive" : "active");
      if (action === "restore") return gateway.restore(employee.id);
      if (action === "forceDelete") return gateway.forceDelete(employee.id);
      return gateway.remove(employee.id);
    },
    onSuccess: async () => {
      setConfirmation(null);
      setView(null);
      await client.invalidateQueries({ queryKey: employeeQueryKey });
      toast.success("Employee updated");
    },
    onError: (error) => toast.error(error.message)
  });
  const openEdit = (employee: EmployeeRecord) => {
    setView(null);
    void navigate({
      to: "/app/$",
      params: { _splat: `hrms/employees/${encodeURIComponent(employee.id)}/edit` }
    });
  };
  const updateFilters = (next: Partial<EmployeeFilters>) => {
    setPage(1);
    setFilters((current) => ({ ...current, ...next }));
  };
  const setColumnFilter = (column: EmployeeColumnKey, value: string) => {
    setColumnFilters((current) => ({ ...current, [column]: value }));
    setPage(1);
  };
  const entries = (query.data ?? []).filter((employee) =>
    matchesColumnFilters(employee, deferredColumnFilters)
  );
  const totalPages = Math.max(1, Math.ceil(entries.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const activeColumnFilters = Object.values(columnFilters).filter((value) => value?.trim()).length;
  return (
    <WorkspacePage title="" className="pt-0 lg:pt-0" technicalName="page.hrms.employee.list">
      <WorkspaceFilters
        searchValue={filters.search}
        searchPlaceholder="Search code, name, email or department"
        onSearchValueChange={(search) => updateFilters({ search })}
        columnOptions={employeeColumns.map((column) => ({
          ...column,
          checked: visibleColumns[column.id] !== false,
          onCheckedChange: (checked) => {
            setVisibleColumns((current) => ({ ...current, [column.id]: checked }));
            if (!checked) {
              setColumnFilters((current) => {
                const next = { ...current };
                delete next[column.id];
                return next;
              });
              setPage(1);
            }
          }
        }))}
        onShowAllColumns={() => setVisibleColumns({})}
        filterValue={filters.status}
        showSelectedFilterChip
        filterOptions={[
          { id: "all", label: "All statuses" },
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" }
        ]}
        onFilterValueChange={(value) =>
          updateFilters({ status: value === "active" || value === "inactive" ? value : "all" })
        }
        toolbarAction={
          <>
            <Select
              value={filters.deleted ? "deleted" : "current"}
              onValueChange={(value) => updateFilters({ deleted: value === "deleted" })}
            >
              <SelectTrigger
                aria-label="Employee list"
                className="h-8 w-40 rounded-md border-border/80 bg-white text-sm shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current employees</SelectItem>
                <SelectItem value="deleted">Deleted employees</SelectItem>
              </SelectContent>
            </Select>
            <Button
              aria-label="Toggle column search filters"
              title="Toggle column search filters"
              aria-pressed={showInlineFilters}
              className="h-8 min-w-8 gap-1 px-2"
              variant={showInlineFilters ? "default" : "outline"}
              onClick={() => setShowInlineFilters((open) => !open)}
            >
              <SlidersHorizontal className="size-4" />
              {activeColumnFilters > 0 && <span className="text-xs">{activeColumnFilters}</span>}
            </Button>
          </>
        }
      />
      {query.isError && (
        <WorkspaceFormBanner title="Employees could not be loaded">
          {query.error.message}
        </WorkspaceFormBanner>
      )}
      <EmployeeList
        entries={entries.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)}
        loading={query.isPending}
        busy={lifecycle.isPending}
        visibleColumns={visibleColumns}
        showInlineFilters={showInlineFilters}
        columnFilters={columnFilters}
        onColumnFilterChange={setColumnFilter}
        onHideInlineFilters={() => setShowInlineFilters(false)}
        onView={setView}
        onEdit={openEdit}
        onAction={(employee, action) => {
          lifecycle.reset();
          setConfirmation({ employee, action });
        }}
      />
      {totalPages > 1 && (
        <WorkspacePagination
          page={currentPage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[20, 50, 100]}
          totalPages={totalPages}
          totalCount={entries.length}
          singularLabel="employee"
          showingLabel={buildShowingLabel(currentPage, rowsPerPage, entries.length)}
          onPageChange={setPage}
          onNextPage={() => setPage(currentPage + 1)}
          onPreviousPage={() => setPage(currentPage - 1)}
          onRowsPerPageChange={(value) => {
            setPage(1);
            setRowsPerPage(value);
          }}
        />
      )}
      <EmployeeShow
        employee={view}
        gateway={gateway}
        onClose={() => setView(null)}
        onEdit={openEdit}
      />
      <WorkspaceUpsertDialog
        open={Boolean(confirmation)}
        title="Confirm employee action"
        onClose={() => {
          if (!lifecycle.isPending) setConfirmation(null);
        }}
      >
        {confirmation && (
          <div className="space-y-4">
            <p>
              {confirmation.action === "forceDelete"
                ? "Permanently delete"
                : confirmation.action === "remove"
                  ? "Move to deleted employees:"
                  : confirmation.action === "restore"
                    ? "Restore"
                    : confirmation.employee.status === "active"
                      ? "Suspend"
                      : "Activate"}{" "}
              {confirmation.employee.employeeCode} · {confirmation.employee.name}?
            </p>
            {confirmation.action === "forceDelete" && (
              <p className="text-sm text-muted-foreground">
                This cannot be undone. Activity history is retained.
              </p>
            )}
            {lifecycle.error && (
              <WorkspaceFormBanner title="Employee could not be updated">
                {lifecycle.error.message}
              </WorkspaceFormBanner>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={lifecycle.isPending}
                onClick={() => setConfirmation(null)}
              >
                Cancel
              </Button>
              <Button disabled={lifecycle.isPending} onClick={() => lifecycle.mutate(confirmation)}>
                Confirm
              </Button>
            </div>
          </div>
        )}
      </WorkspaceUpsertDialog>
    </WorkspacePage>
  );
}
function matchesColumnFilters(employee: EmployeeRecord, filters: EmployeeColumnFilters) {
  return employeeColumns.every(({ id }) => {
    const term = filters[id]?.trim().toLocaleLowerCase();
    if (!term) return true;
    const value =
      id === "joiningDate"
        ? employee.joiningDate
          ? formatDate(employee.joiningDate)
          : ""
        : id === "status" && employee.deletedAt
          ? "Deleted"
          : id === "userName"
            ? `${employee.userName ?? "Not mapped"} ${employee.userEmail ?? ""}`
            : (employee[id] ?? "");
    return String(value).toLocaleLowerCase().includes(term);
  });
}
