import { Checkbox } from "@codexsun/ui/components/checkbox";
import { WorkspaceTableHeaderCell } from "@codexsun/ui/workspace/table";
import type { CommonTableImportDetail } from "./common-table-import.types.js";

export function SavedImportPreview({
  saved,
  rows,
  confirmed,
  onConfirm
}: {
  saved: CommonTableImportDetail;
  rows: Record<string, unknown>[];
  confirmed: boolean;
  onConfirm: (value: boolean) => void;
}) {
  return (
    <section className="space-y-3" aria-label="Saved selected data">
      <div>
        <h2 className="font-semibold">Selected data for import · {saved.rowCount} rows</h2>
        <p className="text-sm text-muted-foreground">
          {saved.targetDatabase} · {saved.table} · {saved.columns.join(", ")}
        </p>
      </div>
      <div className="max-h-[28rem] overflow-auto rounded-md border [scrollbar-width:thin]">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <WorkspaceTableHeaderCell>Selected data JSON</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="p-3">
                  <pre className="whitespace-pre-wrap break-all text-xs">
                    {JSON.stringify(row, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {saved.status === "reviewed" ? (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={confirmed} onCheckedChange={(value) => onConfirm(value === true)} />I
          reviewed the selected rows and columns for import
        </label>
      ) : null}
    </section>
  );
}
