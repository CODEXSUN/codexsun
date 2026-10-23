import { WorkspaceUpsertPage } from "@codexsun/ui/workspace/upsert";
import { useQuery } from "@tanstack/react-query";

import {
  useWorkspaceNavigation,
  useWorkspaceQueryState,
  useWorkspaceQueryValue,
  useWorkspaceRecordSelection
} from "@codexsun/ui/workspace/navigation";

import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

import { Button } from "@codexsun/ui/components/button";

import { WorkspacePage } from "@codexsun/ui/workspace/page";

import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";

import { useMarketingTransport } from "../../transport";

import { useCampaigns } from "./campaign.hooks";

import { createCampaign, updateCampaign, countCampaigns, getCampaign } from "./campaign.services";

import { CampaignList } from "./campaign.list";

import { CampaignForm } from "./campaign.form";

import { CampaignShow } from "./campaign.show";

import type { CampaignInput, CampaignRecord } from "./campaign.types";

export function CampaignWorkspace() {
  const navigation = useWorkspaceNavigation();
  const [hiddenColumnKeys, setHiddenColumnKeys] = useWorkspaceQueryValue("hiddenColumns", "");
  const hiddenColumns = hiddenColumnKeys.split(",").filter(Boolean);
  const setHiddenColumns = (next: string[] | ((previous: string[]) => string[])) =>
    setHiddenColumnKeys((typeof next === "function" ? next(hiddenColumns) : next).join(","));
  const columnOptions = [
    { id: "name", label: "Name" },
    { id: "updatedBy", label: "Updated by" },
    { id: "status", label: "Status" }
  ].map((column) => ({
    ...column,
    checked: !hiddenColumns.includes(column.id),
    onCheckedChange: (checked: boolean) =>
      setHiddenColumns((previous) =>
        checked ? previous.filter((id) => id !== column.id) : [...previous, column.id]
      )
  }));
  const api = useMarketingTransport(),
    client = useQueryClient();

  const [filters, setFilters] = useWorkspaceQueryState({ search: "", page: 0, status: "all" });

  const { search, status } = filters;
  const page = Math.max(0, Math.min(100000, Math.trunc(filters.page)));

  const setPage = (page: number) => setFilters((previous) => ({ ...previous, page }));

  const query = useCampaigns(search, page, status);

  const count = useQuery({
    queryKey: ["marketing", api.scopeKey, "campaign-count", search, status],
    queryFn: () => countCampaigns(api, search, status)
  });

  const [viewKey, setViewKey] = useWorkspaceQueryValue("show", "");

  const [editKey] = useWorkspaceQueryValue("record", "");

  const detail = useQuery({
    queryKey: ["marketing", api.scopeKey, "campaign-detail", viewKey || editKey],
    queryFn: () => getCampaign(api, viewKey || editKey),
    enabled: Boolean(viewKey || editKey)
  });

  const records = [...(query.data ?? []), ...(detail.data ? [detail.data] : [])];

  const [editing, setEditing] = useWorkspaceRecordSelection(records, (row) => row.uuid);

  const viewing = viewKey ? (detail.data ?? null) : null;

  const setViewing = (record: CampaignRecord | null) => setViewKey(record?.uuid ?? "");

  const save = useMutation({
    mutationFn: (input: CampaignInput) =>
      editing
        ? updateCampaign(api, editing.uuid, { ...input, expectedRevision: editing.revision })
        : createCampaign(api, input),

    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["marketing", api.scopeKey] });

      setEditing(undefined);

      toast.success("Campaign saved.");
    }
  });

  const toggle = useMutation({
    mutationFn: (record: CampaignRecord) =>
      updateCampaign(api, record.uuid, {
        expectedRevision: record.revision,

        brandUuid: record.brandUuid,

        name: record.name,

        objective: record.objective,

        channel: record.channel,

        landingUrl: record.landingUrl,

        status: record.status === "active" ? "inactive" : "active"
      }),

    onSuccess: () => client.invalidateQueries({ queryKey: ["marketing", api.scopeKey] }),

    onError: (error) => toast.error(error.message)
  });

  if (
    navigation?.search.form === "new" ||
    navigation?.search.form === "edit" ||
    editing !== undefined
  ) {
    return (
      <WorkspaceUpsertPage
        title={navigation?.search.form === "edit" || editing ? "Edit Campaign" : "New Campaign"}
      >
        {detail.error ? <p role="alert">{detail.error.message}</p> : null}
        {editing !== undefined ? (
          <CampaignForm
            key={editing?.uuid ?? "new"}
            record={editing}
            pending={save.isPending}
            error={save.error?.message ?? ""}
            onCancel={() => setEditing(undefined)}
            onSubmit={(value) => save.mutate(value)}
          />
        ) : (
          <>
            <p role="status">Loading record…</p>
            <Button variant="outline" onClick={() => setEditing(undefined)}>
              Back to list
            </Button>
          </>
        )}
      </WorkspaceUpsertPage>
    );
  }

  return (
    <WorkspacePage
      variant="list"

      title="Campaigns"

      description="Manage campaigns in the current tenant and company."

      technicalName="page.marketing.campaign.list"

      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void query.refetch()}>
            Refresh
          </Button>

          <Button
            onClick={() => {
              save.reset();

              setEditing(null);
            }}
          >
            New Campaign
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        showSelectedFilterChip={false}
        filterValue={status}
        filterOptions={[
          { id: "all", label: "All statuses" },
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" }
        ]}
        onFilterValueChange={(status) =>
          setFilters((previous) => ({ ...previous, status, page: 0 }))
        }
        columnOptions={columnOptions}
        onShowAllColumns={() => setHiddenColumns([])}
        searchValue={search}

        searchPlaceholder="Search campaigns"

        onSearchValueChange={(value) => {
          setFilters((previous) => ({ ...previous, search: value, page: 0 }));
        }}
      />

      {detail.error ? <p role="alert">{detail.error.message}</p> : null}

      {query.error ? (
        <p role="alert" className="text-destructive">
          {query.error.message}
        </p>
      ) : null}

      <CampaignList
        hiddenColumns={hiddenColumns}
        records={query.data ?? []}

        loading={query.isLoading}

        onView={setViewing}

        onEdit={(record) => {
          save.reset();

          setEditing(record);
        }}

        onToggle={(record) => {
          if (
            window.confirm(
              record.status === "active" ? "Deactivate this campaign?" : "Restore this campaign?"
            )
          )
            toggle.mutate(record);
        }}
      />

      <WorkspacePagination
        page={page + 1}
        rowsPerPage={50}
        rowsPerPageOptions={[50]}
        totalCount={count.data?.total ?? 0}
        totalPages={Math.max(1, Math.ceil((count.data?.total ?? 0) / 50))}
        showingLabel={`${page * 50 + ((query.data?.length ?? 0) ? 1 : 0)}–${page * 50 + (query.data?.length ?? 0)}`}
        singularLabel="campaigns"
        onPreviousPage={() => setPage(Math.max(0, page - 1))}
        onNextPage={() => setPage(page + 1)}
        onPageChange={(next) => setPage(next - 1)}
      />

      {viewing ? (
        <CampaignShow
          record={viewing}

          onClose={() => setViewing(null)}

          onEdit={() => {
            setEditing(viewing);

            setViewing(null);
          }}
        />
      ) : null}
    </WorkspacePage>
  );
}
