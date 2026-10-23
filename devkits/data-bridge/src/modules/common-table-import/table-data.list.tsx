import { Checkbox } from "@codexsun/ui/components/checkbox";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableHeaderCell } from "@codexsun/ui/workspace/table";
import type { PreviewRow, RowComparison } from "./table-data.comparison.js";

export type ReviewDataRow = {
  key: string;
  data: PreviewRow;
  comparison: RowComparison;
};

export function ReviewDataTable({
  title,
  columns,
  rows,
  comparison,
  selected,
  onSelect
}: {
  title: string;
  columns: string[];
  rows: ReviewDataRow[];
  comparison: boolean;
  selected: Set<string>;
  onSelect: (rows: ReviewDataRow[], checked: boolean) => void;
}) {
  const checked = rows.filter((row) => selected.has(row.key)).length;
  return (
    <section className="min-w-0 overflow-hidden rounded-md border bg-card">
      <h2 className="border-b px-4 py-3 text-sm font-semibold">
        {title}
        <span className="ml-2 font-normal text-muted-foreground">· {rows.length} shown</span>
      </h2>
      <div className="max-h-[28rem] overflow-auto [scrollbar-width:thin]">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="sticky top-0 z-10 bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <Checkbox
                  aria-label={`Select all visible ${title} rows`}
                  disabled={!rows.length}
                  checked={
                    checked === rows.length && rows.length > 0
                      ? true
                      : checked > 0
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(value) => onSelect(rows, value === true)}
                />
              </th>
              {columns.map((column) => (
                <WorkspaceTableHeaderCell key={column}>{column}</WorkspaceTableHeaderCell>
              ))}
              {comparison ? <WorkspaceTableHeaderCell>Row match</WorkspaceTableHeaderCell> : null}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.key} className={selected.has(row.key) ? "bg-muted/40" : ""}>
                <td className="px-3 py-2.5">
                  <Checkbox
                    aria-label={`Select ${title} row ${String(row.data.id ?? row.key.split(":").at(-1))}`}
                    checked={selected.has(row.key)}
                    onCheckedChange={(value) => onSelect([row], value === true)}
                  />
                </td>
                {columns.map((column) => (
                  <td
                    key={column}
                    className="max-w-72 px-3 py-2.5"
                    title={formatValue(row.data[column])}
                  >
                    <span className="block truncate">{formatValue(row.data[column])}</span>
                  </td>
                ))}
                {comparison ? (
                  <td className="px-3 py-2.5">
                    <WorkspaceStatusBadge
                      label={row.comparison}
                      tone={
                        row.comparison === "Match"
                          ? "success"
                          : row.comparison === "No match"
                            ? "warning"
                            : "neutral"
                      }
                    />
                  </td>
                ) : null}
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td
                  colSpan={columns.length + (comparison ? 2 : 1)}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No rows to show.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
