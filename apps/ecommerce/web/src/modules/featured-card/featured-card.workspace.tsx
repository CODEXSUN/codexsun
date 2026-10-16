import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { FeaturedCardForm } from "./featured-card.form";
import { featuredCardQueryKey, useFeaturedCards } from "./featured-card.hooks";
import { FeaturedCardList } from "./featured-card.list";
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
  FeaturedCardRecord,
  FeaturedCardStatus
} from "./featured-card.types";

export function FeaturedCardWorkspace() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [status] = useState<FeaturedCardStatus | undefined>();
  const [editing, setEditing] = useState<FeaturedCardRecord | null | undefined>();
  const query = useFeaturedCards(search, status);
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
    <WorkspacePage
      title="Featured Cards"
      description="Manage locally stored storefront slides and refresh their linked items and source documents from Frappe."
      actions={
        <div className="flex flex-wrap gap-2">
          <StorefrontSectionSwitch module="featured-cards" />
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
        searchPlaceholder="Search featured code, title, or Frappe item"
        searchValue={search}
        onSearchValueChange={setSearch}
      />
      <FeaturedCardList
        loading={query.isLoading}
        records={query.data ?? []}
        onEdit={setEditing}
        onStatus={(record) => changeStatus.mutate(record)}
      />
    </WorkspacePage>
  );
}
