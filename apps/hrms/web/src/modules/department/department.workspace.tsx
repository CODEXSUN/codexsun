import { useWorkspaceQueryValue, useWorkspaceQueryState } from "@codexsun/ui/workspace/navigation";
import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useDeferredValue, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@codexsun/ui/components/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@codexsun/ui/components/select";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { departmentQueryKey, useDepartments } from "./department.hooks";
import { DepartmentList, departmentListColumns, type DepartmentAction } from "./department.list";
import { departmentRouteFromPath } from "./department.routing";
import { DepartmentShow } from "./department.show";
import { DepartmentUpsertPage } from "./department.upsert";
import type { DepartmentGateway } from "./department.services";
import type { DepartmentFilters, DepartmentRecord } from "./department.types";

export function DepartmentWorkspace({ gateway }: { gateway: DepartmentGateway }) {
  const location = useLocation();
  const route = departmentRouteFromPath(location.pathname);
  return route.mode === "list" ? (
    <DepartmentListWorkspace gateway={gateway} />
  ) : (
    <DepartmentUpsertPage
      key={route.mode === "edit" ? route.id : "new"}
      gateway={gateway}
      route={route}
    />
  );
}

function DepartmentListWorkspace({ gateway }: { gateway: DepartmentGateway }) {
  const listTools = useWorkspaceListTools(departmentListColumns);
  const client = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useWorkspaceQueryState<DepartmentFilters>({
    search: "",
    status: "all",
    deleted: false
  });
  const [page, setPage] = useWorkspaceQueryValue("page", 1);
  const [rowsPerPage, setRowsPerPage] = useWorkspaceQueryValue("pageSize", 20);
  const [view, setView] = useState<DepartmentRecord | null>(null);
  const [confirmation, setConfirmation] = useState<{
    department: DepartmentRecord;
    action: "remove" | "forceDelete";
  } | null>(null);
  const deferredSearch = useDeferredValue(filters.search);
  const query = useDepartments(gateway, { ...filters, search: deferredSearch });
  const openEdit = (department: DepartmentRecord) => {
    setView(null);
    void navigate({
      to: "/app/$",
      params: { _splat: `hrms/departments/${encodeURIComponent(department.id)}/edit` }
    });
  };
  const lifecycle = useMutation({
    mutationFn: ({
      department,
      action
    }: {
      department: DepartmentRecord;
      action: DepartmentAction;
    }) => {
      if (action === "activate" || action === "deactivate")
        return gateway.setStatus(department.id, action === "activate" ? "active" : "inactive");
      if (action === "restore") return gateway.restore(department.id);
      if (action === "forceDelete") return gateway.forceDelete(department.id);
      return gateway.remove(department.id);
    },
    onSuccess: async () => {
      setConfirmation(null);
      setView(null);
      await client.invalidateQueries({ queryKey: departmentQueryKey });
      toast.success("Department updated");
    },
    onError: (error) => toast.error("Unable to update department", { description: error.message })
  });
  const entries = (query.data ?? []).filter((record) => listTools.matches(record));
  const totalPages = Math.max(1, Math.ceil(entries.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const updateFilters = (next: Partial<DepartmentFilters>) => {
    setPage(1);
    setFilters((current) => ({ ...current, ...next }));
  };

  return (
    <WorkspacePage variant="list"
      title="Departments"
      description="Manage the departments used by employee records."
      technicalName="page.hrms.department.list"
      actions={
        <Button
          onClick={() =>
            void navigate({ to: "/app/$", params: { _splat: "hrms/departments/new" } })
          }
        >
          <Plus className="size-4" /> New department
        </Button>
      }
    >
      <WorkspaceFilters
        columnOptions={listTools.columnOptions}
        onShowAllColumns={listTools.onShowAllColumns}
        searchValue={filters.search}
        searchPlaceholder="Search department name or description"
        onSearchValueChange={(search) => updateFilters({ search })}
        filterValue={filters.status}
        showSelectedFilterChip
        filterOptions={[
          { id: "all", label: "All statuses" },
          { id: "active", label: "Active", count: (query.data ?? []).filter((record) => record.status === "active").length },
          { id: "inactive", label: "Inactive", count: (query.data ?? []).filter((record) => record.status === "inactive").length }
        ]}
        onFilterValueChange={(status) =>
          updateFilters({ status: status === "active" || status === "inactive" ? status : "all" })
        }
        toolbarAction={
          <>{listTools.toolbarAction}          <Select
            value={filters.deleted ? "deleted" : "current"}
            onValueChange={(value) => updateFilters({ deleted: value === "deleted" })}
          >
            <SelectTrigger
              aria-label="Department list"
              className="h-8 w-40 rounded-md border-border/80 bg-white text-sm shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current departments</SelectItem>
              <SelectItem value="deleted">Deleted departments</SelectItem>
            </SelectContent>
          </Select></>
        }
      />
      {query.isError && (
        <WorkspaceFormBanner title="Departments could not be loaded">
          {query.error.message}
        </WorkspaceFormBanner>
      )}
      <DepartmentList
        listTools={listTools}        entries={entries.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)}
        loading={query.isPending}
        onView={setView}
        onEdit={openEdit}
        onAction={(department, action) => {
          if (action === "remove" || action === "forceDelete") {
            setConfirmation({ department, action });
            return;
          }
          lifecycle.mutate({ department, action });
        }}
      />
      {totalPages > 1 && (
        <WorkspacePagination
          page={currentPage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[20, 50, 100]}
          totalPages={totalPages}
          totalCount={entries.length}
          singularLabel="department"
          showingLabel={`Showing ${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, entries.length)} of ${entries.length}`}
          onPageChange={setPage}
          onNextPage={() => setPage(currentPage + 1)}
          onPreviousPage={() => setPage(currentPage - 1)}
          onRowsPerPageChange={(value) => {
            setPage(1);
            setRowsPerPage(value);
          }}
        />
      )}
      <DepartmentShow
        department={view}
        gateway={gateway}
        onClose={() => setView(null)}
        onEdit={openEdit}
      />
      <AlertDialog
        open={Boolean(confirmation)}
        onOpenChange={(open) => !open && setConfirmation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmation?.action === "forceDelete"
                ? "Permanently delete department?"
                : "Delete department?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.department.name}{" "}
              {confirmation?.action === "forceDelete"
                ? "will be permanently deleted. This cannot be undone."
                : "will move to deleted departments."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={lifecycle.isPending}
              onClick={() =>
                confirmation &&
                lifecycle.mutate({
                  department: confirmation.department,
                  action: confirmation.action
                })
              }
            >
              {confirmation?.action === "forceDelete" ? "Permanently delete" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspacePage>
  );
}
