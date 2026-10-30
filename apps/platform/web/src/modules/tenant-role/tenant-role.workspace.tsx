import { useLocation, useNavigate } from "@tanstack/react-router";
import { WorkspaceHeaderActions, useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";
import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { TenantRoleForm } from "./tenant-role.form";
import { useTenantRoleMutations, useTenantRolesQuery } from "./tenant-role.hooks";
import { TenantRoleList, tenantRoleListColumns } from "./tenant-role.list";
import type { TenantRole, TenantRoleSavePayload } from "./tenant-role.types";
type PendingAction = { record: TenantRole; type: "force-delete" | "restore" | "suspend" };
export function TenantRoleWorkspace() {
  const listTools = useWorkspaceListTools(tenantRoleListColumns);

  const query = useTenantRolesQuery();
  const mutations = useTenantRoleMutations();
  const [search, setSearch] = useWorkspaceQueryValue("q", "");
  const [status, setStatus] = useWorkspaceQueryValue("status", "all");
  const [page, setPage] = useWorkspaceQueryValue("page", 1);
  const [rowsPerPage, setRowsPerPage] = useWorkspaceQueryValue("pageSize", 100);
  const [editing, setLocalEditing] = useState<TenantRole | null | undefined>(undefined);
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = "/app/application/access/roles";
  function setEditing(record: TenantRole | null | undefined) {
    setLocalEditing(record);
    const path =
      record === undefined
        ? basePath
        : record === null
          ? `${basePath}/new`
          : `${basePath}/${record.id}/edit`;
    if (location.pathname !== path) void navigate({ to: path, search: location.search });
  }
  useEffect(() => {
    const tail = location.pathname.slice(basePath.length).split("/").filter(Boolean);
    if (!tail.length) setLocalEditing(undefined);
    else if (tail[0] === "new" && tail.length === 1) setLocalEditing(null);
    else if (tail.length === 2 && tail[1] === "edit") {
      const record = query.data?.find((item) => String(item.id) === tail[0]);
      if (record) setLocalEditing((current) => (current?.id === record.id ? current : record));
    }
  }, [location.pathname, query.data]);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data ?? [])
      .filter((record) => listTools.matches(record))
      .filter(
        (record) =>
          (status === "all" || record.status === status) &&
          (!term ||
            record.label.toLowerCase().includes(term) ||
            record.key.toLowerCase().includes(term) ||
            record.description.toLowerCase().includes(term))
      );
  }, [query.data, search, status, JSON.stringify(listTools.filters)]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const records = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  useEffect(() => {
    if (query.data && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const saveError = mutations.create.error ?? mutations.update.error;
  async function save(value: TenantRoleSavePayload) {
    try {
      const record = editing
        ? await mutations.update.mutateAsync({ id: editing.id, payload: value })
        : await mutations.create.mutateAsync(value);
      toast.success(`Role ${editing ? "updated" : "created"}`, { description: record.label });
      setEditing(undefined);
    } catch {}
  }
  async function act(action: PendingAction) {
    try {
      const record =
        action.type === "force-delete"
          ? await mutations.forceDelete.mutateAsync(action.record)
          : action.type === "restore"
            ? await mutations.activate.mutateAsync(action.record)
            : await mutations.deactivate.mutateAsync(action.record);
      toast.success(
        action.type === "force-delete"
          ? "Role permanently deleted"
          : action.type === "restore"
            ? "Role restored"
            : "Role suspended",
        { description: record.label }
      );
      setPendingAction(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The role action failed.");
    }
  }
  return (
    <WorkspacePage
      title=""
      className="w-full max-w-none py-0 lg:w-full lg:py-0"
      technicalName="page.application.access.roles"
    >
      <WorkspaceHeaderActions>
        {editing === undefined ? (
          <Button className="h-9 rounded-md" onClick={() => setEditing(null)} type="button">
            <Plus className="size-4" />
            New role
          </Button>
        ) : null}
      </WorkspaceHeaderActions>
      <div className="space-y-4" hidden={editing !== undefined}>
        <WorkspaceFilters
          toolbarAction={listTools.toolbarAction}
          columnOptions={listTools.columnOptions}
          onShowAllColumns={listTools.onShowAllColumns}
          showSelectedFilterChip
          filterOptions={[
            { id: "all", label: "All roles" },
            {
              id: "active",
              label: "Active",
              count: (query.data ?? []).filter((record) => record.status === "active").length
            },
            {
              id: "inactive",
              label: "Inactive",
              count: (query.data ?? []).filter((record) => record.status === "inactive").length
            }
          ]}
          filterValue={status}
          onFilterValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          onSearchValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search roles"
          searchValue={search}
        />
        <TenantRoleList
          listTools={listTools}
          loading={query.isFetching && !query.data}
          onEdit={setEditing}
          onForceDelete={(record) => setPendingAction({ record, type: "force-delete" })}
          onRestore={(record) => setPendingAction({ record, type: "restore" })}
          onSuspend={(record) => setPendingAction({ record, type: "suspend" })}
          records={records}
        />
        <WorkspacePagination
          page={currentPage}
          rowsPerPage={rowsPerPage}
          showingLabel={buildShowingLabel(currentPage, rowsPerPage, filtered.length)}
          singularLabel="role"
          totalCount={filtered.length}
          totalPages={totalPages}
          onNextPage={() => setPage((value) => Math.min(totalPages, value + 1))}
          onPageChange={setPage}
          onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setPage(1);
          }}
        />
      </div>
      <TenantRoleForm
        {...(saveError instanceof Error ? { error: saveError.message } : {})}
        loading={mutations.create.isPending || mutations.update.isPending}
        onCancel={() => setEditing(undefined)}
        onSubmit={(value) => void save(value)}
        open={editing !== undefined}
        record={editing ?? null}
      />
      <RoleActionDialog
        action={pendingAction}
        loading={
          mutations.activate.isPending ||
          mutations.deactivate.isPending ||
          mutations.forceDelete.isPending
        }
        onCancel={() => setPendingAction(null)}
        onConfirm={() => pendingAction && void act(pendingAction)}
      />
    </WorkspacePage>
  );
}
function RoleActionDialog({
  action,
  loading,
  onCancel,
  onConfirm
}: {
  action: PendingAction | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const destructive = action?.type === "force-delete";
  const verb = action?.type === "restore" ? "Restore" : destructive ? "Force delete" : "Suspend";
  return (
    <AlertDialog open={action !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{verb} role?</AlertDialogTitle>
          <AlertDialogDescription>
            {destructive
              ? `${action?.record.label ?? "This role"} will be permanently removed. Assignments may block deletion.`
              : `${action?.record.label ?? "This role"} will be marked ${action?.type === "restore" ? "active" : "inactive"}.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
            disabled={loading}
            onClick={onConfirm}
          >
            {verb}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
