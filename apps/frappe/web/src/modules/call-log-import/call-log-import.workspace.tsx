import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { formatDateTime } from "@codexsun/ui/workspace/utils";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { useFrappeConnectionSettings } from "../connection/connection.hooks";
import {
  getFrappeCallLogs,
  pullFrappeCallLog,
  startFrappeCallLogImport,
  getFrappeCallLogImport
} from "./call-log-import.services";
import type { FrappeCallLog } from "./call-log-import.types";

export function FrappeCallLogImportWorkspace() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<number | null>(null);
  const client = useQueryClient();
  const connection = useFrappeConnectionSettings();
  const connectionUsable = Boolean(connection.data?.usable);
  const batchReady = connectionUsable && Boolean(connection.data?.backgroundWorkerEnabled);
  const preview = useQuery({
    queryKey: ["frappe", "call-logs", page],
    queryFn: () => getFrappeCallLogs(page)
  });
  const job = useQuery({
    queryKey: ["frappe", "call-logs", "job", jobId],
    queryFn: () => getFrappeCallLogImport(jobId!),
    enabled: jobId !== null,
    refetchInterval: (query) =>
      ["pending", "running"].includes(query.state.data?.status || "") ? 2000 : false
  });
  const startAll = useMutation({
    mutationFn: startFrappeCallLogImport,
    onSuccess: (result) => {
      setJobId(result.jobId);
      toast.info("Call log import queued");
    },
    onError: (error) => toast.error(error.message)
  });
  const importSelected = useMutation({
    mutationFn: async (names: string[]) => {
      let imported = 0;
      const failures: string[] = [];
      setProgress(0);
      for (const name of names) {
        try {
          await pullFrappeCallLog(name);
          imported += 1;
        } catch (error) {
          failures.push(`${name}: ${error instanceof Error ? error.message : "Import failed"}`);
        }
        setProgress((value) => value + 1);
      }
      return { imported, failures };
    },
    onSuccess: async ({ imported, failures }) => {
      await client.invalidateQueries({ queryKey: ["frappe", "call-logs"] });
      setSelected(new Set());
      if (failures.length)
        toast.warning(`${imported} call logs imported`, {
          description: failures.slice(0, 3).join("; ")
        });
      else toast.success(`${imported} call logs imported`);
    }
  });
  const records = preview.data?.items ?? [];
  const eligible = records.filter((item) => !item.localCallLogId);
  const running = job.data?.status === "pending" || job.data?.status === "running";
  useEffect(() => {
    if (job.data?.status === "completed")
      void client.invalidateQueries({ queryKey: ["frappe", "call-logs"] });
  }, [client, job.data?.status]);
  const columns: ColumnDef<FrappeCallLog>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          aria-label="Select all call logs on page"
          checked={eligible.length > 0 && eligible.every((item) => selected.has(item.name))}
          disabled={!eligible.length || importSelected.isPending || running}
          onCheckedChange={(checked) =>
            setSelected(checked === true ? new Set(eligible.map((item) => item.name)) : new Set())
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select call log ${row.original.name}`}
          checked={selected.has(row.original.name)}
          disabled={
            !!row.original.localCallLogId ||
            importSelected.isPending ||
            running ||
            !connectionUsable
          }
          onCheckedChange={(checked) =>
            setSelected((current) => {
              const next = new Set(current);
              if (checked === true) next.add(row.original.name);
              else next.delete(row.original.name);
              return next;
            })
          }
        />
      )
    },
    { accessorKey: "name", header: "FRAPPE ID" },
    { accessorKey: "from", header: "FROM" },
    { accessorKey: "to", header: "TO" },
    { accessorKey: "direction", header: "DIRECTION" },
    {
      id: "started",
      header: "STARTED",
      cell: ({ row }) => (row.original.startedAt ? formatDateTime(row.original.startedAt) : "—")
    },
    {
      id: "local",
      header: "LOCAL CALL",
      cell: ({ row }) =>
        row.original.localCallLogId ? `#${row.original.localCallLogId}` : "Not imported"
    },
    {
      id: "action",
      header: "ACTION",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          disabled={importSelected.isPending || !!row.original.localCallLogId || !connectionUsable}
          onClick={() => importSelected.mutate([row.original.name])}
        >
          Import
        </Button>
      )
    }
  ];
  return (
    <WorkspacePage
      title="Import call logs"
      description="Frappe → local CRM. Selected rows import immediately; import-all runs in the background."
      technicalName="page.frappe.call-logs"
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
      {connection.error ? (
        <p role="alert" className="text-sm text-destructive">
          {connection.error.message}
        </p>
      ) : connection.data && !connectionUsable ? (
        <p role="alert" className="text-sm text-amber-700">
          Verify and enable the Frappe connection before importing.
        </p>
      ) : connection.data?.backgroundWorkerEnabled ? null : (
        <p role="alert" className="text-sm text-amber-700">
          Background worker is disabled. Import selected call logs individually or enable the worker
          before starting a batch.
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">{selected.size} selected</span>
        <Button
          variant="outline"
          disabled={!batchReady || running || startAll.isPending || importSelected.isPending}
          onClick={() => startAll.mutate()}
        >
          {running ? "Import running…" : "Import all unlinked"}
        </Button>
        <Button
          disabled={!selected.size || !connectionUsable || importSelected.isPending || running}
          onClick={() => importSelected.mutate([...selected])}
        >
          {importSelected.isPending
            ? `Importing ${progress}/${importSelected.variables?.length ?? 0}…`
            : "Import selected"}
        </Button>
      </div>
      {job.data ? (
        <p role="status" className="text-sm">
          Batch #{job.data.jobId}: {job.data.status}
          {job.data.progress
            ? ` · ${job.data.progress.created} imported, ${job.data.progress.skipped} skipped, ${job.data.progress.failed} failed`
            : ""}
        </p>
      ) : null}
      {job.data?.errorMessage || preview.error ? (
        <p role="alert" className="text-sm text-destructive">
          {job.data?.errorMessage || preview.error?.message}
        </p>
      ) : null}
      <WorkspaceTable
        columns={columns}
        data={records}
        isLoading={preview.isLoading}
        emptyState="No Frappe call logs found."
        minWidth="900px"
      />
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm">Page {page}</span>
        <Button
          variant="outline"
          disabled={page === 1 || preview.isFetching}
          onClick={() => {
            setPage(page - 1);
            setSelected(new Set());
          }}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={!preview.data?.hasMore || preview.isFetching}
          onClick={() => {
            setPage(page + 1);
            setSelected(new Set());
          }}
        >
          Next
        </Button>
      </div>
    </WorkspacePage>
  );
}
