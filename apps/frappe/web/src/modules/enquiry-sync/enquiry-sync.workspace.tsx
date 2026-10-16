import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { Input } from "@codexsun/ui/components/input";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import {
  enquiryImportKey,
  remoteEnquiriesKey,
  useConnectionState,
  useEnquiryImport,
  useRemoteEnquiries
} from "./enquiry-sync.hooks";
import { EnquiryImportPanel } from "./enquiry-sync.import";
import { RemoteEnquiryList } from "./enquiry-sync.list";
import { pullEnquiry, startImport } from "./enquiry-sync.services";

type PullResult = {
  completed: number;
  failures: { name: string; message: string }[];
  total: number;
};

export function FrappeEnquiryImportWorkspace() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PullResult | null>(null);
  const connection = useConnectionState();
  const remote = useRemoteEnquiries(true, page, rowsPerPage);
  const importJob = useEnquiryImport(true);
  const importBusy = importJob.data?.status === "pending" || importJob.data?.status === "running";
  const connected = Boolean(connection.data?.configured && connection.data.enabled);
  const records = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (remote.data?.items ?? []).filter(
      (record) =>
        !term ||
        [record.name, record.title, record.mobile ?? "", record.status ?? ""].some((value) =>
          value.toLowerCase().includes(term)
        )
    );
  }, [remote.data, search]);

  const importMutation = useMutation({
    mutationFn: startImport,
    onSuccess: async () => {
      setSelected(new Set());
      setResult(null);
      await client.invalidateQueries({ queryKey: enquiryImportKey });
      toast.info("Frappe enquiry import queued");
    },
    onError: (error) => toast.error("Could not queue import", { description: error.message })
  });

  useEffect(() => {
    if (importJob.data?.status === "completed" || importJob.data?.status === "failed") {
      void client.invalidateQueries({ queryKey: remoteEnquiriesKey });
    }
  }, [client, importJob.data?.jobId, importJob.data?.status]);

  const pull = useMutation({
    mutationFn: async (names: string[]): Promise<PullResult> => {
      const failures: PullResult["failures"] = [];
      let completed = 0;
      setProgress(0);
      for (const name of names) {
        try {
          await pullEnquiry(name);
          completed += 1;
        } catch (error) {
          failures.push({
            name,
            message: error instanceof Error ? error.message : "Import failed."
          });
        }
        setProgress((value) => value + 1);
      }
      return { completed, failures, total: names.length };
    },
    onSuccess: async (summary) => {
      setResult(summary);
      setSelected(new Set());
      await client.invalidateQueries({ queryKey: remoteEnquiriesKey });
      if (summary.failures.length)
        toast.warning(`${summary.completed} of ${summary.total} enquiries imported`);
      else toast.success(`${summary.completed} enquiries imported`);
    },
    onError: (error) => toast.error("Enquiry import failed", { description: error.message })
  });

  const busy = pull.isPending || importBusy;
  const total = remote.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const changePage = (next: number) => {
    if (remote.isFetching || busy || next < 1 || next > totalPages) return;
    setPage(next);
    setSelected(new Set());
    setResult(null);
  };

  return (
    <WorkspacePage
      title="Import enquiries"
      description="Review Frappe enquiries and select records to copy into local CRM."
      technicalName="page.frappe.enquiry-import"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={busy || remote.isFetching}
            onClick={() => void remote.refetch()}
          >
            <RefreshCw className="size-4" /> Refresh
          </Button>
        </div>
      }
    >
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Frappe enquiries</h2>
            <p className="text-xs text-muted-foreground">
              {connection.data?.baseUrl || "Configure a Frappe connection before importing."}
            </p>
          </div>
          <span
            className={`text-xs font-medium ${connected ? "text-emerald-700" : "text-amber-700"}`}
          >
            {connected ? "Connection enabled" : "Connection unavailable"}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <Button
            variant="outline"
            disabled={!selected.size || busy}
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
          <Button
            disabled={!connected || !selected.size || busy}
            onClick={() => pull.mutate([...selected])}
          >
            {pull.isPending
              ? `Importing ${progress}/${pull.variables?.length ?? 0}…`
              : "Import selected"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          A linked enquiry updates its local CRM record. Local changes made after its last import
          block that update.
        </p>
      </Card>
      <EnquiryImportPanel
        connected={connected}
        busy={pull.isPending}
        job={importJob.data}
        starting={importMutation.isPending}
        onStart={() => importMutation.mutate()}
      />
      {connection.error || remote.error || importJob.error ? (
        <p role="alert" className="text-sm text-destructive">
          {connection.error?.message ?? remote.error?.message ?? importJob.error?.message}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <CountCard label="Frappe enquiries on page" value={remote.data?.items.length} />
        <CountCard
          label="Linked on page"
          value={remote.data?.items.filter((record) => record.localEnquiryId).length}
        />
        <CountCard
          label="Not imported on page"
          value={remote.data?.items.filter((record) => !record.localEnquiryId).length}
        />
      </div>
      {result ? (
        <Card className="space-y-2 p-4" role="status">
          <p className="text-sm font-medium">
            {result.completed} of {result.total} enquiries imported
          </p>
          {result.failures.map((failure) => (
            <p key={failure.name} className="text-xs text-destructive">
              {failure.name}: {failure.message}
            </p>
          ))}
        </Card>
      ) : null}
      <div className="max-w-xl">
        <Input
          aria-label="Search this Frappe page"
          placeholder="Search this Frappe page"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setSelected(new Set());
          }}
        />
      </div>
      <RemoteEnquiryList
        records={records}
        loading={remote.isLoading}
        selected={selected}
        busy={busy}
        enabled={connected}
        onSelect={(name, checked) =>
          setSelected((current) => {
            const next = new Set(current);
            if (checked) next.add(name);
            else next.delete(name);
            return next;
          })
        }
        onSelectAll={(checked) =>
          setSelected(checked ? new Set(records.map((record) => record.name)) : new Set())
        }
        onPull={(name) => pull.mutate([name])}
      />
      <WorkspacePagination
        page={page}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(page, rowsPerPage, total)}
        singularLabel="enquiries"
        totalCount={total}
        totalPages={totalPages}
        onNextPage={() => changePage(page + 1)}
        onPageChange={changePage}
        onPreviousPage={() => changePage(page - 1)}
        onRowsPerPageChange={(value) => {
          if (remote.isFetching || busy) return;
          setRowsPerPage(value);
          setPage(1);
          setSelected(new Set());
          setResult(null);
        }}
      />
    </WorkspacePage>
  );
}

function CountCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value ?? "—"}</p>
    </Card>
  );
}
