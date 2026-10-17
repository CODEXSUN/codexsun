import { WorkspaceHeaderActions, useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";
import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { WorkOrderForm } from "./work-order.form";
import { useWorkOrders } from "./work-order.hooks";
import { WorkOrderList, workOrderColumns, isProtectedWorkOrder } from "./work-order.list";
import {
  createWorkOrder,
  forceDeleteWorkOrder,
  setWorkOrderActive,
  updateWorkOrder
} from "./work-order.services";
import type { WorkOrderRecord, WorkOrderSavePayload } from "./work-order.types";

const workOrderFilterOptions = [
  { id: "all", label: "All work orders" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" }
];

export function WorkOrderWorkspace() {
  const listTools = useWorkspaceListTools(
    Object.fromEntries(workOrderColumns.map((column) => [column.id, column.label]))
  );

  const queryClient = useQueryClient();
  const [search, setSearch] = useWorkspaceQueryValue("q", "");
  const [statusFilter, setStatusFilter] = useWorkspaceQueryValue("status", "all");
  const [page, setPage] = useWorkspaceQueryValue("page", 1);
  const [rowsPerPage, setRowsPerPage] = useWorkspaceQueryValue("pageSize", 100);
  const [editing, setLocalEditing] = useState<WorkOrderRecord | null | undefined>(undefined);
  const query = useWorkOrders(search);
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = "/app/core/master/work-order";
  function setEditing(record: WorkOrderRecord | null | undefined) {
    setLocalEditing(record);
    const path =
      record === undefined
        ? basePath
        : record === null
          ? `${basePath}/new`
          : `${basePath}/${encodeURIComponent(record.id)}/edit`;
    if (location.pathname !== path) void navigate({ to: path, search: location.search });
  }
  useEffect(() => {
    const tail = location.pathname.slice(basePath.length).split("/").filter(Boolean);
    if (tail.length === 0) {
      setLocalEditing(undefined);
      return;
    }
    if (tail[0] === "new" && tail.length === 1) {
      setLocalEditing(null);
      return;
    }
    if (tail.length > 2 || (tail[1] && tail[1] !== "edit")) return;
    let id: string;
    try {
      id = decodeURIComponent(tail[0]!);
    } catch {
      return;
    }
    const record = query.data?.find((entry) => String(entry.id) === id);
    setLocalEditing((current) =>
      current && record && current.id === record.id ? current : record
    );
  }, [location.pathname, query.data]);
  const save = useMutation({
    mutationFn: (payload: WorkOrderSavePayload) =>
      editing ? updateWorkOrder(editing.id, payload) : createWorkOrder(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["core", "work-order", "list"] });
      toast.success("Work order saved");
      setEditing(undefined);
    },
    onError: (error) =>
      toast.error("Unable to save work order", {
        description: error instanceof Error ? error.message : "Please try again."
      })
  });
  const rowAction = useMutation({
    mutationFn: ({ record, type }: { record: WorkOrderRecord; type: "delete" | "toggle" }) =>
      type === "delete"
        ? forceDeleteWorkOrder(record.id)
        : setWorkOrderActive(record.id, !record.isActive),
    onSuccess: async (record, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["core", "work-order", "list"] });
      toast.success(
        variables.type === "delete" ? "Work order force deleted" : "Work order status updated",
        { description: record.name }
      );
    },
    onError: (error) =>
      toast.error("Unable to update work order", {
        description: error instanceof Error ? error.message : "Please try again."
      })
  });
  const rows = query.data ?? [];
  const filteredRows = useMemo(
    () =>
      rows
        .filter((record) =>
          listTools.matches({
            ...record,
            isActive: record.isActive ? "active" : "inactive",
            status: record.isActive ? "active" : "inactive"
          })
        )
        .filter((record) => {
          if (statusFilter === "active") return record.isActive;
          if (statusFilter === "inactive") return !record.isActive;
          return true;
        }),
    [rows, statusFilter, JSON.stringify(listTools.filters)]
  );
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (editing !== undefined) {
    return (
      <WorkOrderForm
        error={save.error instanceof Error ? save.error.message : ""}
        existingRecords={rows}
        loading={save.isPending}
        record={editing}
        onBack={() => setEditing(undefined)}
        onSubmit={(payload) => save.mutate(payload)}
      />
    );
  }

  return (
    <WorkspacePage title="" className="w-full max-w-none py-0 lg:w-full lg:py-0">
      <WorkspaceHeaderActions>
        <Button className="h-9 rounded-md" onClick={() => setEditing(null)}>
          <Plus className="size-4" />
          New work order
        </Button>
      </WorkspaceHeaderActions>
      <WorkspaceFilters
        toolbarAction={listTools.toolbarAction}
        columnOptions={listTools.columnOptions}
        onShowAllColumns={listTools.onShowAllColumns}
        showSelectedFilterChip
        filterOptions={workOrderFilterOptions.map((option) => ({
          ...option,
          count: rows.filter(
            (record) =>
              option.id === "all" || (record.isActive ? "active" : "inactive") === option.id
          ).length
        }))}
        filterValue={statusFilter}
        searchPlaceholder="Search code or work order"
        searchValue={search}
        onFilterValueChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onSearchValueChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />
      <WorkOrderList
        listTools={listTools}
        loading={query.isFetching && !query.data}
        records={pageRows}
        onEdit={(record) => {
          if (!isProtectedWorkOrder(record)) setEditing(record);
        }}
        onForceDelete={(record) => {
          if (window.confirm(`Force delete ${record.name}? This cannot be undone.`))
            rowAction.mutate({ record, type: "delete" });
        }}
        onToggle={(record) => rowAction.mutate({ record, type: "toggle" })}
      />
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filteredRows.length)}
        singularLabel="work order"
        totalCount={filteredRows.length}
        totalPages={totalPages}
        onNextPage={() => setPage((value) => Math.min(totalPages, value + 1))}
        onPageChange={setPage}
        onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(1);
        }}
      />
    </WorkspacePage>
  );
}
