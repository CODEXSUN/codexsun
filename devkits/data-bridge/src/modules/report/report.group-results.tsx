import { useEffect, useState } from "react";
import { CommonBulkReportPanel } from "./report.bulk.report.js";
import { latestCommonBulkReport } from "./report.services.js";
import type { CommonBulkReport } from "./report.types.js";
export function GroupImportResults({
  sourceId,
  targetTenantId,
  scope,
  onReport
}: {
  sourceId: number;
  targetTenantId: number;
  scope: "common" | "masters";
  onReport: (id: string) => void;
}) {
  const [report, setReport] = useState<CommonBulkReport | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setReport(null);
    setError("");
    void latestCommonBulkReport(sourceId, targetTenantId, scope)
      .then((value) => {
        if (active) setReport(value);
      })
      .catch((cause: Error) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [sourceId, targetTenantId, scope]);
  if (error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  return report ? (
    <CommonBulkReportPanel report={report} onOpenTable={() => onReport(report.id)} />
  ) : (
    <p className="text-sm text-muted-foreground">No completed import report for this connection.</p>
  );
}
