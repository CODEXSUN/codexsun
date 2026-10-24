import { useState } from "react";
import { ConflictCorrectionPreview } from "./common-table-import.resolution.preview.js";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceTableHeaderCell } from "@codexsun/ui/workspace/table";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { CommonBulkReport } from "./common-table-import.types.js";

type TableReport = CommonBulkReport["tables"][number];
export function CommonBulkRows({ table, runId }: { table: TableReport; runId?: string }) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(100);
  const rows = (table.rows ?? []).filter((row) => filter === "all" || row.status === filter);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pages);
  return (
    <section className="space-y-3 p-3" aria-label={`${table.table} row results`}>
      <div className="flex flex-wrap gap-2">
        {["all", "imported", "existing", "warning"].map((value) => (
          <Button
            key={value}
            variant={filter === value ? "default" : "outline"}
            onClick={() => {
              setFilter(value);
              setPage(1);
            }}
          >
            {value === "all" ? "All rows" : value[0]!.toUpperCase() + value.slice(1)} ·{" "}
            {(table.rows ?? []).filter((row) => value === "all" || row.status === value).length}
          </Button>
        ))}
      </div>
      {!table.rows ? (
        <p className="text-sm text-muted-foreground">
          This older report has no saved row details. Start a new audit to capture them.
        </p>
      ) : (
        <>
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {["Source ID", "Result", "Source collection", "Saved target data", "Details"].map(
                    (label) => (
                      <WorkspaceTableHeaderCell key={label}>{label}</WorkspaceTableHeaderCell>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.slice((current - 1) * size, current * size).map((row) => (
                  <tr key={row.rowId} className={row.status === "warning" ? "bg-amber-500/10" : ""}>
                    <td className="p-3 align-top">{row.rowId}</td>
                    <td className="p-3 align-top">
                      <WorkspaceStatusBadge
                        label={row.status}
                        tone={
                          row.status === "warning"
                            ? "warning"
                            : row.status === "pending"
                              ? "info"
                              : "success"
                        }
                      />
                    </td>
                    <td className="p-3 align-top">
                      <pre className="min-w-64 whitespace-pre-wrap break-all text-xs">
                        {JSON.stringify(row.collection ?? row.source, null, 2)}
                      </pre>
                    </td>
                    <td className="p-3 align-top">
                      <pre className="min-w-64 whitespace-pre-wrap break-all text-xs">
                        {row.target
                          ? JSON.stringify(row.target, null, 2)
                          : "No matching target record captured"}
                      </pre>
                    </td>
                    <td className="p-3 align-top">
                      {row.message}
                      {runId && row.status === "warning" && row.target ? (
                        <ConflictCorrectionPreview
                          runId={runId}
                          table={table.table}
                          sourceId={row.rowId}
                        />
                      ) : null}
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No {filter === "all" ? "saved" : filter} rows.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <WorkspacePagination
            page={current}
            rowsPerPage={size}
            totalCount={rows.length}
            totalPages={pages}
            singularLabel="rows"
            showingLabel={`Page ${current} of ${pages}`}
            onPageChange={setPage}
            onPreviousPage={() => setPage(current - 1)}
            onNextPage={() => setPage(current + 1)}
            onRowsPerPageChange={(value) => {
              setSize(value);
              setPage(1);
            }}
          />
        </>
      )}
    </section>
  );
}
