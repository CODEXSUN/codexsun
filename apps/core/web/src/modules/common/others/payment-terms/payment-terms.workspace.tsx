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
import { PaymentTermsForm } from "./payment-terms.form";
import { paymentTermsQueryKey, usePaymentTerms } from "./payment-terms.hooks";
import { PaymentTermsList, paymentTermsListColumns } from "./payment-terms.list";
import {
  activatePaymentTerms,
  createPaymentTerms,
  deactivatePaymentTerms,
  forceDeletePaymentTerms,
  updatePaymentTerms
} from "./payment-terms.services";
import type { PaymentTermsRecord, PaymentTermsSavePayload } from "./payment-terms.types";
type PendingAction = { record: PaymentTermsRecord; type: "force-delete" | "restore" | "suspend" };

export function PaymentTermsWorkspace() {
  const listTools = useWorkspaceListTools(paymentTermsListColumns);

  const queryClient = useQueryClient();
  const [search, setSearch] = useWorkspaceQueryValue("q", "");
  const [status, setStatus] = useWorkspaceQueryValue("status", "all");
  const [page, setPage] = useWorkspaceQueryValue("page", 1);
  const [rowsPerPage, setRowsPerPage] = useWorkspaceQueryValue("pageSize", 100);
  const [editing, setLocalEditing] = useState<PaymentTermsRecord | null | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const query = usePaymentTerms();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = "/app/core/common/others/payment-terms";
  function setEditing(record: PaymentTermsRecord | null | undefined) {
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
  const saveMutation = useMutation({
    mutationFn: (payload: PaymentTermsSavePayload) =>
      editing ? updatePaymentTerms(editing.id, payload) : createPaymentTerms(payload),
    onError: showError("Unable to save payment term"),
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: paymentTermsQueryKey });
      toast.success(`Payment term ${editing ? "updated" : "created"}`, {
        description: String(record.name)
      });
      setEditing(undefined);
    }
  });
  const lifecycleMutation = useMutation({
    mutationFn: ({ record, type }: PendingAction) =>
      type === "force-delete"
        ? forceDeletePaymentTerms(record.id)
        : type === "restore"
          ? activatePaymentTerms(record.id)
          : deactivatePaymentTerms(record.id),
    onError: showError("Unable to update payment term"),
    onSuccess: async (record, action) => {
      await queryClient.invalidateQueries({ queryKey: paymentTermsQueryKey });
      toast.success(
        action.type === "force-delete"
          ? "Payment term force deleted"
          : action.type === "restore"
            ? "Payment term restored"
            : "Payment term suspended",
        { description: String(record.name) }
      );
      setPendingAction(null);
    }
  });
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data ?? [])
      .filter((record) =>
        listTools.matches({
          ...record,
          isActive: record.isActive ? "active" : "inactive",
          status: record.isActive ? "active" : "inactive"
        })
      )
      .filter(
        (record) =>
          (status === "all" || (status === "active" ? record.isActive : !record.isActive)) &&
          (!term || String(record.name).toLowerCase().includes(term))
      );
  }, [query.data, search, status, JSON.stringify(listTools.filters)]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const records = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  useEffect(() => {
    if (query.data && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  return (
    <WorkspacePage
      title=""
      className="w-full max-w-none py-0 lg:w-full lg:py-0"
      technicalName="page.common.others.payment-terms.list"
    >
      <WorkspaceHeaderActions>
        {editing === undefined ? (
          <Button className="h-9 rounded-md" onClick={() => setEditing(null)} type="button">
            <Plus className="size-4" />
            New payment term
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
            { id: "all", label: "All records" },
            {
              id: "active",
              label: "Active",
              count: (query.data ?? []).filter(
                (record) => (record.isActive ? "active" : "inactive") === "active"
              ).length
            },
            {
              id: "inactive",
              label: "Inactive",
              count: (query.data ?? []).filter(
                (record) => (record.isActive ? "active" : "inactive") === "inactive"
              ).length
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
          searchPlaceholder="Search payment terms"
          searchValue={search}
        />
        <PaymentTermsList
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
          singularLabel="payment term"
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
      <PaymentTermsForm
        {...(saveMutation.error instanceof Error ? { error: saveMutation.error.message } : {})}
        loading={saveMutation.isPending}
        onCancel={() => setEditing(undefined)}
        onSubmit={(payload) => saveMutation.mutate(payload)}
        open={editing !== undefined}
        record={editing ?? null}
      />
      <PaymentTermsActionDialog
        action={pendingAction}
        loading={lifecycleMutation.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => pendingAction && lifecycleMutation.mutate(pendingAction)}
      />
    </WorkspacePage>
  );
}
function PaymentTermsActionDialog({
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
          <AlertDialogTitle>{verb} payment term?</AlertDialogTitle>
          <AlertDialogDescription>
            {destructive
              ? `${String(action?.record.name ?? "This record")} will be permanently removed.`
              : `${String(action?.record.name ?? "This record")} will be marked ${action?.type === "restore" ? "active" : "inactive"}.`}
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
function showError(title: string) {
  return (error: unknown) =>
    toast.error(title, {
      description: error instanceof Error ? error.message : "Please try again."
    });
}
