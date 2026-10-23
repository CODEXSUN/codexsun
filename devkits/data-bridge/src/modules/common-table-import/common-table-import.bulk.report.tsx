import { CommonBulkRows } from "./common-table-import.bulk.rows.js";
import { Fragment, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableHeaderCell } from "@codexsun/ui/workspace/table";
import { formatDateTime } from "@codexsun/ui/workspace/utils";
import type { CommonBulkReport } from "./common-table-import.types.js";
import type { CommonTableSelection } from "./common-table-list.workspace.js";

export function CommonBulkReportPanel({
  report,
  onOpenTable
}: {
  report: CommonBulkReport;
  onOpenTable: (selection: CommonTableSelection) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [attentionOnly, setAttentionOnly] = useState(false);
  const needingAttention = report.tables.filter((table) => table.status === "warning");
  const shown = attentionOnly ? needingAttention : report.tables;
  return (
    <section
      className="space-y-3 rounded-md border bg-card p-4"
      aria-label="Combined import report"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Combined import report</h2>
          <p className="text-xs text-muted-foreground">
            {report.sourceDatabase} → {report.targetDatabase} · {formatDateTime(report.updatedAt)} ·{" "}
            {report.actor}
          </p>
        </div>
        <WorkspaceStatusBadge
          label={report.status}
          tone={
            report.status === "success"
              ? "success"
              : report.status === "warning"
                ? "warning"
                : report.status === "failed"
                  ? "danger"
                  : "info"
          }
        />
      </div>
      <p className="text-sm">
        {report.tables.filter((table) => ["success", "warning"].includes(table.status)).length}/
        {report.tables.length || 31} tables checked ·{" "}
        {report.tables.reduce((sum, table) => sum + table.inserted, 0)} inserted ·{" "}
        {report.tables.reduce((sum, table) => sum + table.existing, 0)} existing ·{" "}
        {needingAttention.length} tables need attention
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={
            report.status === "failed"
              ? "text-sm text-destructive"
              : "text-sm text-muted-foreground"
          }
        >
          {report.message}
        </p>
        <Button
          variant={attentionOnly ? "default" : "outline"}
          aria-pressed={attentionOnly}
          onClick={() => setAttentionOnly((value) => !value)}
        >
          Needs attention only
        </Button>
      </div>
      <div className="max-h-[34rem] overflow-auto rounded-md border [scrollbar-width:thin]">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              {["Table", "Source", "Existing", "Inserted", "Result", "Details"].map((name) => (
                <WorkspaceTableHeaderCell key={name}>{name}</WorkspaceTableHeaderCell>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {shown.map((table) => (
              <Fragment key={table.table}>
                <tr className={table.status === "warning" ? "bg-amber-500/5" : ""}>
                  <td className="p-3 font-medium">
                    <button
                      className="cursor-pointer text-left underline-offset-4 hover:underline"
                      onClick={() =>
                        onOpenTable({
                          sourceId: report.sourceId,
                          targetTenantId: report.targetTenantId,
                          table: table.table,
                          ...(table.importId ? { importId: table.importId } : {})
                        })
                      }
                    >
                      {table.table}
                    </button>
                  </td>
                  <td className="p-3">{table.sourceRows}</td>
                  <td className="p-3">{table.existing}</td>
                  <td className="p-3">{table.inserted}</td>
                  <td className="p-3">
                    <WorkspaceStatusBadge
                      label={table.status}
                      tone={
                        table.status === "warning"
                          ? "warning"
                          : table.status === "success"
                            ? "success"
                            : "neutral"
                      }
                    />
                  </td>
                  <td className="p-3">
                    <p>{table.message}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-expanded={expanded === table.table}
                      onClick={() => setExpanded(expanded === table.table ? null : table.table)}
                    >
                      View row results
                    </Button>
                    {table.attention.length ? (
                      <details>
                        <summary className="cursor-pointer text-amber-800">
                          {table.attention.length} items need attention
                        </summary>
                        <ul className="mt-2 space-y-1">
                          {table.attention.map((issue, index) => (
                            <li key={index} className="rounded bg-amber-500/10 p-2 text-xs">
                              {issue.rowId === null ? "Table" : `Source ID ${issue.rowId}`} ·{" "}
                              {issue.message}
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </td>
                </tr>
                {expanded === table.table ? (
                  <tr>
                    <td colSpan={6}>
                      <CommonBulkRows key={`${report.id}-${table.table}`} table={table} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
            {!shown.length ? (
              <tr>
                <td colSpan={6} className="p-5 text-center text-muted-foreground">
                  {attentionOnly
                    ? "No records or tables need attention."
                    : "Waiting for the worker…"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
