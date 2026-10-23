import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceUpsertPage } from "@codexsun/ui/workspace/upsert";
import { useWorkspaceQueryState, useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";
import { useMarketingTransport } from "../../transport";
import { useConsents } from "./consent.hooks";
import { appendConsent, getConsent } from "./consent.services";
import { ConsentList } from "./consent.list";
import { ConsentForm } from "./consent.form";
import { ConsentShow } from "./consent.show";
import type { ConsentInput } from "./consent.types";
export function ConsentWorkspace() {
  const api = useMarketingTransport(),
    client = useQueryClient();
  const [filters, setFilters] = useWorkspaceQueryState({ search: "", action: "all", page: 0 });
  const page = Math.max(0, Math.min(100000, Math.trunc(filters.page)));
  const [form, setForm] = useWorkspaceQueryValue("form", "");
  const [show, setShow] = useWorkspaceQueryValue("show", "");
  const [hiddenColumnKeys, setHiddenColumnKeys] = useWorkspaceQueryValue("hiddenColumns", "");
  const hiddenColumns = hiddenColumnKeys.split(",").filter(Boolean);
  const setHiddenColumns = (next: string[] | ((previous: string[]) => string[])) =>
    setHiddenColumnKeys((typeof next === "function" ? next(hiddenColumns) : next).join(","));
  const { list, count } = useConsents(filters.search, filters.action, page);
  const detail = useQuery({
    queryKey: ["marketing", api.scopeKey, "consent-detail", show],
    queryFn: () => getConsent(api, show),
    enabled: !!show
  });
  const save = useMutation({
    mutationFn: (value: ConsentInput) => appendConsent(api, value),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["marketing", api.scopeKey] });
      setForm("");
      toast.success("Consent evidence recorded.");
    }
  });
  if (form === "new")
    return (
      <WorkspaceUpsertPage title="Record consent evidence">
        <ConsentForm
          pending={save.isPending}
          error={save.error?.message ?? ""}
          onCancel={() => setForm("")}
          onSubmit={(value) => save.mutate(value)}
        />
      </WorkspaceUpsertPage>
    );
  if (show)
    return (
      <WorkspacePage title="Consent evidence" onBack={() => setShow("")}>
        {detail.error ? (
          <p role="alert">{detail.error.message}</p>
        ) : detail.data ? (
          <ConsentShow key={detail.data.uuid} record={detail.data} onClose={() => setShow("")} />
        ) : (
          <p role="status">Loading evidence…</p>
        )}
      </WorkspacePage>
    );
  return (
    <WorkspacePage
      variant="list"
      title="Consent"
      technicalName="page.marketing.consent.list"
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => {
              void list.refetch();
              void count.refetch();
            }}
          >
            Refresh
          </Button>
          <Button
            onClick={() => {
              save.reset();
              setForm("new");
            }}
          >
            Record consent
          </Button>
        </>
      }
    >
      <WorkspaceFilters
        showSelectedFilterChip={false}
        searchValue={filters.search}
        searchPlaceholder="Search recipient email"
        onSearchValueChange={(search) =>
          setFilters((previous) => ({ ...previous, search, page: 0 }))
        }
        filterValue={filters.action}
        filterOptions={[
          { id: "all", label: "All evidence" },
          { id: "grant", label: "Grants" },
          { id: "withdraw", label: "Withdrawals" }
        ]}
        onFilterValueChange={(action) =>
          setFilters((previous) => ({ ...previous, action, page: 0 }))
        }
        columnOptions={[
          { id: "recipient", label: "Recipient" },
          { id: "brandUuid", label: "Brand" },
          { id: "action", label: "Evidence" },
          { id: "noticeVersion", label: "Notice version" },
          { id: "createdBy", label: "Recorded by" },
          { id: "createdAt", label: "Recorded at" }
        ].map((column) => ({
          ...column,
          checked: !hiddenColumns.includes(column.id),
          onCheckedChange: (checked: boolean) =>
            setHiddenColumns((previous) =>
              checked ? previous.filter((id) => id !== column.id) : [...previous, column.id]
            )
        }))}
        onShowAllColumns={() => setHiddenColumns([])}
      />
      {list.error || count.error ? (
        <p role="alert">{list.error?.message ?? count.error?.message}</p>
      ) : null}
      <ConsentList
        records={list.data ?? []}
        loading={list.isLoading}
        hiddenColumns={hiddenColumns}
        onView={(row) => setShow(row.uuid)}
      />
      <WorkspacePagination
        page={page + 1}
        rowsPerPage={50}
        rowsPerPageOptions={[50]}
        totalCount={count.data?.total ?? 0}
        totalPages={Math.max(1, Math.ceil((count.data?.total ?? 0) / 50))}
        singularLabel="evidence entries"
        showingLabel={`${page * 50 + ((list.data?.length ?? 0) ? 1 : 0)}–${page * 50 + (list.data?.length ?? 0)}`}
        onPreviousPage={() =>
          setFilters((previous) => ({ ...previous, page: Math.max(0, page - 1) }))
        }
        onNextPage={() => setFilters((previous) => ({ ...previous, page: page + 1 }))}
        onPageChange={(next) => setFilters((previous) => ({ ...previous, page: next - 1 }))}
      />
    </WorkspacePage>
  );
}
