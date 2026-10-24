import { useEffect, useState } from "react";
import { RefreshCwIcon } from "lucide-react";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { Button } from "@codexsun/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@codexsun/ui/components/dialog";
import { useCommonBulkImport } from "./common-table-import.bulk.hooks.js";
import { CommonBulkReportPanel } from "./common-table-import.bulk.report.js";
import {
  listCommonTableImports,
  listCommonTables,
  listDataBridgeSources,
  listDataBridgeTenants
} from "./common-table-import.services.js";
import type {
  CommonTableImportSummary,
  CommonTableOption,
  DataBridgeSource,
  DataBridgeTenant
} from "./common-table-import.types.js";

export type CommonTableSelection = {
  sourceId: number;
  targetTenantId: number;
  table: string;
  importId?: string;
};

export function CommonTableListWorkspace({
  onOpenTable,
  scope = "common"
}: {
  scope?: "common" | "masters";
  onOpenTable: (selection: CommonTableSelection) => void;
}) {
  const [sources, setSources] = useState<DataBridgeSource[]>([]);
  const [tenants, setTenants] = useState<DataBridgeTenant[]>([]);
  const [imports, setImports] = useState<CommonTableImportSummary[]>([]);
  const [sourceId, setSourceId] = useState(0);
  const [targetTenantId, setTargetTenantId] = useState(0);
  const [tables, setTables] = useState<CommonTableOption[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const bulk = useCommonBulkImport(sourceId, targetTenantId, scope);
  const [confirmBulk, setConfirmBulk] = useState(false);

  function startBulk() {
    setConfirmBulk(true);
  }

  async function loadLookups() {
    setBusy(true);
    setError("");
    try {
      const [sourceOptions, tenantOptions, saved] = await Promise.all([
        listDataBridgeSources(),
        listDataBridgeTenants(),
        listCommonTableImports()
      ]);
      setSources(sourceOptions);
      setTenants(tenantOptions);
      setImports(saved);
      setSourceId((current) => current || sourceOptions[0]?.id || 0);
      setTargetTenantId((current) => current || tenantOptions[0]?.id || 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the connection list.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshPage() {
    setBusy(true);
    setError("");
    try {
      const [sourceOptions, tenantOptions, saved] = await Promise.all([
        listDataBridgeSources(),
        listDataBridgeTenants(),
        listCommonTableImports()
      ]);
      const activeSourceId = sourceId || sourceOptions[0]?.id || 0;
      const activeTargetId = targetTenantId || tenantOptions[0]?.id || 0;
      const currentTables =
        activeSourceId && activeTargetId
          ? await listCommonTables(activeSourceId, activeTargetId, scope)
          : [];
      setSources(sourceOptions);
      setTenants(tenantOptions);
      setImports(saved);
      setTables(currentTables);
      setSourceId(activeSourceId);
      setTargetTenantId(activeTargetId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to refresh common tables.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadLookups();
  }, []);
  useEffect(() => {
    if (bulk.report && ["success", "warning", "failed"].includes(bulk.report.status))
      void refreshPage();
  }, [bulk.report?.id, bulk.report?.status]);
  useEffect(() => {
    if (!sourceId || !targetTenantId) {
      setTables([]);
      return;
    }
    setBusy(true);
    setError("");
    void listCommonTables(sourceId, targetTenantId, scope)
      .then(setTables)
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Unable to inspect common tables.")
      )
      .finally(() => setBusy(false));
  }, [sourceId, targetTenantId, scope]);

  return (
    <WorkspacePage
      title={scope === "masters" ? "Core Masters" : "Common Tables"}
      description={
        scope === "masters"
          ? "Contacts, companies, products, work orders, and their child records."
          : "Review the common master tables available between the selected source and target."
      }
      actions={
        <Button
          disabled={busy || bulk.starting || bulk.active || !sourceId || !targetTenantId}
          onClick={startBulk}
        >
          {bulk.active ? "Audit and import running…" : "Audit & import all missing rows"}
        </Button>
      }
    >
      <div className="space-y-4">
        <Dialog open={confirmBulk} onOpenChange={setConfirmBulk}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Audit and import missing Core data</DialogTitle>
              <DialogDescription>
                {sources.find((item) => item.id === sourceId)?.database} →{" "}
                {tenants.find((item) => item.id === targetTenantId)?.database}.{" "}
                {scope === "masters"
                  ? "All Core masters and their common parents"
                  : "All common tables"}{" "}
                are audited in parent order. Existing records are preserved and conflicts are
                reported.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmBulk(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setConfirmBulk(false);
                  void bulk.start();
                }}
              >
                Start audit & import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <section className="rounded-md border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium">
              Source connection
              <select
                className="h-10 rounded-md border bg-background px-3 font-normal"
                value={sourceId || ""}
                onChange={(event) => setSourceId(Number(event.target.value))}
              >
                <option value="">Select source</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label} · {source.database}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Target tenant
              <select
                className="h-10 rounded-md border bg-background px-3 font-normal"
                value={targetTenantId || ""}
                onChange={(event) => setTargetTenantId(Number(event.target.value))}
              >
                <option value="">Select target tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.label}
                    {tenant.database ? ` · ${tenant.database}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {error || bulk.error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error || bulk.error}
          </div>
        ) : null}
        {bulk.report ? (
          <CommonBulkReportPanel
            key={bulk.report.id}
            report={bulk.report}
            onOpenTable={onOpenTable}
          />
        ) : null}

        <section className="overflow-hidden rounded-md border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold">
              {scope === "masters" ? "Core master availability" : "Common table availability"}{" "}
              <span className="text-muted-foreground">
                · {tables.length}/{scope === "masters" ? 16 : 31}
              </span>
            </h2>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm"
              type="button"
              disabled={busy}
              onClick={() => void refreshPage()}
            >
              <RefreshCwIcon className="size-4" />
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Table</th>
                  <th className="px-4 py-3">Source rows</th>
                  <th className="px-4 py-3">Target rows</th>
                  <th className="px-4 py-3">Availability</th>
                  <th className="px-4 py-3">Schema differences</th>
                  <th className="px-4 py-3">Import</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tables.map((table) => {
                  const saved = imports.find(
                    (item) =>
                      item.sourceId === sourceId &&
                      item.targetTenantId === targetTenantId &&
                      item.table === table.table
                  );
                  const outcome = bulk.report?.tables.find((entry) => entry.table === table.table);
                  const ready = table.sourceAvailable && table.targetAvailable && table.compatible;
                  return (
                    <tr
                      key={table.table}
                      className={
                        bulk.report?.tables.some(
                          (entry) => entry.table === table.table && entry.status === "warning"
                        )
                          ? "bg-amber-500/5"
                          : ""
                      }
                    >
                      <td className="px-4 py-3 font-medium">{table.table}</td>
                      <td className="px-4 py-3">{table.sourceRows ?? "—"}</td>
                      <td className="px-4 py-3">{table.targetRows ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusLabel
                          ready={ready}
                          text={
                            !table.sourceAvailable
                              ? "Missing at source"
                              : !table.targetAvailable
                                ? "Missing at target"
                                : !table.compatible
                                  ? "Schema mismatch"
                                  : "Ready"
                          }
                        />
                      </td>
                      <td className="max-w-64 px-4 py-3 text-xs text-muted-foreground">
                        {table.missingRequiredColumns.length || table.mismatchedColumns.length
                          ? [
                              ...(table.missingRequiredColumns.length
                                ? [`Required: ${table.missingRequiredColumns.join(", ")}`]
                                : []),
                              ...(table.mismatchedColumns.length
                                ? [`Type: ${table.mismatchedColumns.join(", ")}`]
                                : [])
                            ].join(" · ")
                          : table.missingTargetColumns.length
                            ? `Optional: ${table.missingTargetColumns.join(", ")}`
                            : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {outcome && ["success", "warning"].includes(outcome.status) ? (
                          <StatusLabel
                            ready={outcome.status === "success"}
                            text={
                              outcome.status === "success"
                                ? `Verified · ${outcome.inserted + outcome.existing} rows`
                                : `Warning · ${outcome.attention.length} records`
                            }
                          />
                        ) : saved ? (
                          `${saved.status} · ${saved.rowCount} rows`
                        ) : (
                          "Not prepared"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={
                            !table.sourceAvailable ||
                            !table.targetAvailable ||
                            busy ||
                            !sourceId ||
                            !targetTenantId
                          }
                          className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                          onClick={() =>
                            onOpenTable({
                              sourceId,
                              targetTenantId,
                              table: table.table,
                              ...(saved ? { importId: saved.id } : {})
                            })
                          }
                        >
                          {saved
                            ? "Open review"
                            : table.compatible
                              ? "Review data"
                              : "Inspect table"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!tables.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                      {busy
                        ? "Loading common tables…"
                        : "Choose an active source and target tenant."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-md border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">Saved import reviews</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Table</th>
                  <th className="px-4 py-3">Source → target</th>
                  <th className="px-4 py-3">Rows</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {imports
                  .filter(
                    (item) =>
                      item.sourceId === sourceId &&
                      item.targetTenantId === targetTenantId &&
                      tables.some((table) => table.table === item.table)
                  )
                  .map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium">{item.table}</td>
                      <td className="px-4 py-3">
                        {item.sourceDatabase} → {item.targetDatabase}
                      </td>
                      <td className="px-4 py-3">{item.rowCount}</td>
                      <td className="px-4 py-3">
                        {item.importedRows} imported · {item.skippedRows} skipped
                      </td>
                      <td className="px-4 py-3">
                        <StatusLabel ready={item.status === "imported"} text={item.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="rounded-md border px-3 py-1.5"
                          onClick={() =>
                            onOpenTable({
                              sourceId,
                              targetTenantId,
                              table: item.table,
                              importId: item.id
                            })
                          }
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                {!imports.some(
                  (item) =>
                    item.sourceId === sourceId &&
                    item.targetTenantId === targetTenantId &&
                    tables.some((table) => table.table === item.table)
                ) ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                      No table import reviews are saved for this connection pair.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </WorkspacePage>
  );
}

function StatusLabel({ ready, text }: { ready: boolean; text: string }) {
  return (
    <span
      className={
        ready
          ? "inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700"
          : "inline-flex rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-700"
      }
    >
      {text}
    </span>
  );
}
