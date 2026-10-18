import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { useFrappeConnectionSettings } from "../connection/connection.hooks";
import {
  getExportJob,
  getLocalContacts,
  getLocalEnquiries,
  getLocalActivities,
  getLocalCallLogs,
  queueContacts,
  queueEnquiries,
  queueActivities,
  queueCallLogs
} from "./export.services";
import type { ExportRequest } from "./export.services";
import type { ExportJob, LocalExportPage, LocalExportRow } from "./export.types";

type Verification = NonNullable<ExportJob["progress"]>["results"][number];

type ExportPageProps = {
  title: string;
  description: string;
  recordName: string;
  technicalName: string;
  queryKey: string;
  list: (page: number) => Promise<LocalExportPage>;
  queue: (input: ExportRequest) => Promise<{ jobId: number; status: string }>;
};

export function FrappeContactExportWorkspace() {
  return (
    <ExportPage
      title="Export mobile contacts"
      description="CRM → Frappe Mobile Contact. Exports each selected contact’s 10-digit mobile number."
      recordName="contacts"
      technicalName="page.frappe.export.contacts"
      queryKey="contacts"
      list={getLocalContacts}
      queue={queueContacts}
    />
  );
}

export function FrappeEnquiryExportWorkspace() {
  return (
    <ExportPage
      title="Export enquiries"
      description="CRM → Frappe. Verify selected local enquiries before exporting."
      recordName="enquiries"
      technicalName="page.frappe.export.enquiries"
      queryKey="enquiries"
      list={getLocalEnquiries}
      queue={queueEnquiries}
    />
  );
}

export function FrappeActivityExportWorkspace() {
  return (
    <ExportPage
      title="Export activities"
      description="CRM → Frappe. Export the parent enquiries before their activities."
      recordName="activities"
      technicalName="page.frappe.export.activities"
      queryKey="activities"
      list={getLocalActivities}
      queue={queueActivities}
    />
  );
}

export function FrappeCallLogExportWorkspace() {
  return (
    <ExportPage
      title="Export call logs"
      description="CRM → Frappe. Verify selected local call logs before exporting."
      recordName="call logs"
      technicalName="page.frappe.export.call-logs"
      queryKey="call-logs"
      list={getLocalCallLogs}
      queue={queueCallLogs}
    />
  );
}

function ExportPage({
  title,
  description,
  recordName,
  technicalName,
  queryKey,
  list,
  queue
}: ExportPageProps) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [jobId, setJobId] = useState<number | null>(null);
  const [jobMode, setJobMode] = useState<ExportRequest["mode"] | null>(null);
  const [verifiedJobId, setVerifiedJobId] = useState<number | null>(null);
  const [reportedJob, setReportedJob] = useState<number | null>(null);
  const [verification, setVerification] = useState<Record<number, Verification>>({});
  const client = useQueryClient();
  const connection = useFrappeConnectionSettings();
  const queueReady = Boolean(connection.data?.usable && connection.data.backgroundWorkerEnabled);
  const preview = useQuery({
    queryKey: ["frappe", "export", queryKey, page],
    queryFn: () => list(page)
  });
  const job = useQuery({
    queryKey: ["frappe", "export", "job", jobId],
    queryFn: () => getExportJob(jobId!),
    enabled: jobId !== null,
    refetchInterval: (query) =>
      ["pending", "running"].includes(query.state.data?.status ?? "pending") ? 2000 : false
  });
  const send = useMutation({
    mutationFn: queue,
    onSuccess: ({ jobId: queuedId }, input) => {
      setJobId(queuedId);
      setJobMode(input.mode);
      setReportedJob(null);
      if (input.mode === "verify") {
        setVerifiedJobId(null);
        setVerification({});
      }
      if (input.mode === "export") setSelected(new Set());
      toast.info(
        input.mode === "verify"
          ? `${recordName} verification queued`
          : `${recordName} export queued`
      );
    },
    onError: (error) => toast.error(error.message)
  });
  useEffect(() => {
    if (
      !job.data ||
      job.data.jobId === reportedJob ||
      ["pending", "running"].includes(job.data.status)
    )
      return;
    setReportedJob(job.data.jobId);
    if (jobMode === "verify") {
      const results = job.data.progress?.results ?? [];
      setVerification(Object.fromEntries(results.map((result) => [result.id, result])));
      if (job.data.status === "completed") setVerifiedJobId(job.data.jobId);
      if (job.data.errorMessage)
        toast.error("Verification failed", { description: job.data.errorMessage });
      else
        toast.info(
          `${results.length - (job.data.progress?.failed ?? 0)} ${recordName} ready for export`,
          {
            description: job.data.progress?.failures
              .slice(0, 2)
              .map((item) => `#${item.id}: ${item.message}`)
              .join("; ")
          }
        );
      return;
    }
    void client.invalidateQueries({ queryKey: ["frappe", "export", queryKey] });
    setVerification({});
    setVerifiedJobId(null);
    if (job.data.status === "completed" && !job.data.progress?.failed)
      toast.success(`${job.data.progress?.exported ?? 0} ${recordName} exported`);
    else
      toast.warning(`${recordName} export needs attention`, {
        description:
          job.data.errorMessage ||
          job.data.progress?.failures
            .slice(0, 2)
            .map((item) => `#${item.id}: ${item.message}`)
            .join("; ")
      });
  }, [client, job.data, jobMode, queryKey, recordName, reportedJob]);
  const records = preview.data?.items ?? [];
  const eligible = records.filter((item) => !item.dependency);
  const total = preview.data?.total ?? 0;
  const pageSize = preview.data?.pageSize ?? 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const busy =
    send.isPending || ["pending", "running"].includes(job.data?.status ?? (jobId ? "pending" : ""));
  const verified = (id: number) =>
    verifiedJobId !== null &&
    ["new", "matched", "linked"].includes(verification[id]?.outcome ?? "");
  const selectedVerified = selected.size > 0 && [...selected].every(verified);
  const columns: ColumnDef<LocalExportRow>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          aria-label={`Select all ${recordName} on page`}
          checked={eligible.length > 0 && eligible.every((item) => selected.has(item.id))}
          disabled={busy || !eligible.length || !queueReady}
          onCheckedChange={(checked) =>
            setSelected(checked === true ? new Set(eligible.map((item) => item.id)) : new Set())
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${recordName} #${row.original.id}`}
          checked={selected.has(row.original.id)}
          disabled={busy || !!row.original.dependency || !queueReady}
          onCheckedChange={(checked) =>
            setSelected((current) => {
              const next = new Set(current);
              if (checked === true) next.add(row.original.id);
              else next.delete(row.original.id);
              return next;
            })
          }
        />
      )
    },
    { accessorKey: "id", header: "LOCAL ID" },
    { accessorKey: "label", header: "RECORD" },
    { accessorKey: "detail", header: "DETAILS" },
    {
      id: "verification",
      header: "VERIFICATION",
      cell: ({ row }) =>
        verification[row.original.id]?.message ||
        verification[row.original.id]?.outcome ||
        "Not checked"
    },
    {
      id: "frappe",
      header: "FRAPPE",
      cell: ({ row }) =>
        verification[row.original.id]?.remoteName || row.original.remoteName || "Not exported"
    },
    {
      id: "ready",
      header: "READY",
      cell: ({ row }) =>
        row.original.dependency ||
        (verification[row.original.id]?.outcome === "blocked"
          ? "Blocked"
          : verified(row.original.id)
            ? "Ready"
            : "Not checked")
    },
    {
      id: "action",
      header: "ACTION",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !!row.original.dependency}
            onClick={() => send.mutate({ ids: [row.original.id], mode: "verify" })}
          >
            Verify
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={
              busy || !verified(row.original.id) || !!row.original.dependency || !queueReady
            }
            onClick={() =>
              send.mutate({ ids: [row.original.id], mode: "export", verifiedJobId: verifiedJobId! })
            }
          >
            Export
          </Button>
        </div>
      )
    }
  ];
  return (
    <WorkspacePage
      title={title}
      description={description}
      technicalName={technicalName}
      actions={
        <Button
          variant="outline"
          disabled={preview.isFetching}
          onClick={() => void preview.refetch()}
        >
          <RefreshCw className="size-4" /> Refresh
        </Button>
      }
    >
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">{selected.size} selected</span>
        <Button
          variant="outline"
          disabled={!selected.size || busy || !queueReady}
          onClick={() => send.mutate({ ids: [...selected], mode: "verify" })}
        >
          Verify selected
        </Button>
        <Button
          disabled={!selectedVerified || busy || !queueReady}
          onClick={() =>
            send.mutate({ ids: [...selected], mode: "export", verifiedJobId: verifiedJobId! })
          }
        >
          Export selected
        </Button>
      </div>
      {preview.error ? (
        <p role="alert" className="text-sm text-destructive">
          {preview.error.message}
        </p>
      ) : null}
      {connection.data && !connection.data.usable ? (
        <p role="alert" className="text-sm text-amber-700">
          Verify and enable the Frappe connection before exporting.
        </p>
      ) : null}
      {connection.data?.usable && !connection.data.backgroundWorkerEnabled ? (
        <p role="alert" className="text-sm text-amber-700">
          Background worker is disabled. CRM → Frappe exports are queued and cannot run until it is
          enabled.
        </p>
      ) : null}
      {job.data ? (
        <p role="status" className="text-sm text-muted-foreground">
          {jobMode === "verify" ? "Verification" : "Export"} job #{job.data.jobId}:{" "}
          {job.data.status} · {job.data.progress?.scanned ?? 0} checked ·{" "}
          {job.data.progress?.exported ?? 0} exported · {job.data.progress?.failed ?? 0} failed
        </p>
      ) : null}
      <WorkspaceTable
        columns={columns}
        data={records}
        isLoading={preview.isLoading}
        emptyState={`No local ${recordName} found.`}
        minWidth="900px"
      />
      <WorkspacePagination
        className="mt-3"
        page={page}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[pageSize]}
        showingLabel={buildShowingLabel(page, pageSize, total)}
        singularLabel={recordName.slice(0, -1)}
        totalCount={total}
        totalPages={totalPages}
        onNextPage={() => {
          setPage((value) => Math.min(totalPages, value + 1));
          setSelected(new Set());
        }}
        onPageChange={(value) => {
          setPage(value);
          setSelected(new Set());
        }}
        onPreviousPage={() => {
          setPage((value) => Math.max(1, value - 1));
          setSelected(new Set());
        }}
      />
    </WorkspacePage>
  );
}
