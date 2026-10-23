import { WorkspaceUpsertPage } from "@codexsun/ui/workspace/upsert";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";

import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";

import { useWorkspaceQueryState, useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";

import { useQuery } from "@tanstack/react-query";

import { getSubmission, countSubmissions } from "./submission.services";

import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

import { Button } from "@codexsun/ui/components/button";

import { WorkspacePage } from "@codexsun/ui/workspace/page";

import { useMarketingTransport } from "../../transport";

import { useSubmissions } from "./submission.hooks";

import { saveSubmission, retrySubmission } from "./submission.services";

import { SubmissionList } from "./submission.list";

import { SubmissionForm } from "./submission.form";

import { SubmissionShow } from "./submission.show";

import { SubmissionImport } from "./submission.import";

import type { SubmissionInput, SubmissionRecord } from "./submission.types";

export function SubmissionWorkspace() {
  const api = useMarketingTransport(),
    client = useQueryClient();

  const [filters, setFilters] = useWorkspaceQueryState({ page: 0, search: "", status: "all" });
  const [hiddenColumnKeys, setHiddenColumnKeys] = useWorkspaceQueryValue("hiddenColumns", "");
  const hiddenColumns = hiddenColumnKeys.split(",").filter(Boolean);
  const setHiddenColumns = (next: string[] | ((previous: string[]) => string[])) =>
    setHiddenColumnKeys((typeof next === "function" ? next(hiddenColumns) : next).join(","));
  const [formMode, setFormMode] = useWorkspaceQueryValue("form", "");
  const create = formMode === "new";
  const setCreate = (value: boolean) => setFormMode(value ? "new" : "");

  const { search, status } = filters;
  const page = Math.max(0, Math.min(100000, Math.trunc(filters.page)));

  const setPage = (page: number) => setFilters((previous) => ({ ...previous, page }));

  const [importing, setImporting] = useState(false),
    [viewKey, setViewKey] = useWorkspaceQueryValue("show", "");

  const detail = useQuery({
    queryKey: ["marketing", api.scopeKey, "submission", viewKey],
    queryFn: () => getSubmission(api, viewKey),
    enabled: Boolean(viewKey)
  });

  const viewing = viewKey ? (detail.data ?? null) : null;

  const setViewing = (row: SubmissionRecord | null) => setViewKey(row?.uuid ?? "");

  const count = useQuery({
    queryKey: ["marketing", api.scopeKey, "submission", "count", search, status],
    queryFn: () => countSubmissions(api, search, status)
  });

  const query = useSubmissions(page, search, status);

  const refresh = () =>
    client.invalidateQueries({ queryKey: ["marketing", api.scopeKey, "submission"] });

  const save = useMutation({
    mutationFn: (input: SubmissionInput) => saveSubmission(api, input),

    onSuccess: async () => {
      setCreate(false);

      await refresh();

      toast.success("Submission saved.");
    }
  });

  const retry = useMutation({
    mutationFn: (uuid: string) => retrySubmission(api, uuid),

    onSuccess: async () => {
      await refresh();

      toast.success("CRM handoff requested.");
    },

    onError: (error) => toast.error(error.message)
  });

  if (create)
    return (
      <WorkspaceUpsertPage title="New submission">
        <SubmissionForm
          pending={save.isPending}
          error={save.error?.message ?? ""}
          onClose={() => setCreate(false)}
          onSubmit={(value) => save.mutate(value)}
        />
      </WorkspaceUpsertPage>
    );
  return (
    <WorkspacePage
      title="Submissions"

      variant="list"

      description="Captured leads, consent evidence, and CRM delivery."

      technicalName="page.marketing.submission.list"

      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void query.refetch()}>
            Refresh
          </Button>

          <Button variant="outline" onClick={() => setImporting(true)}>
            Import
          </Button>

          <Button
            onClick={() => {
              save.reset();

              setCreate(true);
            }}
          >
            New submission
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        showSelectedFilterChip={false}
        filterValue={status}
        filterOptions={[
          { id: "all", label: "All handoffs" },
          { id: "pending", label: "Pending handoff" },
          { id: "delivered", label: "CRM linked" }
        ]}
        onFilterValueChange={(status) =>
          setFilters((previous) => ({ ...previous, status, page: 0 }))
        }
        columnOptions={[
          { id: "name", label: "Name" },
          { id: "campaignLabel", label: "Campaign" },
          { id: "email", label: "Email" },
          { id: "phone", label: "Phone" },
          { id: "status", label: "Handoff" }
        ].map((column) => ({
          ...column,
          checked: !hiddenColumns.includes(column.id),
          onCheckedChange: (checked: boolean) =>
            setHiddenColumns((previous) =>
              checked ? previous.filter((id) => id !== column.id) : [...previous, column.id]
            )
        }))}
        onShowAllColumns={() => setHiddenColumns([])}
        searchValue={search}
        searchPlaceholder="Search submissions"
        onSearchValueChange={(search) =>
          setFilters((previous) => ({ ...previous, page: 0, search }))
        }
      />

      {detail.error ? <p role="alert">{detail.error.message}</p> : null}

      {query.error ? <p role="alert">{query.error.message}</p> : null}

      <SubmissionList
        hiddenColumns={hiddenColumns}
        records={query.data ?? []}
        loading={query.isLoading}
        onView={setViewing}
      />

      <WorkspacePagination
        page={page + 1}
        rowsPerPage={50}
        rowsPerPageOptions={[50]}
        totalCount={count.data?.total ?? 0}
        totalPages={Math.max(1, Math.ceil((count.data?.total ?? 0) / 50))}
        singularLabel="submissions"
        showingLabel={`${page * 50 + ((query.data?.length ?? 0) ? 1 : 0)}–${page * 50 + (query.data?.length ?? 0)}`}
        onPreviousPage={() => setPage(Math.max(0, page - 1))}
        onNextPage={() => setPage(page + 1)}
        onPageChange={(next) => setPage(next - 1)}
      />

      {importing ? (
        <SubmissionImport onClose={() => setImporting(false)} onSaved={() => void refresh()} />
      ) : null}

      {viewing ? (
        <SubmissionShow
          record={(query.data ?? []).find((row) => row.uuid === viewing.uuid) ?? viewing}

          onClose={() => setViewing(null)}

          onRetry={() => retry.mutate(viewing.uuid)}

          pending={retry.isPending}
        />
      ) : null}
    </WorkspacePage>
  );
}
