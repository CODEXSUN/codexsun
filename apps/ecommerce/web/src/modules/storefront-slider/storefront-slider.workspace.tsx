import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { StorefrontSliderForm } from "./storefront-slider.form";
import { storefrontSliderQueryKey, useStorefrontSliders } from "./storefront-slider.hooks";
import { StorefrontSliderList } from "./storefront-slider.list";
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
  StorefrontSliderRecord,
  StorefrontSliderStatus
} from "./storefront-slider.types";

export function StorefrontSliderWorkspace() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [status] = useState<StorefrontSliderStatus | undefined>();
  const [editing, setEditing] = useState<StorefrontSliderRecord | null | undefined>();
  const query = useStorefrontSliders(search, status);
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
    <WorkspacePage
      title="Home Slider"
      description="Manage locally stored storefront slides and refresh their linked items and source documents from Frappe."
      actions={
        <div className="flex flex-wrap gap-2">
          <StorefrontSectionSwitch module="sliders" />
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
        searchPlaceholder="Search slider code, title, or Frappe item"
        searchValue={search}
        onSearchValueChange={setSearch}
      />
      <StorefrontSliderList
        loading={query.isLoading}
        records={query.data ?? []}
        onEdit={setEditing}
        onStatus={(record) => changeStatus.mutate(record)}
      />
    </WorkspacePage>
  );
}
