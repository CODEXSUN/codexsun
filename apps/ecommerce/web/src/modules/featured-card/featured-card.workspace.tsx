import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue, useWorkspaceRecordSelection } from "@codexsun/ui/workspace/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { FeaturedCardForm } from "./featured-card.form";
import { featuredCardQueryKey, useFeaturedCards } from "./featured-card.hooks";
import { FeaturedCardList, featuredcardListColumns, featuredcardListValues } from "./featured-card.list";
import {
  changeFeaturedCardStatus,
  createFeaturedCard,
  pullFeaturedCardsFromFrappe,
  updateFeaturedCard
} from "./featured-card.services";
import { invalidateStorefrontClientCache } from "../storefront";
import { StorefrontSectionSwitch } from "../catalog-data-source";
import type {
  FeaturedCardPayload,
  FeaturedCardRecord
} from "./featured-card.types";

export function FeaturedCardWorkspace() {
  const listTools = useWorkspaceListTools(featuredcardListColumns);
  const [statusFilter, setStatusFilter] = useWorkspaceQueryValue("status", "all");
  const client = useQueryClient();
  const [search, setSearch] = useWorkspaceQueryValue("q", "");


  const query = useFeaturedCards(search);
  const records = (query.data ?? []).filter((record) => (statusFilter === "all" || record.status === statusFilter) && listTools.matches(featuredcardListValues(record)));
  const [editing, setEditing] = useWorkspaceRecordSelection<FeaturedCardRecord>(query.data ?? [], (record) => String(record.id));
  const refresh = () => {
    invalidateStorefrontClientCache();
    return client.invalidateQueries({ queryKey: featuredCardQueryKey });
  };
  const save = useMutation({
    mutationFn: (value: FeaturedCardPayload) =>
      editing ? updateFeaturedCard(editing.id, value) : createFeaturedCard(value),
    onSuccess: async () => {
      await refresh();
      setEditing(undefined);
      toast.success("Featured card saved");
    },
    onError: (error) => toast.error(error.message)
  });
  const changeStatus = useMutation({
    mutationFn: (record: FeaturedCardRecord) =>
      changeFeaturedCardStatus(record.id, record.status === "active" ? "inactive" : "active"),
    onSuccess: refresh,
    onError: (error) => toast.error(error.message)
  });
  const pull = useMutation({
    mutationFn: pullFeaturedCardsFromFrappe,
    onSuccess: async (result) => {
      await refresh();
      toast.success(
        `Stored ${result.items} items and ${result.featuredCards} featured cards locally`
      );
    },
    onError: (error) => toast.error(error.message)
  });
  if (editing !== undefined)
    return (
      <FeaturedCardForm
        loading={save.isPending}
        record={editing}
        onCancel={() => setEditing(undefined)}
        onSubmit={(value) => save.mutate(value)}
      />
    );
  return (
    <WorkspacePage variant="list"
      title="Featured Cards"
      description="Manage locally stored storefront slides and refresh their linked items and source documents from Frappe."
      actions={
        <div className="flex flex-wrap gap-2">
          <StorefrontSectionSwitch module="featured-cards" />
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
        searchPlaceholder="Search featured code, title, or Frappe item"
        searchValue={search}
        onSearchValueChange={setSearch}
      />
      <FeaturedCardList
        listTools={listTools}
        loading={query.isLoading}
        records={records}
        onEdit={setEditing}
        onStatus={(record) => changeStatus.mutate(record)}
      />
    </WorkspacePage>
  );
}
