import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableHeaderCell } from "@codexsun/ui/workspace/table";
import type { ImportReport as Report } from "./import-review.types.js";
import { formatDateTime } from "@codexsun/ui/workspace/utils";

export function ImportReport({ report }: { report: Report }) {
  const count = (status: string) => report.rows.filter((row) => row.status === status).length;
  return (
    <section className="space-y-2" aria-label="Import audit report">
      <p className="text-xs text-muted-foreground">
        {formatDateTime(report.at)} · {report.actor}
      </p>
      <h2 className="font-semibold">
        {report.phase === "audit" ? "Before import audit" : "Import report"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {count("ready")} ready · {count("existing")} existing · {count("inserted")} inserted ·{" "}
        {count("conflict") + count("warning")} warnings · {count("rolled_back")} rolled back
      </p>
      <div className="max-h-80 overflow-auto rounded-md border [scrollbar-width:thin]">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <WorkspaceTableHeaderCell>Row</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Result</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Details</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y">
            {report.rows.map((row) => (
              <tr key={row.rowNumber}>
                <td className="p-3">{row.rowNumber}</td>
                <td className="p-3">
                  <WorkspaceStatusBadge
                    label={row.status}
                    tone={
                      row.status === "inserted" || row.status === "ready"
                        ? "success"
                        : row.status === "rolled_back"
                          ? "danger"
                          : row.status === "existing"
                            ? "info"
                            : "warning"
                    }
                  />
                </td>
                <td className="p-3">{row.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
