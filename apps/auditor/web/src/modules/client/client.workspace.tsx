import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue, useWorkspaceRecordSelection } from "@codexsun/ui/workspace/navigation";
import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { AuditorClientForm } from "./client.form";
import { auditorClientsQueryKey, useAuditorClient, useAuditorClients } from "./client.hooks";
import { AuditorClientList, clientListColumns } from "./client.list";
import { AuditorClientShowPage } from "./client.show";
import type { AuditorClientGateway } from "./client.services";
import type { AuditorClientRecord, AuditorClientSavePayload } from "./client.types";

export function AuditorClientWorkspace({
  gateway,
  initialRecordId,
  onRecordNavigate
}: {
  gateway: AuditorClientGateway;
  initialRecordId?: string | undefined;
  onRecordNavigate: (recordId: string | null) => void;
}) {
  const listTools = useWorkspaceListTools(clientListColumns);
  const client = useQueryClient();

  const viewingId = parseRecordId(initialRecordId);
  const [search, setSearch] = useWorkspaceQueryValue("q", "");
  const [status, setStatus] = useWorkspaceQueryValue("status", "all");
  const [page, setPage] = useWorkspaceQueryValue("page", 1);
  const [rowsPerPage, setRowsPerPage] = useWorkspaceQueryValue("pageSize", 20);
  const query = useAuditorClients(gateway);
  const [editing, setEditing] = useWorkspaceRecordSelection<AuditorClientRecord>(query.data ?? [], (record) => String(record.id));
  const selectedQuery = useAuditorClient(gateway, viewingId);
  const openClient = (id: number) => onRecordNavigate(String(id));
  const showClients = () => onRecordNavigate(null);
  const save = useMutation({
    mutationFn: (payload: AuditorClientSavePayload) =>
      editing ? gateway.update(editing.id, payload) : gateway.create(payload),
    onSuccess: async (record) => {
      await client.invalidateQueries({ queryKey: auditorClientsQueryKey });
      toast.success(`Client ${editing ? "updated" : "created"}`, { description: record.name });
      setEditing(undefined);
      openClient(record.id);
    },
    onError: (error) => toast.error("Unable to save client", { description: error.message })
  });
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data ?? []).filter((record) => listTools.matches(record)).filter(
      (record) =>
        (status === "all" || record.status === status) &&
        (!term ||
          [
            record.name,
            record.companyName,
            record.ownerName,
            record.mobile,
            record.email,
            record.gstin
          ].some((field) => field?.toLowerCase().includes(term)))
    );
  }, [query.data, search, status, JSON.stringify(listTools.filters)]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const records = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  if (editing !== undefined) {
    return (
      <AuditorClientForm
        key={editing?.id ?? "new"}
        record={editing}
        loading={save.isPending}
        error={save.error?.message ?? ""}
        onBack={() => setEditing(undefined)}
        onSubmit={(payload) => save.mutate(payload)}
      />
    );
  }
  if (viewingId !== null) {
    return (
      <AuditorClientShowPage
        record={selectedQuery.data}
        gateway={gateway}
        loading={selectedQuery.isLoading}
        error={selectedQuery.error?.message ?? null}
        onBack={showClients}
        onEdit={setEditing}
        onRetry={() => void selectedQuery.refetch()}
      />
    );
  }
  return (
    <WorkspacePage variant="list"
      title="Clients"
      description="Manage the auditor office client directory."
      technicalName="page.auditor.clients.list"
      actions={
        <div className="flex gap-2">
          
          <Button type="button" onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            New client
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        toolbarAction={listTools.toolbarAction}
        columnOptions={listTools.columnOptions}
        onShowAllColumns={listTools.onShowAllColumns}
        searchPlaceholder="Search clients"
        searchValue={search}
        onSearchValueChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filterValue={status}
        onFilterValueChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All statuses" },
          { id: "active", label: "Active", count: (query.data ?? []).filter((record) => record.status === "active").length },
          { id: "inactive", label: "Inactive", count: (query.data ?? []).filter((record) => record.status === "inactive").length }
        ]}
      />
      {query.error ? (
        <p role="alert" className="text-sm text-destructive">
          {query.error.message}
        </p>
      ) : null}
      <AuditorClientList
        listTools={listTools}
        records={records}
        loading={query.isLoading}
        onEdit={setEditing}
        onView={(record) => openClient(record.id)}
        startNumber={(currentPage - 1) * rowsPerPage + 1}
      />
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filtered.length)}
        singularLabel="client"
        totalCount={filtered.length}
        totalPages={totalPages}
        onNextPage={() => setPage((value) => Math.min(totalPages, value + 1))}
        onPageChange={setPage}
        onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(1);
        }}
      />
    </WorkspacePage>
  );
}

function parseRecordId(value: string | null | undefined) {
  const id = Number(value);
  return value && Number.isSafeInteger(id) && id > 0 ? id : null;
}
