import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import {
  getCommonTableImport,
  getCommonTableImportRows,
  listDataBridgeSources,
  listDataBridgeTenants,
  previewCommonTable,
  runCommonTableImport,
  saveCommonTableImport
} from "./common-table-import.services.js";
import type {
  CommonTableImportDetail,
  CommonTablePreview,
  DataBridgeSource,
  DataBridgeTenant
} from "./common-table-import.types.js";
import { TableDataWorkspace } from "./table-data.workspace.js";
import { SavedImportPreview } from "./saved-import-preview.js";
import { ImportReport } from "./import-report.js";
import { auditCommonTableImport } from "./common-table-import.services.js";
import type { CommonTableSelection } from "./common-table-list.workspace.js";

export function TableImportReviewWorkspace({
  selection,
  onBack,
  onOpenSaved
}: {
  selection?: CommonTableSelection;
  onBack: () => void;
  onOpenSaved: (id: string) => void;
}) {
  const [sources, setSources] = useState<DataBridgeSource[]>([]);
  const [tenants, setTenants] = useState<DataBridgeTenant[]>([]);
  const [preview, setPreview] = useState<CommonTablePreview>();
  const [saved, setSaved] = useState<CommonTableImportDetail>();
  const [savedRows, setSavedRows] = useState<Array<Record<string, unknown>>>([]);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [editing, setEditing] = useState(false);

  async function refresh() {
    if (!selection) return;
    setBusy(true);
    setError("");
    try {
      const [sourceOptions, tenantOptions, tablePreview, savedDetail, savedPage] =
        await Promise.all([
          listDataBridgeSources(),
          listDataBridgeTenants(),
          previewCommonTable(selection.sourceId, selection.targetTenantId, selection.table, page),
          selection.importId
            ? getCommonTableImport(selection.importId)
            : Promise.resolve(undefined),
          selection.importId
            ? getCommonTableImportRows(selection.importId, page)
            : Promise.resolve([])
        ]);
      setSources(sourceOptions);
      setTenants(tenantOptions);
      setPreview(tablePreview);
      setSaved(savedDetail);
      setSavedRows(savedPage.map((row) => row.data));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the table review.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [selection?.sourceId, selection?.targetTenantId, selection?.table, selection?.importId, page]);

  async function saveReview(rowIds: number[], columns: string[]) {
    if (!selection) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await saveCommonTableImport(
        selection.sourceId,
        selection.targetTenantId,
        selection.table,
        rowIds,
        columns
      );
      setPage(1);
      setConfirmed(false);
      setEditing(false);
      onOpenSaved(result.id);
      setMessage(`Saved ${result.rows} source rows for review.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save the table review.");
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    if (!saved || !confirmed || editing || saved.report?.phase !== "audit") return;
    const accepted = window.confirm(
      `Import ${saved.rowCount} saved rows from ${saved.table} into ${saved.targetDatabase}? Existing matching records will be kept and skipped.`
    );
    if (!accepted) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await runCommonTableImport(saved.id);
      setMessage(
        `Import complete · ${result.imported} inserted · ${result.skipped} existing rows skipped.`
      );
      await refresh();
    } catch (cause) {
      await refresh();
      setError(cause instanceof Error ? cause.message : "The import did not complete.");
    } finally {
      setBusy(false);
    }
  }

  async function auditImport() {
    if (!saved) return;
    setBusy(true);
    setError("");
    setConfirmed(false);
    try {
      const report = await auditCommonTableImport(saved.id);
      setSaved({ ...saved, report });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to audit selected rows.");
    } finally {
      setBusy(false);
    }
  }

  const source = sources.find((item) => item.id === selection?.sourceId);
  const target = tenants.find((item) => item.id === selection?.targetTenantId);
  const sourceRows = preview?.source ?? [];
  const headings = preview?.columns ?? [];

  if (!selection) {
    return (
      <WorkspacePage title="Table Import Review" onBack={onBack}>
        <section className="rounded-md border bg-card p-5">
          Select a common table from the Common Tables page to review its source and target data.
        </section>
      </WorkspacePage>
    );
  }

  return (
    <WorkspacePage
      title="Table Import Review"
      description={`${selection.table} · ${source?.database ?? "source"} → ${target?.database ?? "target"}`}
      onBack={onBack}
    >
      <div className="space-y-4">
        {error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}
        {message ? (
          <div
            role="status"
            className="rounded-md border border-emerald-600/30 bg-emerald-600/5 p-3 text-sm text-emerald-800"
          >
            {message}
          </div>
        ) : null}
        {saved?.error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {saved.error}
          </div>
        ) : null}

        <section className="rounded-md border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{selection.table}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {preview?.sourceRows ?? saved?.rowCount ?? "—"} source rows ·{" "}
                {preview?.targetRows ?? "—"} target rows · {headings.length} shared fields
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {saved ? (
                <button
                  type="button"
                  className="h-9 rounded-md border px-3 text-sm"
                  disabled={busy || saved.status !== "reviewed" || editing}
                  onClick={() => void auditImport()}
                >
                  Audit selected rows
                </button>
              ) : null}
              {saved ? (
                <button
                  type="button"
                  disabled={busy}
                  className="h-9 rounded-md border px-3 text-sm disabled:opacity-50"
                  onClick={() => {
                    setEditing((value) => !value);
                    setConfirmed(false);
                    setPage(1);
                  }}
                >
                  {editing ? "View saved review" : "Select different rows"}
                </button>
              ) : null}
              {saved ? (
                <button
                  type="button"
                  disabled={
                    busy ||
                    saved.status !== "reviewed" ||
                    saved.report?.phase !== "audit" ||
                    !confirmed ||
                    editing
                  }
                  className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
                  onClick={() => void runImport()}
                >
                  Import saved rows
                </button>
              ) : null}
            </div>
          </div>
          {preview && !preview.compatible ? (
            <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-800">
              Target table schema needs attention
              {preview.missingRequiredColumns.length
                ? ` · required source fields missing: ${preview.missingRequiredColumns.join(", ")}`
                : " · shared field types differ"}
              .
            </p>
          ) : null}
          {saved ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Saved snapshot · {saved.rowCount} rows · {saved.status}
              {saved.status === "imported"
                ? ` · ${saved.importedRows} inserted · ${saved.skippedRows} already existed`
                : ""}
            </p>
          ) : null}
        </section>

        {saved && !editing ? (
          <SavedImportPreview
            saved={saved}
            rows={savedRows}
            confirmed={confirmed}
            onConfirm={setConfirmed}
          />
        ) : (
          <TableDataWorkspace
            key={`${selection.sourceId}:${selection.targetTenantId}:${selection.table}:${selection.importId ?? "live"}`}
            columns={headings}
            sourceRows={sourceRows}
            targetRows={preview?.target ?? []}
            sourceTitle={`Source · ${source?.database ?? ""}`}
            targetTitle={`Target · ${target?.database ?? ""}`}
            page={page}
            busy={busy}
            onRefresh={() => void refresh()}
            onSave={(rowIds, columns) => void saveReview(rowIds, columns)}
          />
        )}

        {saved?.report && !editing ? <ImportReport report={saved.report} /> : null}
        <div className="flex items-center justify-between rounded-md border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {saved
              ? `Saved snapshot · page ${page} · ${saved.rowCount} rows`
              : `Page ${page} · up to ${preview?.pageSize ?? 100} rows per side`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm"
              disabled={busy || page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              <ChevronLeftIcon className="size-4" />
              Previous
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm"
              disabled={
                busy ||
                (saved && !editing
                  ? saved.rowCount
                  : Math.max(
                      saved?.rowCount ?? 0,
                      preview?.sourceRows ?? 0,
                      preview?.targetRows ?? 0
                    )) <=
                  page * (preview?.pageSize ?? 100)
              }
              onClick={() => setPage((value) => value + 1)}
            >
              Next
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </WorkspacePage>
  );
}
