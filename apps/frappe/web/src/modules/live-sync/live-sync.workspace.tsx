import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pause, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { WorkspaceSwitchCard } from "@codexsun/ui/workspace/status";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import {
  getLiveSyncJobs,
  getLiveSyncSettings,
  resyncLiveKind,
  saveLiveSyncSettings
} from "./live-sync.services";
import type { LiveSyncJob, LiveSyncKind, LiveSyncSettings } from "./live-sync.types";

const labels: Record<LiveSyncKind, string> = {
  contacts: "Contacts",
  enquiries: "Enquiries",
  activities: "Activities",
  "call-logs": "Call logs"
};
const key = ["frappe", "live-sync"];

export function FrappeLiveSyncWorkspace() {
  const client = useQueryClient();
  const settings = useQuery({ queryKey: [...key, "settings"], queryFn: getLiveSyncSettings });
  const [draft, setDraft] = useState<LiveSyncSettings | null>(null);
  useEffect(() => {
    if (settings.data) setDraft(settings.data);
  }, [settings.data]);
  const save = useMutation({
    mutationFn: saveLiveSyncSettings,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: key });
      toast.success("Live sync settings saved");
    },
    onError: (error) => toast.error(error.message)
  });
  if (!draft)
    return (
      <WorkspacePage
        title="Live sync"
        description="Schedule local changes to Frappe."
        technicalName="page.frappe.live-sync"
      >
        <p className="text-sm text-muted-foreground">Loading live sync…</p>
      </WorkspacePage>
    );
  const commit = (next: LiveSyncSettings) => {
    setDraft(next);
    save.mutate({
      enabled: next.enabled,
      paused: next.paused,
      scheduleMinutes: next.scheduleMinutes,
      modules: next.modules
    });
  };
  return (
    <WorkspacePage
      title="Live sync"
      description="Queue changed local records for Frappe. Sync stays off until enabled."
      technicalName="page.frappe.live-sync"
    >
      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Scheduled delivery</h2>
            <p className="text-sm text-muted-foreground">
              The queue sends local changes in batches of 50.
            </p>
          </div>
          <WorkspaceSwitchCard
            label="Live sync enabled"
            description="Allows scheduled Frappe delivery."
            checked={draft.enabled}
            disabled={save.isPending}
            onCheckedChange={(enabled) => commit({ ...draft, enabled })}
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            Schedule{" "}
            <select
              className="h-9 rounded-md border bg-background px-2"
              value={draft.scheduleMinutes}
              disabled={save.isPending}
              onChange={(event) =>
                commit({
                  ...draft,
                  scheduleMinutes: Number(event.target.value) as 5 | 15 | 30 | 60
                })
              }
            >
              {[5, 15, 30, 60].map((minutes) => (
                <option key={minutes} value={minutes}>
                  Every {minutes} minutes
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="outline"
            disabled={!draft.enabled || save.isPending}
            onClick={() => commit({ ...draft, paused: !draft.paused })}
          >
            {draft.paused ? <Play /> : <Pause />}
            {draft.paused ? "Resume" : "Pause"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {draft.paused ? "Paused" : draft.enabled ? "Running" : "Off"}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(labels) as LiveSyncKind[]).map((kind) => (
            <WorkspaceSwitchCard
              key={kind}
              label={labels[kind]}
              description="Include changed records in scheduled sync."
              checked={draft.modules[kind]}
              disabled={save.isPending || !draft.enabled}
              onCheckedChange={(checked) =>
                commit({ ...draft, modules: { ...draft.modules, [kind]: checked } })
              }
            />
          ))}
        </div>
      </Card>
      <p className="text-sm text-muted-foreground">
        Last schedule:{" "}
        {draft.lastScheduledAt ? new Date(draft.lastScheduledAt).toLocaleString() : "Not run"}
      </p>
    </WorkspacePage>
  );
}

export function FrappeLiveSyncQueueWorkspace() {
  const client = useQueryClient();
  const jobs = useQuery({
    queryKey: [...key, "jobs"],
    queryFn: getLiveSyncJobs,
    refetchInterval: 3000
  });
  const run = useMutation({
    mutationFn: resyncLiveKind,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: [...key, "jobs"] });
      toast.success("Live re-sync queued");
    },
    onError: (error) => toast.error(error.message)
  });
  const columns: ColumnDef<LiveSyncJob>[] = [
    { accessorKey: "id", header: "JOB" },
    { accessorKey: "kind", header: "MODULE", cell: ({ row }) => labels[row.original.kind] },
    { accessorKey: "status", header: "STATUS" },
    {
      id: "result",
      header: "RESULT",
      cell: ({ row }) =>
        row.original.progress
          ? `${row.original.progress.exported} sent · ${row.original.progress.failed} failed`
          : row.original.errorMessage || "Waiting"
    },
    {
      accessorKey: "createdAt",
      header: "QUEUED",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString()
    }
  ];
  return (
    <WorkspacePage
      title="Live sync queue"
      description="Scheduled and re-sync work waiting for Frappe."
      technicalName="page.frappe.live-sync-queue"
      actions={
        <div className="flex gap-2">
          {(Object.keys(labels) as LiveSyncKind[]).map((kind) => (
            <Button
              key={kind}
              variant="outline"
              disabled={run.isPending}
              onClick={() => run.mutate(kind)}
            >
              <RefreshCw />
              Re-sync {labels[kind]}
            </Button>
          ))}
        </div>
      }
    >
      <WorkspaceTable columns={columns} data={jobs.data ?? []} isLoading={jobs.isLoading} />
    </WorkspacePage>
  );
}
