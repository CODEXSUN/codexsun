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
import { CityForm } from "./city.form";
import { cityQueryKey, useCitys, useCityDistrictOptions } from "./city.hooks";
import { CityList, cityListColumns } from "./city.list";
import {
  activateCity,
  createCity,
  deactivateCity,
  forceDeleteCity,
  updateCity
} from "./city.services";
import type { CityRecord, CitySavePayload } from "./city.types";
type Action = { record: CityRecord; type: "force-delete" | "restore" | "suspend" };
export function CityWorkspace() {
  const listTools = useWorkspaceListTools(cityListColumns);

  const client = useQueryClient();
  const [search, setSearch] = useWorkspaceQueryValue("q", "");
  const [status, setStatus] = useWorkspaceQueryValue("status", "all");
  const [page, setPage] = useWorkspaceQueryValue("page", 1);
  const [size, setSize] = useState(100);
  const [editing, setLocalEditing] = useState<CityRecord | null | undefined>(undefined);
  const [action, setAction] = useState<Action | null>(null);
  const query = useCitys();
  const options = useCityDistrictOptions();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = "/app/core/common/location/cities";
  function setEditing(record: CityRecord | null | undefined) {
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
    mutationFn: (value: CitySavePayload) =>
      editing ? updateCity(editing.id, value) : createCity(value),
    onError: showError("Unable to save city"),
    onSuccess: async (record) => {
      await client.invalidateQueries({ queryKey: cityQueryKey });
      toast.success(`City ${editing ? "updated" : "created"}`, { description: record.name });
      setEditing(undefined);
    }
  });
  const lifecycle = useMutation({
    mutationFn: ({ record, type }: Action) =>
      type === "force-delete"
        ? forceDeleteCity(record.id)
        : type === "restore"
          ? activateCity(record.id)
          : deactivateCity(record.id),
    onError: showError("Unable to update city"),
    onSuccess: async (record) => {
      await client.invalidateQueries({ queryKey: cityQueryKey });
      toast.success("City updated", { description: record.name });
      setAction(null);
    }
  });
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data ?? [])
      .filter((record) => listTools.matches({ ...record, status: record.status }))
      .filter((record) => {
        return (
          (status === "all" || record.status === status) &&
          (!term ||
            Object.values(record).some((value) =>
              String(value ?? "")
                .toLowerCase()
                .includes(term)
            ))
        );
      });
  }, [query.data, search, status, JSON.stringify(listTools.filters)]);
  const pages = Math.max(1, Math.ceil(filtered.length / size)),
    current = Math.min(page, pages),
    rows = filtered.slice((current - 1) * size, current * size);
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  return (
    <WorkspacePage
      title=""
      className="w-full max-w-none py-0 lg:w-full lg:py-0"
      technicalName="page.common.location.city.list"
    >
      <WorkspaceHeaderActions>
        {editing === undefined ? (
          <Button onClick={() => setEditing(null)} type="button">
            <Plus className="size-4" />
            New city
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
            { id: "all", label: "All cities" },
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
          onFilterValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          onSearchValueChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search cities"
          searchValue={search}
        />
        <CityList
          listTools={listTools}
          loading={query.isFetching && !query.data}
          onEdit={setEditing}
          onForceDelete={(record) => setAction({ record, type: "force-delete" })}
          onRestore={(record) => setAction({ record, type: "restore" })}
          onSuspend={(record) => setAction({ record, type: "suspend" })}
          records={rows}
        />
        <WorkspacePagination
          page={current}
          rowsPerPage={size}
          showingLabel={buildShowingLabel(current, size, filtered.length)}
          singularLabel="city"
          totalCount={filtered.length}
          totalPages={pages}
          onNextPage={() => setPage((v) => Math.min(pages, v + 1))}
          onPageChange={setPage}
          onPreviousPage={() => setPage((v) => Math.max(1, v - 1))}
          onRowsPerPageChange={(v) => {
            setSize(v);
            setPage(1);
          }}
        />
      </div>
      <CityForm
        {...(save.error instanceof Error ? { error: save.error.message } : {})}
        loading={save.isPending}
        onCancel={() => setEditing(undefined)}
        onSubmit={(value) => save.mutate(value)}
        open={editing !== undefined}
        options={options.data ?? []}
        record={editing ?? null}
      />
      <ActionDialog
        action={action}
        loading={lifecycle.isPending}
        onCancel={() => setAction(null)}
        onConfirm={() => action && lifecycle.mutate(action)}
      />
    </WorkspacePage>
  );
}
function ActionDialog({
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
    action?.type === "restore"
      ? "Restore"
      : action?.type === "force-delete"
        ? "Force delete"
        : "Suspend";
  return (
    <AlertDialog open={action !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{verb} city?</AlertDialogTitle>
          <AlertDialogDescription>{action?.record.name ?? "Selected city"}</AlertDialogDescription>
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
function showError(title: string) {
  return (error: unknown) =>
    toast.error(title, {
      description: error instanceof Error ? error.message : "Please try again."
    });
}
