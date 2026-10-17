import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue, useWorkspaceRecordSelection } from "@codexsun/ui/workspace/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { PriorityForm } from "./priority.form";
import { usePriority } from "./priority.hooks";
import { PriorityList, priorityListColumns } from "./priority.list";
import { PriorityShow } from "./priority.show";
import {
  activatePriority,
  createPriority,
  deactivatePriority,
  forceDeletePriority,
  updatePriority
} from "./priority.services";
import type { PriorityInput, PriorityRecord } from "./priority.types";

type Action = { record: PriorityRecord; type: "suspend" | "restore" | "force-delete" };

export function PriorityWorkspace() {
  const listTools = useWorkspaceListTools(priorityListColumns);
  const client = useQueryClient();
  const query = usePriority();
  const [editing, setEditing] = useWorkspaceRecordSelection<PriorityRecord>(query.data ?? [], (record) => String(record.id));
  const [search, setSearch] = useWorkspaceQueryValue("q", "");
  const [status, setStatus] = useWorkspaceQueryValue("status", "all");
  const [page, setPage] = useWorkspaceQueryValue("page", 1);
  const [rowsPerPage, setRowsPerPage] = useWorkspaceQueryValue("pageSize", 100);

  const [viewing, setViewing] = useState<PriorityRecord | null>(null);
  const [pending, setPending] = useState<Action | null>(null);
  const save = useMutation({
    mutationFn: (input: PriorityInput) =>
      editing ? updatePriority(editing.id, input) : createPriority(input),
    onSuccess: async (record) => {
      await client.invalidateQueries({ queryKey: ["crm"] });
      toast.success("Priority saved", { description: record.name });
      setEditing(undefined);
    },
    onError: (error) => toast.error("Unable to save Priority", { description: error.message })
  });
  const lifecycle = useMutation({
    mutationFn: (action: Action) =>
      action.type === "suspend"
        ? deactivatePriority(action.record.id)
        : action.type === "restore"
          ? activatePriority(action.record.id)
          : forceDeletePriority(action.record.id),
    onSuccess: async (_, action) => {
      await client.invalidateQueries({ queryKey: ["crm"] });
      toast.success(
        "Priority " +
          (action.type === "suspend"
            ? "suspended"
            : action.type === "restore"
              ? "restored"
              : "deleted")
      );
      setPending(null);
    },
    onError: (error) => toast.error("Unable to update Priority", { description: error.message })
  });
  const filtered = useMemo(
    () =>
      (query.data ?? []).filter((record) => listTools.matches(record)).filter(
        (record) =>
          (status === "all" || record.status === status) &&
          record.name.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [query.data, search, status, JSON.stringify(listTools.filters)]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const records = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  if (editing !== undefined) return (<PriorityForm
        open={editing !== undefined}
        record={editing ?? null}
        loading={save.isPending}
        error={save.error?.message ?? ""}
        onCancel={() => setEditing(undefined)}
        onSubmit={(input) => save.mutate(input)}
      />);
  return (
    <WorkspacePage variant="list"
      title="Priorities"
      description="Manage Priority options for enquiries."
      technicalName="page.crm.priority.list"
      actions={
        <div className="flex gap-2">
          <Button type="button" onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            New Priority
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        toolbarAction={listTools.toolbarAction}
        columnOptions={listTools.columnOptions}
        onShowAllColumns={listTools.onShowAllColumns}
        searchValue={search}
        searchPlaceholder="Search priorities"
        onSearchValueChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filterValue={status}
        onFilterValueChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All records" },
          { id: "active", label: "Active", count: (query.data ?? []).filter((record) => record.status === "active").length },
          { id: "inactive", label: "Inactive", count: (query.data ?? []).filter((record) => record.status === "inactive").length }
        ]}
      />
      {query.error ? (
        <p role="alert" className="text-sm text-destructive">
          {query.error.message}
        </p>
      ) : null}
      <PriorityList
        listTools={listTools}
        records={records}
        loading={query.isLoading}
        onView={setViewing}
        onEdit={setEditing}
        onSuspend={(record) => setPending({ record, type: "suspend" })}
        onRestore={(record) => setPending({ record, type: "restore" })}
        onForceDelete={(record) => setPending({ record, type: "force-delete" })}
      />
      {totalPages > 1 ? (
        <WorkspacePagination
          page={currentPage}
          rowsPerPage={rowsPerPage}
          showingLabel={buildShowingLabel(currentPage, rowsPerPage, filtered.length)}
          singularLabel="priority"
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
      ) : null}

      <PriorityShow
        record={viewing}
        onClose={() => setViewing(null)}
        onEdit={(record) => {
          setViewing(null);
          setEditing(record);
        }}
      />
      <AlertDialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.type === "force-delete"
                ? "Force delete"
                : pending?.type === "restore"
                  ? "Restore"
                  : "Suspend"}{" "}
              Priority?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.record.name}{" "}
              {pending?.type === "force-delete"
                ? "will be removed if no enquiry uses it."
                : "will change status."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={lifecycle.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={lifecycle.isPending}
              onClick={() => pending && lifecycle.mutate(pending)}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspacePage>
  );
}
