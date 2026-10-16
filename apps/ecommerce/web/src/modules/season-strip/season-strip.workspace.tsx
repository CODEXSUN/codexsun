import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { StorefrontSectionSwitch } from "../catalog-data-source";
import { SeasonStripForm } from "./season-strip.form";
import { SeasonStripList } from "./season-strip.list";
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
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<SeasonStripRecord | null | undefined>();
  const query = useQuery({
    queryKey: [...queryKey, search],
    queryFn: () => listSeasonStrips(search)
  });
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
    <WorkspacePage
      title="Season Strips"
      description="Manage the two seasonal storefront banners separately from promotion cards."
      actions={
        <div className="flex flex-wrap gap-2">
          <StorefrontSectionSwitch module="season-strips" />
          <Button variant="outline" disabled={pull.isPending} onClick={() => pull.mutate()}>
            <Download className="size-4" />
            {pull.isPending ? "Pulling..." : "Pull from Frappe"}
          </Button>
          <Button variant="outline" onClick={() => void query.refetch()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            New
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        searchPlaceholder="Search season code, title, or Frappe item"
        searchValue={search}
        onSearchValueChange={setSearch}
      />
      <SeasonStripList
        loading={query.isLoading}
        records={query.data ?? []}
        onEdit={setEditing}
        onStatus={(record) => changeStatus.mutate(record)}
      />
    </WorkspacePage>
  );
}
