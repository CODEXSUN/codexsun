import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableHeaderCell, WorkspaceTablePanel } from "@codexsun/ui/workspace/table";
import {
  listMigrationAuditQueue,
  deleteMigrationAuditItem,
  markMigrationAuditReviewed,
  readMigrationAuditItem,
  runReviewedMigration,
  type MigrationAuditQueueItem,
  type MigrationAuditQueueSummary
} from "./migration.services.js";

export function MigrationAuditWorkspace() {
  const [items, setItems] = useState<MigrationAuditQueueSummary[]>([]);
  const [detail, setDetail] = useState<MigrationAuditQueueItem | null>(null);
  const [openingId, setOpeningId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  async function refresh() {
    setError("");
    try {
      setItems(await listMigrationAuditQueue());
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not load the migration audit queue."
      );
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function openItem(id: string) {
    setOpeningId(id);
    setError("");
    try {
      setDetail(await readMigrationAuditItem(id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the audit details.");
    } finally {
      setOpeningId("");
    }
  }

  async function markReviewed() {
    if (!detail || detail.status !== "queued") return;
    setBusy(true);
    setError("");
    try {
      const updated = await markMigrationAuditReviewed(detail.id);
      setDetail(updated);
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast.success("Migration SQL dump marked as reviewed.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update audit status.");
    } finally {
      setBusy(false);
    }
  }

  async function removeAuditItem(id: string) {
    if (!window.confirm("Delete this saved audit item and its sample data?")) return;
    setDeletingId(id);
    setError("");
    try {
      await deleteMigrationAuditItem(id);
      setItems((current) => current.filter((item) => item.id !== id));
      if (detail?.id === id) setDetail(null);
      toast.success("Saved audit item deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete the audit item.");
    } finally {
      setDeletingId("");
    }
  }

  return detail ? (
    <AuditDetailPage
      item={detail}
      error={error}
      busy={busy}
      onBack={() => {
        setDetail(null);
        setError("");
      }}
      onMarkReviewed={() => void markReviewed()}
      onDelete={() => void removeAuditItem(detail.id)}
      deleting={deletingId === detail.id}
    />
  ) : (
    <AuditQueuePage
      items={items}
      error={error}
      openingId={openingId}
      onRefresh={() => void refresh()}
      onOpen={(id) => void openItem(id)}
      onDelete={(id) => void removeAuditItem(id)}
      deletingId={deletingId}
    />
  );
}

export function MigrationRunQueueWorkspace() {
  const [items, setItems] = useState<MigrationAuditQueueSummary[]>([]);
  const [error, setError] = useState("");
  const [runningId, setRunningId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  async function refresh() {
    setError("");
    try {
      setItems(await listMigrationAuditQueue());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the migration queue.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function runNow(item: MigrationAuditQueueSummary) {
    setRunningId(item.id);
    setError("");
    try {
      const result = await runReviewedMigration(item.id);
      toast.success(`Migration completed · ${result.copiedRows} rows copied.`);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not run the migration.");
      await refresh();
    } finally {
      setRunningId("");
    }
  }

  async function removeItem(item: MigrationAuditQueueSummary) {
    if (!window.confirm("Remove this saved audit item from the migration queue?")) return;
    setDeletingId(item.id);
    setError("");
    try {
      await deleteMigrationAuditItem(item.id);
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      toast.success("Migration queue item removed.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not remove the queue item.");
    } finally {
      setDeletingId("");
    }
  }

  const reviewed = items.filter((item) => item.status === "reviewed");
  return (
    <WorkspacePage
      title="Migration Queue"
      action={
        <Button type="button" variant="outline" onClick={() => void refresh()}>
          Refresh
        </Button>
      }
    >
      {error ? <AuditError message={error} /> : null}
      <WorkspaceTablePanel>
        <div className="workspace-scroll overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="sticky top-0 bg-muted/50">
              <tr>
                <WorkspaceTableHeaderCell>Migration</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Table pair</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Selected samples</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Plan</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Migration status</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Actions</WorkspaceTableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {reviewed.map((item) => {
                const ready =
                  item.planStatus === "finalized" &&
                  item.migrationStatus !== "running" &&
                  item.migrationStatus !== "completed";
                return (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{item.sessionName}</td>
                    <td className="px-3 py-2">
                      {item.sourceTable} → {item.targetTable}
                    </td>
                    <td className="px-3 py-2">{item.selectedRows}</td>
                    <td className="px-3 py-2">{item.planStatus ?? "not generated"}</td>
                    <td className="px-3 py-2">{item.migrationStatus}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          disabled={!ready || Boolean(runningId)}
                          onClick={() => void runNow(item)}
                        >
                          {runningId === item.id
                            ? "Running…"
                            : item.migrationStatus === "completed"
                              ? "Completed"
                              : "Run now"}
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          title="Remove from migration queue"
                          aria-label={`Delete queue item for ${item.sourceTable}`}
                          disabled={Boolean(deletingId) || item.migrationStatus !== "draft"}
                          onClick={() => void removeItem(item)}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {reviewed.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    No reviewed migrations are in the queue.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </WorkspaceTablePanel>
      <p className="text-xs text-muted-foreground">
        Run now executes the finalized session plan across its mapped tables. Selected samples are
        audit evidence only.
      </p>
    </WorkspacePage>
  );
}

function AuditQueuePage({
  items,
  error,
  openingId,
  onRefresh,
  onOpen,
  onDelete,
  deletingId
}: {
  items: MigrationAuditQueueSummary[];
  error: string;
  openingId: string;
  onRefresh: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  deletingId: string;
}) {
  return (
    <WorkspacePage
      title="Migration Audit"
      action={
        <Button type="button" variant="outline" onClick={onRefresh}>
          Refresh
        </Button>
      }
    >
      {error ? <AuditError message={error} /> : null}
      <WorkspaceTablePanel>
        <div className="workspace-scroll overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="sticky top-0 bg-muted/50">
              <tr>
                <WorkspaceTableHeaderCell>Migration</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Table pair</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Rows</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Snapshot</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Queued</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Action</WorkspaceTableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{item.sessionName}</td>
                  <td className="px-3 py-2">
                    {item.sourceTable} → {item.targetTable}
                  </td>
                  <td className="px-3 py-2">{item.selectedRows}</td>
                  <td className="px-3 py-2 font-mono text-xs">{item.planHash.slice(0, 12)}</td>
                  <td className="px-3 py-2">{new Date(item.queuedAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <WorkspaceStatusBadge status={item.status} />
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={Boolean(openingId)}
                      onClick={() => onOpen(item.id)}
                    >
                      {openingId === item.id ? "Opening…" : "Open"}
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      title="Delete saved audit item"
                      aria-label={`Delete audit item for ${item.sourceTable}`}
                      disabled={Boolean(deletingId) || item.migrationStatus !== "draft"}
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                    No migration audit items are queued.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </WorkspaceTablePanel>
    </WorkspacePage>
  );
}

function AuditDetailPage({
  item,
  error,
  busy,
  onBack,
  onMarkReviewed,
  onDelete,
  deleting
}: {
  item: MigrationAuditQueueItem;
  error: string;
  busy: boolean;
  onBack: () => void;
  onMarkReviewed: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const generatedColumns = new Set(["id", "uuid", "created_at", "updated_at"]);
  const columns = [
    ...new Set(item.samples.flatMap((sample) => Object.keys(sample.rowData)))
  ].filter((column) => !generatedColumns.has(column.toLowerCase()));
  return (
    <WorkspacePage
      title={`${item.sourceTable} → ${item.targetTable}`}
      description={item.sessionName}
      action={
        <Button type="button" variant="outline" onClick={onBack}>
          Back to audit list
        </Button>
      }
    >
      {error ? <AuditError message={error} /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {item.sourceDatabase} → {item.targetDatabase} · {item.selectedRows} selected samples ·
          queued by {item.queuedBy}
        </p>
        <WorkspaceStatusBadge status={item.status} />
      </div>
      <section className="space-y-2" aria-label="Selected source data">
        <h2 className="font-semibold">Selected source data</h2>
        {item.samples.length ? (
          <WorkspaceTablePanel>
            <div className="workspace-scroll max-h-[42vh] overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-sm">
                <thead className="sticky top-0 bg-muted/50">
                  <tr>
                    {columns.map((column) => (
                      <WorkspaceTableHeaderCell key={column}>{column}</WorkspaceTableHeaderCell>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {item.samples.map((sample) => (
                    <tr key={sample.rowNumber} className="border-b last:border-0">
                      {columns.map((column) => (
                        <td
                          key={column}
                          className="max-w-80 truncate px-3 py-2"
                          title={formatValue(sample.rowData[column])}
                        >
                          {formatValue(sample.rowData[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WorkspaceTablePanel>
        ) : (
          <p className="text-sm text-muted-foreground">
            No saved sample data is available for this item.
          </p>
        )}
      </section>
      <section className="space-y-2" aria-label="Raw migration SQL">
        <h2 className="font-semibold">Raw SQL template</h2>
        <pre className="max-h-[45vh] overflow-auto rounded-md border bg-muted/30 p-4 font-mono text-xs leading-5">
          {item.queryDump}
        </pre>
      </section>
      <div className="flex items-center justify-between">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          title="Delete saved audit item and sample data"
          aria-label="Delete saved audit item"
          disabled={deleting || item.migrationStatus !== "draft"}
          onClick={onDelete}
        >
          <Trash2 className="text-destructive" />
        </Button>
        <Button type="button" disabled={busy || item.status !== "queued"} onClick={onMarkReviewed}>
          {busy ? "Saving…" : item.status === "reviewed" ? "Audit reviewed" : "Mark audit reviewed"}
        </Button>
      </div>
    </WorkspacePage>
  );
}

function AuditError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </div>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
