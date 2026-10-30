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
import { designationQueryKey, useDesignations } from "./designation.hooks";
import { DesignationList, designationListColumns, type DesignationAction } from "./designation.list";
import { designationRouteFromPath } from "./designation.routing";
import { DesignationShow } from "./designation.show";
import { DesignationUpsertPage } from "./designation.upsert";
import type { DesignationGateway } from "./designation.services";
import type { DesignationFilters, DesignationRecord } from "./designation.types";

export function DesignationWorkspace({ gateway }: { gateway: DesignationGateway }) {
  const location = useLocation();
  const route = designationRouteFromPath(location.pathname);
  return route.mode === "list" ? (
    <DesignationListWorkspace gateway={gateway} />
  ) : (
    <DesignationUpsertPage
      key={route.mode === "edit" ? route.id : "new"}
      gateway={gateway}
      route={route}
    />
  );
}

function DesignationListWorkspace({ gateway }: { gateway: DesignationGateway }) {
  const listTools = useWorkspaceListTools(designationListColumns);
  const client = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useWorkspaceQueryState<DesignationFilters>({
    search: "",
    status: "all",
    deleted: false
  });
  const [page, setPage] = useWorkspaceQueryValue("page", 1);
  const [rowsPerPage, setRowsPerPage] = useWorkspaceQueryValue("pageSize", 20);
  const [view, setView] = useState<DesignationRecord | null>(null);
  const [confirmation, setConfirmation] = useState<{
    designation: DesignationRecord;
    action: "remove" | "forceDelete";
  } | null>(null);
  const deferredSearch = useDeferredValue(filters.search);
  const query = useDesignations(gateway, { ...filters, search: deferredSearch });
  const openEdit = (designation: DesignationRecord) => {
    setView(null);
    void navigate({
      to: "/app/$",
      params: { _splat: `hrms/designations/${encodeURIComponent(designation.id)}/edit` }
    });
  };
  const lifecycle = useMutation({
    mutationFn: ({
      designation,
      action
    }: {
      designation: DesignationRecord;
      action: DesignationAction;
    }) => {
      if (action === "activate" || action === "deactivate")
        return gateway.setStatus(designation.id, action === "activate" ? "active" : "inactive");
      if (action === "restore") return gateway.restore(designation.id);
      if (action === "forceDelete") return gateway.forceDelete(designation.id);
      return gateway.remove(designation.id);
    },
    onSuccess: async () => {
      setConfirmation(null);
      setView(null);
      await client.invalidateQueries({ queryKey: designationQueryKey });
      toast.success("Designation updated");
    },
    onError: (error) => toast.error("Unable to update designation", { description: error.message })
  });
  const entries = (query.data ?? []).filter((record) => listTools.matches(record));
  const totalPages = Math.max(1, Math.ceil(entries.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const updateFilters = (next: Partial<DesignationFilters>) => {
    setPage(1);
    setFilters((current) => ({ ...current, ...next }));
  };

  return (
    <WorkspacePage variant="list"
      title="Designations"
      description="Manage the designations used by employee records."
      technicalName="page.hrms.designation.list"
      actions={
        <Button
          onClick={() =>
            void navigate({ to: "/app/$", params: { _splat: "hrms/designations/new" } })
          }
        >
          <Plus className="size-4" /> New designation
        </Button>
      }
    >
      <WorkspaceFilters
        columnOptions={listTools.columnOptions}
        onShowAllColumns={listTools.onShowAllColumns}
        searchValue={filters.search}
        searchPlaceholder="Search designation name or description"
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
              aria-label="Designation list"
              className="h-8 w-40 rounded-md border-border/80 bg-white text-sm shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current designations</SelectItem>
              <SelectItem value="deleted">Deleted designations</SelectItem>
            </SelectContent>
          </Select></>
        }
      />
      {query.isError && (
        <WorkspaceFormBanner title="Designations could not be loaded">
          {query.error.message}
        </WorkspaceFormBanner>
      )}
      <DesignationList
        listTools={listTools}        entries={entries.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)}
        loading={query.isPending}
        onView={setView}
        onEdit={openEdit}
        onAction={(designation, action) => {
          if (action === "remove" || action === "forceDelete") {
            setConfirmation({ designation, action });
            return;
          }
          lifecycle.mutate({ designation, action });
        }}
      />
      {totalPages > 1 && (
        <WorkspacePagination
          page={currentPage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[20, 50, 100]}
          totalPages={totalPages}
          totalCount={entries.length}
          singularLabel="designation"
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
      <DesignationShow
        designation={view}
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
                ? "Permanently delete designation?"
                : "Delete designation?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.designation.name}{" "}
              {confirmation?.action === "forceDelete"
                ? "will be permanently deleted. This cannot be undone."
                : "will move to deleted designations."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={lifecycle.isPending}
              onClick={() =>
                confirmation &&
                lifecycle.mutate({
                  designation: confirmation.designation,
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
