import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { GlobalLoader } from "@codexsun/ui/components/global-loader";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceTableEmptyState, WorkspaceTablePanel } from "@codexsun/ui/workspace/table";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { cn } from "@codexsun/ui/lib/utils";
import { LogicxErpSchemeForm } from "./scheme.form";
import { logicxErpSchemesQueryKey, useLogicxErpScheme, useLogicxErpSchemes } from "./scheme.hooks";
import { LogicxErpSchemeList, logicxErpSchemeColumns } from "./scheme.list";
import type { LogicxErpSchemeGateway } from "./scheme.services";
import { LogicxErpSchemeShowPage } from "./scheme.show";
import type {
  LogicxErpSchemeFilters,
  LogicxErpSchemeRecord,
  LogicxErpSchemeSavePayload
} from "./scheme.types";

const statusFilters = [
  { id: "all", label: "All schemes" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" }
];
const priorityFilters = [
  { label: "All priorities", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" }
];
const claimFilters = [
  { label: "All claims", value: "all" },
  { label: "Claim pending", value: "pending" },
  { label: "Claim done", value: "done" }
];

type SchemeRoute =
  { mode: "list" } | { mode: "new" } | { mode: "show"; id: string } | { mode: "edit"; id: string };

export function LogicxErpSchemeWorkspace({ gateway }: { gateway: LogicxErpSchemeGateway }) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = `${location.pathname.startsWith("/app/") ? "/app" : ""}/logicx-erp/schemes`;
  const route = parseRoute(location.pathname, basePath);
  const [returnToList, setReturnToList] = useState(false);
  const [filters, setFilters] = useState<LogicxErpSchemeFilters>({
    claim: "all",
    priority: "all",
    search: "",
    status: "all"
  });
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(logicxErpSchemeColumns.map((column) => [column.id, true]))
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const schemesQuery = useLogicxErpSchemes(gateway, filters);
  const recordId = route.mode === "show" || route.mode === "edit" ? route.id : null;
  const schemeQuery = useLogicxErpScheme(gateway, recordId);

  const go = (path: string) => {
    if (location.pathname !== path) void navigate({ to: path });
  };
  const openList = () => go(basePath);
  const openShow = (scheme: LogicxErpSchemeRecord) =>
    go(`${basePath}/${encodeURIComponent(scheme.id)}`);
  // Opening a form clears the previous save error so it does not leak into another record.
  const openEdit = (scheme: LogicxErpSchemeRecord, fromList: boolean) => {
    saveMutation.reset();
    setReturnToList(fromList);
    go(`${basePath}/${encodeURIComponent(scheme.id)}/edit`);
  };
  const openNew = () => {
    saveMutation.reset();
    setReturnToList(route.mode === "list");
    go(`${basePath}/new`);
  };
  const updateFilters = (next: Partial<LogicxErpSchemeFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setCurrentPage(1);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: logicxErpSchemesQueryKey });
  const errorDescription = (error: unknown) =>
    error instanceof Error ? error.message : "Please try again.";

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: LogicxErpSchemeSavePayload }) =>
      id ? gateway.update(id, payload) : gateway.create(payload),
    onSuccess: async (scheme, { id }) => {
      await invalidate();
      toast.success(id ? "Scheme updated" : "Scheme created", {
        description: `${scheme.schemeNo} is saved.`
      });
      openShow(scheme);
    },
    onError: (error) => toast.error("Scheme save failed", { description: errorDescription(error) })
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LogicxErpSchemeRecord["status"] }) =>
      gateway.setStatus(id, status),
    onSuccess: async (scheme) => {
      await invalidate();
      toast.success("Scheme status updated", {
        description: `${scheme.schemeNo} is now ${scheme.status}.`
      });
    },
    onError: (error) =>
      toast.error("Status update failed", { description: errorDescription(error) })
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => gateway.remove(id),
    onSuccess: async (scheme) => {
      await invalidate();
      toast.success("Scheme deleted", { description: scheme.schemeNo });
      openList();
    },
    onError: (error) =>
      toast.error("Scheme could not be deleted", { description: errorDescription(error) })
  });
  const confirmDelete = (scheme: LogicxErpSchemeRecord) => {
    if (window.confirm(`Delete ${scheme.schemeNo}? It will be removed from the scheme list.`))
      deleteMutation.mutate(scheme.id);
  };

  if (route.mode === "new") {
    return (
      <LogicxErpSchemeForm
        error={saveMutation.error instanceof Error ? saveMutation.error.message : ""}
        gateway={gateway}
        loading={saveMutation.isPending}
        onBack={openList}
        onSubmit={(payload) => saveMutation.mutate({ payload })}
        scheme={null}
      />
    );
  }

  if (route.mode === "show" || route.mode === "edit") {
    if (schemeQuery.isError) {
      return (
        <WorkspacePage title="Scheme" onBack={openList}>
          <WorkspaceTablePanel>
            <WorkspaceTableEmptyState>
              {schemeQuery.error instanceof Error
                ? schemeQuery.error.message
                : "Scheme could not be loaded."}
            </WorkspaceTableEmptyState>
          </WorkspaceTablePanel>
        </WorkspacePage>
      );
    }
    if (!schemeQuery.data) return <GlobalLoader className="min-h-[32rem]" fullScreen={false} />;
    const scheme = schemeQuery.data;
    if (route.mode === "edit") {
      return (
        <LogicxErpSchemeForm
          key={scheme.id}
          error={saveMutation.error instanceof Error ? saveMutation.error.message : ""}
          gateway={gateway}
          loading={saveMutation.isPending}
          onBack={() => (returnToList ? openList() : openShow(scheme))}
          onSubmit={(payload) => saveMutation.mutate({ id: scheme.id, payload })}
          scheme={scheme}
        />
      );
    }
    return (
      <LogicxErpSchemeShowPage
        busy={statusMutation.isPending || deleteMutation.isPending}
        gateway={gateway}
        onBack={openList}
        onDelete={() => confirmDelete(scheme)}
        onEdit={() => openEdit(scheme, false)}
        onNew={openNew}
        onSetStatus={(status) => statusMutation.mutate({ id: scheme.id, status })}
        scheme={scheme}
      />
    );
  }

  const entries = schemesQuery.data ?? [];
  const totalPages = Math.max(1, Math.ceil(entries.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const pageEntries = entries.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <WorkspacePage
      title="Schemes"
      description="Vendor-operated schemes raised against sales invoices."
      technicalName="page.logicx-erp.scheme.list"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="h-9 rounded-md"
            disabled={schemesQuery.isFetching}
            onClick={() => void schemesQuery.refetch()}
            type="button"
            variant="outline"
          >
            <RefreshCw className={cn("size-4", schemesQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button className="h-9 rounded-md" onClick={openNew} type="button">
            <Plus className="size-4" />
            New scheme
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        columnOptions={logicxErpSchemeColumns.map((column) => ({
          ...column,
          checked: Boolean(visibleColumns[column.id]),
          onCheckedChange: (checked: boolean) =>
            setVisibleColumns((current) => ({ ...current, [column.id]: checked }))
        }))}
        filterOptions={statusFilters}
        filterValue={filters.status}
        onFilterValueChange={(value) =>
          updateFilters({ status: value as LogicxErpSchemeFilters["status"] })
        }
        onSearchValueChange={(value) => updateFilters({ search: value })}
        onShowAllColumns={() =>
          setVisibleColumns(
            Object.fromEntries(logicxErpSchemeColumns.map((column) => [column.id, true]))
          )
        }
        searchPlaceholder="Search scheme, invoice, description, brand, or user"
        searchValue={filters.search}
        toolbarAction={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-40">
              <WorkspaceSelect
                ariaLabel="Priority filter"
                onValueChange={(value) =>
                  updateFilters({ priority: value as LogicxErpSchemeFilters["priority"] })
                }
                options={priorityFilters}
                value={filters.priority}
              />
            </div>
            <div className="w-40">
              <WorkspaceSelect
                ariaLabel="Claim filter"
                onValueChange={(value) =>
                  updateFilters({ claim: value as LogicxErpSchemeFilters["claim"] })
                }
                options={claimFilters}
                value={filters.claim}
              />
            </div>
          </div>
        }
      />
      {schemesQuery.isError ? (
        <WorkspaceTablePanel>
          <WorkspaceTableEmptyState>
            {schemesQuery.error instanceof Error
              ? schemesQuery.error.message
              : "Schemes could not be loaded."}
          </WorkspaceTableEmptyState>
        </WorkspaceTablePanel>
      ) : null}
      <LogicxErpSchemeList
        entries={pageEntries}
        loading={schemesQuery.isLoading}
        onDelete={confirmDelete}
        onEdit={(scheme) => openEdit(scheme, true)}
        onSetStatus={(scheme, status) => statusMutation.mutate({ id: scheme.id, status })}
        onView={openShow}
        visibleColumns={visibleColumns}
      />
      <WorkspacePagination
        page={page}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(page, rowsPerPage, entries.length)}
        singularLabel="schemes"
        totalCount={entries.length}
        totalPages={totalPages}
        onNextPage={() => setCurrentPage(Math.min(totalPages, page + 1))}
        onPageChange={setCurrentPage}
        onPreviousPage={() => setCurrentPage(Math.max(1, page - 1))}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setCurrentPage(1);
        }}
      />
    </WorkspacePage>
  );
}

function parseRoute(pathname: string, basePath: string): SchemeRoute {
  const tail = pathname.slice(basePath.length).split("/").filter(Boolean);
  if (tail.length === 0) return { mode: "list" };
  if (tail.length === 1 && tail[0] === "new") return { mode: "new" };
  let id: string;
  try {
    id = decodeURIComponent(tail[0]!);
  } catch {
    return { mode: "list" };
  }
  if (tail.length === 1) return { mode: "show", id };
  if (tail.length === 2 && tail[1] === "edit") return { mode: "edit", id };
  return { mode: "list" };
}
