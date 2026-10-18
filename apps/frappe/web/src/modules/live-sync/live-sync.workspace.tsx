import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pause, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { WorkspaceSwitchCard } from "@codexsun/ui/workspace/status";
import { useFrappeConnectionSettings } from "../connection/connection.hooks";
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
  const connection = useFrappeConnectionSettings();
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
        description="Scheduled enquiry sync between CRM and the connected Frappe site."
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
      description="Enquiries sync in both directions. Other enabled modules continue to send CRM changes to Frappe."
      technicalName="page.frappe.live-sync"
    >
      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Scheduled CRM and Frappe sync</h2>
            <p className="text-sm text-muted-foreground">
              Enquiries are checked in both directions. Other module changes are sent to Frappe in
              batches of 50.
            </p>
          </div>
          <WorkspaceSwitchCard
            label="Live sync enabled"
            description="Allows scheduled enquiry sync in both directions."
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
            {draft.paused
              ? "Paused"
              : !draft.enabled
                ? "Off"
                : draft.backgroundWorkerEnabled
                  ? "Scheduled"
                  : "Worker disabled"}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(labels) as LiveSyncKind[]).map((kind) => (
            <WorkspaceSwitchCard
              key={kind}
              label={labels[kind]}
              description={
                kind === "enquiries"
                  ? "Send CRM changes and check Frappe for new or updated enquiries."
                  : "Include changed records in scheduled CRM-to-Frappe sync."
              }
              checked={draft.modules[kind]}
              disabled={save.isPending || !draft.enabled}
              onCheckedChange={(checked) =>
                commit({ ...draft, modules: { ...draft.modules, [kind]: checked } })
              }
            />
          ))}
        </div>
      </Card>
      {!connection.data?.usable ? (
        <p role="alert" className="text-sm text-amber-700">
          Verify and enable the Frappe connection before scheduled exports can run.
        </p>
      ) : null}
      {connection.data?.usable && !draft.backgroundWorkerEnabled ? (
        <p role="alert" className="text-sm text-amber-700">
          Background worker is disabled. Settings can be saved, but scheduled and manual exports
          will not be queued.
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Last schedule:{" "}
        {draft.lastScheduledAt ? new Date(draft.lastScheduledAt).toLocaleString() : "Not run"}
      </p>
    </WorkspacePage>
  );
}

export function FrappeLiveSyncQueueWorkspace() {
  const client = useQueryClient();
  const connection = useFrappeConnectionSettings();
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
          ? row.original.direction === "inbound"
            ? `${row.original.progress.created ?? 0} imported · ${row.original.progress.skipped ?? 0} unchanged · ${row.original.progress.failed} failed`
            : `${row.original.progress.exported ?? 0} sent · ${row.original.progress.failed} failed`
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
      description="CRM → Frappe. View queued outbound exports and request manual re-syncs."
      technicalName="page.frappe.live-sync-queue"
      actions={
        <div className="flex gap-2">
          {(Object.keys(labels) as LiveSyncKind[]).map((kind) => (
            <Button
              key={kind}
              variant="outline"
              disabled={
                run.isPending ||
                !connection.data?.usable ||
                !connection.data.backgroundWorkerEnabled
              }
              onClick={() => run.mutate(kind)}
            >
              <RefreshCw />
              Re-sync {labels[kind]}
            </Button>
          ))}
        </div>
      }
    >
      {connection.data && !connection.data.usable ? (
        <p role="alert" className="text-sm text-amber-700">
          Verify and enable the Frappe connection before requesting an export.
        </p>
      ) : null}
      {connection.data?.usable && !connection.data.backgroundWorkerEnabled ? (
        <p role="alert" className="text-sm text-amber-700">
          Background worker is disabled. Queued CRM → Frappe exports cannot run yet.
        </p>
      ) : null}
      <WorkspaceTable columns={columns} data={jobs.data ?? []} isLoading={jobs.isLoading} />
    </WorkspacePage>
  );
}
