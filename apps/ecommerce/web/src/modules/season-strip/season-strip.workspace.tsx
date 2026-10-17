import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue, useWorkspaceRecordSelection } from "@codexsun/ui/workspace/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { StorefrontSectionSwitch } from "../catalog-data-source";
import { SeasonStripForm } from "./season-strip.form";
import { SeasonStripList, seasonstripListColumns, seasonstripListValues } from "./season-strip.list";
import { invalidateStorefrontClientCache } from "../storefront";
import type { SeasonStripPayload, SeasonStripRecord } from "./season-strip.types";
import {
  changeSeasonStripStatus,
  createSeasonStrip,
  listSeasonStrips,
  pullSeasonStripsFromFrappe,
  updateSeasonStrip
} from "./season-strip.services";

const queryKey = ["ecommerce", "season-strips"] as const;
export function SeasonStripWorkspace() {
  const listTools = useWorkspaceListTools(seasonstripListColumns);
  const [statusFilter, setStatusFilter] = useWorkspaceQueryValue("status", "all");
  const client = useQueryClient();
  const [search, setSearch] = useWorkspaceQueryValue("q", "");

  const query = useQuery({
    queryKey: [...queryKey, search],
    queryFn: () => listSeasonStrips(search)
  });
  const records = (query.data ?? []).filter((record) => (statusFilter === "all" || record.status === statusFilter) && listTools.matches(seasonstripListValues(record)));
  const [editing, setEditing] = useWorkspaceRecordSelection<SeasonStripRecord>(query.data ?? [], (record) => String(record.id));
  const refresh = () => {
    invalidateStorefrontClientCache();
    return client.invalidateQueries({ queryKey });
  };
  const save = useMutation({
    mutationFn: (value: SeasonStripPayload) =>
      editing ? updateSeasonStrip(editing.id, value) : createSeasonStrip(value),
    onSuccess: async () => {
      await refresh();
      setEditing(undefined);
      toast.success("Season strip saved");
    },
    onError: (error) => toast.error(error.message)
  });
  const changeStatus = useMutation({
    mutationFn: (record: SeasonStripRecord) =>
      changeSeasonStripStatus(record.id, record.status === "active" ? "inactive" : "active"),
    onSuccess: refresh,
    onError: (error) => toast.error(error.message)
  });
  const pull = useMutation({
    mutationFn: pullSeasonStripsFromFrappe,
    onSuccess: async (result) => {
      await refresh();
      toast.success(`Stored ${result.seasonStrips} season strips locally`);
    },
    onError: (error) => toast.error(error.message)
  });
  if (editing !== undefined)
    return (
      <SeasonStripForm
        loading={save.isPending}
        record={editing}
        onCancel={() => setEditing(undefined)}
        onSubmit={(value) => save.mutate(value)}
      />
    );
  return (
    <WorkspacePage variant="list"
      title="Season Strips"
      description="Manage the two seasonal storefront banners separately from promotion cards."
      actions={
        <div className="flex flex-wrap gap-2">
          <StorefrontSectionSwitch module="season-strips" />
          <Button variant="outline" disabled={pull.isPending} onClick={() => pull.mutate()}>
            <Download className="size-4" />
            {pull.isPending ? "Pulling..." : "Pull from Frappe"}
          </Button>
          
          <Button onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            New
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        toolbarAction={listTools.toolbarAction}
        columnOptions={listTools.columnOptions}
        onShowAllColumns={listTools.onShowAllColumns}
        filterValue={statusFilter}
        onFilterValueChange={setStatusFilter}
        filterOptions={[{ id: "all", label: "All statuses" },{ id: "active", label: "Active", count: (query.data ?? []).filter((record) => record.status === "active").length },{ id: "inactive", label: "Inactive", count: (query.data ?? []).filter((record) => record.status === "inactive").length }]} 
        searchPlaceholder="Search season code, title, or Frappe item"
        searchValue={search}
        onSearchValueChange={setSearch}
      />
      <SeasonStripList
        listTools={listTools}
        loading={query.isLoading}
        records={records}
        onEdit={setEditing}
        onStatus={(record) => changeStatus.mutate(record)}
      />
    </WorkspacePage>
  );
}
