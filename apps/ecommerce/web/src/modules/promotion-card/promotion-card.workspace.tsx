import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue, useWorkspaceRecordSelection } from "@codexsun/ui/workspace/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { PromotionCardForm } from "./promotion-card.form";
import { promotionCardQueryKey, usePromotionCards } from "./promotion-card.hooks";
import { PromotionCardList, promotioncardListColumns, promotioncardListValues } from "./promotion-card.list";
import {
  changePromotionCardStatus,
  createPromotionCard,
  pullPromotionCardsFromFrappe,
  updatePromotionCard
} from "./promotion-card.services";
import { invalidateStorefrontClientCache } from "../storefront";
import { StorefrontSectionSwitch } from "../catalog-data-source";
import type {
  PromotionCardPayload,
  PromotionCardRecord
} from "./promotion-card.types";

export function PromotionCardWorkspace({
  mode = "promotions"
}: {
  mode?: "promotions" | "campaigns";
}) {
  const listTools = useWorkspaceListTools(promotioncardListColumns);
  const [statusFilter, setStatusFilter] = useWorkspaceQueryValue("status", "all");
  const client = useQueryClient();
  const [search, setSearch] = useWorkspaceQueryValue("q", "");


  const query = usePromotionCards(search);
  const records = (query.data ?? []).filter((record) => (statusFilter === "all" || record.status === statusFilter) && listTools.matches(promotioncardListValues(record)));
  const [editing, setEditing] = useWorkspaceRecordSelection<PromotionCardRecord>(query.data ?? [], (record) => String(record.id));
  const refresh = () => {
    invalidateStorefrontClientCache();
    return client.invalidateQueries({ queryKey: promotionCardQueryKey });
  };
  const save = useMutation({
    mutationFn: (value: PromotionCardPayload) =>
      editing ? updatePromotionCard(editing.id, value) : createPromotionCard(value),
    onSuccess: async () => {
      await refresh();
      setEditing(undefined);
      toast.success("Promotion card saved");
    },
    onError: (error) => toast.error(error.message)
  });
  const changeStatus = useMutation({
    mutationFn: (record: PromotionCardRecord) =>
      changePromotionCardStatus(record.id, record.status === "active" ? "inactive" : "active"),
    onSuccess: refresh,
    onError: (error) => toast.error(error.message)
  });
  const pull = useMutation({
    mutationFn: pullPromotionCardsFromFrappe,
    onSuccess: async (result) => {
      await refresh();
      toast.success(`Stored ${result.items} items and ${result.promotions} promotions locally`);
    },
    onError: (error) => toast.error(error.message)
  });
  if (editing !== undefined)
    return (
      <PromotionCardForm
        loading={save.isPending}
        record={editing}
        onCancel={() => setEditing(undefined)}
        onSubmit={(value) => save.mutate(value)}
      />
    );
  return (
    <WorkspacePage variant="list"
      title={mode === "campaigns" ? "Campaign Events" : "Promotion Cards"}
      description={
        mode === "campaigns"
          ? "Manage the promotional content used by homepage campaigns and events. Local campaigns share promotion records."
          : "Manage promotion cards shown on the storefront home page."
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <StorefrontSectionSwitch
            module={mode === "campaigns" ? "campaign-events" : "promotions"}
          />
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
        searchPlaceholder="Search promotion code, title, or Frappe item"
        searchValue={search}
        onSearchValueChange={setSearch}
      />
      <PromotionCardList
        listTools={listTools}
        loading={query.isLoading}
        records={records}
        onEdit={setEditing}
        onStatus={(record) => changeStatus.mutate(record)}
      />
    </WorkspacePage>
  );
}
