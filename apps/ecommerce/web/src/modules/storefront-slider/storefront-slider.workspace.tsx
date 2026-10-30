import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue, useWorkspaceRecordSelection } from "@codexsun/ui/workspace/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { StorefrontSliderForm } from "./storefront-slider.form";
import { storefrontSliderQueryKey, useStorefrontSliders } from "./storefront-slider.hooks";
import { StorefrontSliderList, storefrontsliderListColumns, storefrontsliderListValues } from "./storefront-slider.list";
import {
  changeStorefrontSliderStatus,
  createStorefrontSlider,
  pullStorefrontSlidersFromFrappe,
  updateStorefrontSlider
} from "./storefront-slider.services";
import { invalidateStorefrontClientCache } from "../storefront";
import { StorefrontSectionSwitch } from "../catalog-data-source";
import type {
  StorefrontSliderPayload,
  StorefrontSliderRecord
} from "./storefront-slider.types";

export function StorefrontSliderWorkspace() {
  const listTools = useWorkspaceListTools(storefrontsliderListColumns);
  const [statusFilter, setStatusFilter] = useWorkspaceQueryValue("status", "all");
  const client = useQueryClient();
  const [search, setSearch] = useWorkspaceQueryValue("q", "");


  const query = useStorefrontSliders(search);
  const records = (query.data ?? []).filter((record) => (statusFilter === "all" || record.status === statusFilter) && listTools.matches(storefrontsliderListValues(record)));
  const [editing, setEditing] = useWorkspaceRecordSelection<StorefrontSliderRecord>(query.data ?? [], (record) => String(record.id));
  const refresh = () => {
    invalidateStorefrontClientCache();
    return client.invalidateQueries({ queryKey: storefrontSliderQueryKey });
  };
  const save = useMutation({
    mutationFn: (value: StorefrontSliderPayload) =>
      editing ? updateStorefrontSlider(editing.id, value) : createStorefrontSlider(value),
    onSuccess: async () => {
      await refresh();
      setEditing(undefined);
      toast.success("Home slider saved");
    },
    onError: (error) => toast.error(error.message)
  });
  const changeStatus = useMutation({
    mutationFn: (record: StorefrontSliderRecord) =>
      changeStorefrontSliderStatus(record.id, record.status === "active" ? "inactive" : "active"),
    onSuccess: refresh,
    onError: (error) => toast.error(error.message)
  });
  const pull = useMutation({
    mutationFn: pullStorefrontSlidersFromFrappe,
    onSuccess: async (result) => {
      await refresh();
      toast.success(`Stored ${result.items} items and ${result.sliders} sliders locally`);
    },
    onError: (error) => toast.error(error.message)
  });
  if (editing !== undefined)
    return (
      <StorefrontSliderForm
        loading={save.isPending}
        record={editing}
        onCancel={() => setEditing(undefined)}
        onSubmit={(value) => save.mutate(value)}
      />
    );
  return (
    <WorkspacePage variant="list"
      title="Home Slider"
      description="Manage locally stored storefront slides and refresh their linked items and source documents from Frappe."
      actions={
        <div className="flex flex-wrap gap-2">
          <StorefrontSectionSwitch module="sliders" />
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
        searchPlaceholder="Search slider code, title, or Frappe item"
        searchValue={search}
        onSearchValueChange={setSearch}
      />
      <StorefrontSliderList
        listTools={listTools}
        loading={query.isLoading}
        records={records}
        onEdit={setEditing}
        onStatus={(record) => changeStatus.mutate(record)}
      />
    </WorkspacePage>
  );
}
