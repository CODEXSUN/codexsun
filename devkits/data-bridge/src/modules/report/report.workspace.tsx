import { BusinessReportWorkspace } from "../business-import/index.js";
import { formatDateTime } from "@codexsun/ui/workspace/utils";
import { useEffect, useState } from "react";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { listBridgeReports, getCommonBulkReport } from "./report.services.js";
import { CommonBulkReportPanel } from "./report.bulk.report.js";
import {
  getCommonTableImport,
  TableImportReviewWorkspace,
  type CommonTableSelection
} from "../import-review/index.js";
import type { BridgeReportSummary, CommonBulkReport } from "./report.types.js";

export function ReportWorkspace({
  recordId,
  kind,
  onOpen,
  onResume
}: {
  recordId?: string;
  kind?: string;
  onOpen: (type?: string, id?: string) => void;
  onResume: (group: string, stage: number, id: string) => void;
}) {
  const [records, setRecords] = useState<BridgeReportSummary[]>([]),
    [bulk, setBulk] = useState<CommonBulkReport | null>(null),
    [review, setReview] = useState<CommonTableSelection | null>(null),
    [error, setError] = useState(""),
    [group, setGroup] = useState("all"),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    setBulk(null);
    setReview(null);
    void (async () => {
      const list = await listBridgeReports();
      if (active) setRecords(list);
      if (recordId && kind === "bulk") {
        const value = await getCommonBulkReport(recordId);
        if (active) setBulk(value);
      }
      if (recordId && kind === "review") {
        const value = await getCommonTableImport(recordId);
        if (active)
          setReview({
            sourceId: value.sourceId,
            targetTenantId: value.targetTenantId,
            table: value.table,
            importId: value.id
          });
      }
    })().catch((cause: Error) => {
      if (active) setError(cause.message);
    });
    return () => {
      active = false;
    };
  }, [recordId, kind, reload]);
  if (recordId && kind === "business")
    return (
      <WorkspacePage
        title="Business import report"
        actions={
          <Button variant="outline" onClick={() => onOpen()}>
            Back to reports
          </Button>
        }
      >
        <BusinessReportWorkspace key={recordId} id={recordId} />
      </WorkspacePage>
    );
  if (review)
    return (
      <TableImportReviewWorkspace
        selection={review}
        onBack={() => onOpen()}
        onOpenSaved={(id) => onOpen("review", id)}
      />
    );
  return (
    <WorkspacePage
      title="Report"
      actions={
        <Button variant="outline" onClick={() => setReload((value) => value + 1)}>
          Refresh
        </Button>
      }
    >
      {error ? (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {bulk ? (
        <>
          <Button className="mb-3" variant="outline" onClick={() => onOpen()}>
            Back to reports
          </Button>
          <CommonBulkReportPanel
            report={bulk}
            onOpenTable={(selection) => {
              if (selection.importId) onOpen("review", selection.importId);
              else
                setError(
                  "Use View row results to inspect this table's saved source and target data."
                );
            }}
          />
        </>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Saved imports and audit reports</h2>
            <select
              className="h-9 rounded border bg-background px-3 text-sm"
              aria-label="Report group"
              value={group}
              onChange={(event) => setGroup(event.target.value)}
            >
              <option value="all">All groups</option>
              <option value="common">Common Tables</option>
              <option value="masters">Master Tables</option>
              <option value="billing">Billing Tables</option>
              <option value="business">All business data</option>
              <option value="legacy">Legacy imports</option>
            </select>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  {[
                    "Group",
                    "Source → target",
                    "Table / report",
                    "Rows",
                    "Status",
                    "Updated",
                    "Action"
                  ].map((label) => (
                    <th key={label} className="p-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records
                  .filter((record) => group === "all" || record.group === group)
                  .map((record) => (
                    <tr className="border-b" key={`${record.type}-${record.id}`}>
                      <td className="p-3">
                        {record.group === "masters"
                          ? "Master Tables"
                          : record.group === "common"
                            ? "Common Tables"
                            : record.group === "billing"
                              ? "Billing Tables"
                              : record.group === "business"
                                ? "All business data"
                                : "Legacy"}
                      </td>
                      <td className="p-3">
                        {record.sourceDatabase} → {record.targetDatabase}
                      </td>
                      <td className="p-3">{record.table}</td>
                      <td className="p-3">{record.rows}</td>
                      <td className="p-3">
                        <WorkspaceStatusBadge
                          label={record.status}
                          tone={
                            ["success", "completed", "imported"].includes(record.status)
                              ? "success"
                              : record.status === "failed"
                                ? "danger"
                                : record.status === "warning"
                                  ? "warning"
                                  : "info"
                          }
                        />
                      </td>
                      <td className="whitespace-nowrap p-3">{formatDateTime(record.updatedAt)}</td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            record.type === "transfer"
                              ? onResume(record.group, record.stage, record.id)
                              : onOpen(record.type, record.id)
                          }
                        >
                          {record.type === "transfer" ? "Open import" : "View report"}
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!records.some((record) => group === "all" || record.group === group) ? (
            <p className="p-5 text-center text-sm text-muted-foreground">
              No saved imports or reports.
            </p>
          ) : null}
        </>
      )}
    </WorkspacePage>
  );
}
