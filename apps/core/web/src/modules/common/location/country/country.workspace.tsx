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
import { CountryForm } from "./country.form";
import { countryQueryKey, useCountries } from "./country.hooks";
import { CountryList, countryListColumns } from "./country.list";
import {
  activateCountry,
  createCountry,
  deactivateCountry,
  forceDeleteCountry,
  updateCountry
} from "./country.services";
import type { CountryRecord, CountrySavePayload } from "./country.types";

type PendingAction = {
  record: CountryRecord;
  type: "force-delete" | "restore" | "suspend";
};

export function CountryWorkspace() {
  const listTools = useWorkspaceListTools(countryListColumns);

  const queryClient = useQueryClient();
  const [search, setSearch] = useWorkspaceQueryValue("q", "");
  const [status, setStatus] = useWorkspaceQueryValue("status", "all");
  const [page, setPage] = useWorkspaceQueryValue("page", 1);
  const [rowsPerPage, setRowsPerPage] = useWorkspaceQueryValue("pageSize", 100);
  const [editing, setLocalEditing] = useState<CountryRecord | null | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const countriesQuery = useCountries();

  const location = useLocation();
  const navigate = useNavigate();
  const basePath = "/app/core/common/location/countries";
  function setEditing(record: CountryRecord | null | undefined) {
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
    const record = countriesQuery.data?.find((entry) => String(entry.id) === id);
    setLocalEditing((current) =>
      current && record && current.id === record.id ? current : record
    );
  }, [location.pathname, countriesQuery.data]);
  const saveMutation = useMutation({
    mutationFn: (payload: CountrySavePayload) =>
      editing ? updateCountry(editing.id, payload) : createCountry(payload),
    onError: showError("Unable to save country"),
    onSuccess: async (record) => {
      await refreshCountries(queryClient);
      toast.success(`Country ${editing ? "updated" : "created"}`, {
        description: `${record.name} is ready in the list.`
      });
      setEditing(undefined);
    }
  });

  const lifecycleMutation = useMutation({
    mutationFn: ({ record, type }: PendingAction) => {
      if (type === "force-delete") return forceDeleteCountry(record.id);
      if (type === "restore") return activateCountry(record.id);
      return deactivateCountry(record.id);
    },
    onError: showError("Unable to update country"),
    onSuccess: async (record, action) => {
      await refreshCountries(queryClient);
      toast.success(actionMessage(action.type), { description: record.name });
      setPendingAction(null);
    }
  });

  const filteredCountries = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (countriesQuery.data ?? [])
      .filter((record) => listTools.matches({ ...record, status: record.status }))
      .filter((record) => {
        const matchesStatus = status === "all" || record.status === status;
        const matchesSearch =
          !term ||
          record.name.toLowerCase().includes(term) ||
          record.code.toLowerCase().includes(term);
        return matchesStatus && matchesSearch;
      });
  }, [countriesQuery.data, search, status, JSON.stringify(listTools.filters)]);
  const totalPages = Math.max(1, Math.ceil(filteredCountries.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageCountries = filteredCountries.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    if (countriesQuery.data && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <WorkspacePage
      title=""
      className="w-full max-w-none py-0 lg:w-full lg:py-0"
      technicalName="page.common.location.country.list"
    >
      <WorkspaceHeaderActions>
        {editing === undefined ? (
          <Button className="h-9 rounded-md" onClick={() => setEditing(null)} type="button">
            <Plus className="size-4" />
            New country
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
            { id: "all", label: "All countries" },
            {
              id: "active",
              label: "Active",
              count: (countriesQuery.data ?? []).filter((record) => record.status === "active")
                .length
            },
            {
              id: "inactive",
              label: "Inactive",
              count: (countriesQuery.data ?? []).filter((record) => record.status === "inactive")
                .length
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
          searchPlaceholder="Search countries"
          searchValue={search}
        />
        <CountryList
          listTools={listTools}
          loading={countriesQuery.isFetching && !countriesQuery.data}
          onEdit={setEditing}
          onForceDelete={(record) => setPendingAction({ record, type: "force-delete" })}
          onRestore={(record) => setPendingAction({ record, type: "restore" })}
          onSuspend={(record) => setPendingAction({ record, type: "suspend" })}
          records={pageCountries}
        />
        <WorkspacePagination
          page={currentPage}
          rowsPerPage={rowsPerPage}
          showingLabel={buildShowingLabel(currentPage, rowsPerPage, filteredCountries.length)}
          singularLabel="country"
          totalCount={filteredCountries.length}
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
      <CountryForm
        {...(saveMutation.error instanceof Error ? { error: saveMutation.error.message } : {})}
        loading={saveMutation.isPending}
        onCancel={() => setEditing(undefined)}
        onSubmit={(payload) => saveMutation.mutate(payload)}
        open={editing !== undefined}
        record={editing ?? null}
      />
      <CountryActionDialog
        action={pendingAction}
        loading={lifecycleMutation.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => pendingAction && lifecycleMutation.mutate(pendingAction)}
      />
    </WorkspacePage>
  );
}

function CountryActionDialog({
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
          <AlertDialogTitle>{verb} country?</AlertDialogTitle>
          <AlertDialogDescription>
            {destructive
              ? `${action?.record.name ?? "This country"} will be permanently removed. This is blocked when states reference it.`
              : `${action?.record.name ?? "This country"} will be marked ${action?.type === "restore" ? "active" : "inactive"}.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={
              action?.type === "force-delete"
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

function refreshCountries(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: countryQueryKey });
}

function showError(title: string) {
  return (error: unknown) =>
    toast.error(title, {
      description: error instanceof Error ? error.message : "Please try again."
    });
}

function actionMessage(type: PendingAction["type"]) {
  if (type === "force-delete") return "Country force deleted";
  return type === "restore" ? "Country restored" : "Country suspended";
}
