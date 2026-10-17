import { WorkspaceHeaderActions, useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";
import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
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
import { LedgersForm } from "./ledgers.form";
import { ledgersQueryKey, useLedgerGroupLookups, useLedgers } from "./ledgers.hooks";
import { LedgersList, ledgersListColumns } from "./ledgers.list";
import {
  activateLedger,
  createLedger,
  deactivateLedger,
  forceDeleteLedger,
  updateLedger
} from "./ledgers.services";
import type { LedgerRecord, LedgerSavePayload } from "./ledgers.types";
type Action = { record: LedgerRecord; type: "delete" | "restore" | "suspend" };
export function LedgersWorkspace() {
  const listTools = useWorkspaceListTools(ledgersListColumns);

  const client = useQueryClient();
  const query = useLedgers();
  const groups = useLedgerGroupLookups();
  const [search, setSearch] = useWorkspaceQueryValue("q", "");
  const [status, setStatus] = useWorkspaceQueryValue("status", "all");
  const [page, setPage] = useWorkspaceQueryValue("page", 1);
  const [rowsPerPage, setRowsPerPage] = useWorkspaceQueryValue("pageSize", 100);
  const [editing, setLocalEditing] = useState<LedgerRecord | null | undefined>(undefined);
  const [action, setAction] = useState<Action | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = "/app/core/common/accounts/ledgers";
  function setEditing(record: LedgerRecord | null | undefined) {
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
    mutationFn: (payload: LedgerSavePayload) =>
      editing ? updateLedger(editing.id, payload) : createLedger(payload),
    onSuccess: async (record) => {
      await client.invalidateQueries({ queryKey: ledgersQueryKey });
      toast.success(`Ledger ${editing ? "updated" : "created"}`, { description: record.name });
      setEditing(undefined);
    },
    onError: (error) => toast.error("Unable to save ledger", { description: message(error) })
  });
  const lifecycle = useMutation({
    mutationFn: ({ record, type }: Action) =>
      type === "delete"
        ? forceDeleteLedger(record.id)
        : type === "restore"
          ? activateLedger(record.id)
          : deactivateLedger(record.id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ledgersQueryKey });
      toast.success("Ledger updated");
      setAction(null);
    },
    onError: (error) => toast.error("Unable to update ledger", { description: message(error) })
  });
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data ?? [])
      .filter((record) => listTools.matches({ ...record, status: record.status }))
      .filter(
        (record) =>
          (status === "all" || record.status === status) &&
          (!term ||
            record.name.toLowerCase().includes(term) ||
            record.ledgerGroupName.toLowerCase().includes(term))
      );
  }, [query.data, search, status, JSON.stringify(listTools.filters)]);
  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const current = Math.min(page, pages);
  const records = filtered.slice((current - 1) * rowsPerPage, current * rowsPerPage);
  useEffect(() => {
    if (query.data && page > pages) setPage(pages);
  }, [page, pages]);
  return (
    <WorkspacePage
      title=""
      className="w-full max-w-none py-0 lg:w-full lg:py-0"
      technicalName="page.common.accounts.ledgers.list"
    >
      <WorkspaceHeaderActions>
        {editing === undefined ? (
          <Button className="h-9 rounded-md" onClick={() => setEditing(null)} type="button">
            <Plus className="size-4" />
            New ledger
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
            { id: "all", label: "All ledgers" },
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
          searchPlaceholder="Search ledgers or ledger groups"
          searchValue={search}
        />
        <LedgersList
          listTools={listTools}
          loading={query.isFetching && !query.data}
          records={records}
          onEdit={setEditing}
          onForceDelete={(record) => setAction({ record, type: "delete" })}
          onRestore={(record) => setAction({ record, type: "restore" })}
          onSuspend={(record) => setAction({ record, type: "suspend" })}
        />
        <WorkspacePagination
          page={current}
          rowsPerPage={rowsPerPage}
          showingLabel={buildShowingLabel(current, rowsPerPage, filtered.length)}
          singularLabel="ledger"
          totalCount={filtered.length}
          totalPages={pages}
          onNextPage={() => setPage((value) => Math.min(pages, value + 1))}
          onPageChange={setPage}
          onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setPage(1);
          }}
        />
      </div>
      <LedgersForm
        open={editing !== undefined}
        record={editing ?? null}
        groups={groups.data ?? []}
        loading={save.isPending}
        {...(save.error instanceof Error ? { error: save.error.message } : {})}
        onCancel={() => setEditing(undefined)}
        onSubmit={(payload) => save.mutate(payload)}
      />
      <Dialog
        action={action}
        loading={lifecycle.isPending}
        onCancel={() => setAction(null)}
        onConfirm={() => action && lifecycle.mutate(action)}
      />
    </WorkspacePage>
  );
}
function Dialog({
  action,
  loading,
  onCancel,
  onConfirm
}: {
  action: Action | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const verb =
    action?.type === "restore" ? "Restore" : action?.type === "delete" ? "Force delete" : "Suspend";
  return (
    <AlertDialog open={Boolean(action)} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{verb} ledger?</AlertDialogTitle>
          <AlertDialogDescription>{action?.record.name} will be updated.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={loading} onClick={onConfirm}>
            {verb}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
function message(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
}
