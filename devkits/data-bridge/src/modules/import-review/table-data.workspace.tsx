import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceColumnMenu } from "@codexsun/ui/workspace/filters";
import { compareVisibleRows, type PreviewRow } from "./table-data.comparison.js";
import { ReviewDataTable, type ReviewDataRow } from "./table-data.list.js";

export function TableDataWorkspace({
  columns,
  sourceRows,
  targetRows,
  sourceTitle,
  targetTitle,
  page,
  busy,
  onRefresh,
  onSave
}: {
  columns: string[];
  sourceRows: PreviewRow[];
  targetRows: PreviewRow[];
  sourceTitle: string;
  targetTitle: string;
  page: number;
  busy: boolean;
  onRefresh: () => void;
  onSave: (rowIds: number[], columns: string[]) => void;
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [compare, setCompare] = useState(false);
  const [hideMatches, setHideMatches] = useState(false);
  const [hideUnmatched, setHideUnmatched] = useState(false);
  const [selected, setSelected] = useState<Map<string, ReviewDataRow>>(new Map());
  const visible = columns.filter((column) => !hidden.has(column));
  const sourceMatches = compareVisibleRows(sourceRows, targetRows, visible);
  const targetMatches = compareVisibleRows(targetRows, sourceRows, visible);
  function dataRows(rows: PreviewRow[], side: string, matches: ReviewDataRow["comparison"][]) {
    return rows
      .map((data, index) => ({
        key: `${side}:${data.id !== undefined ? `id:${String(data.id)}` : data.uuid !== undefined ? `uuid:${String(data.uuid)}` : `${page}:${index + 1}`}`,
        data,
        comparison: matches[index]!
      }))
      .filter(
        (row) =>
          !compare ||
          (!(hideMatches && row.comparison === "Match") &&
            !(hideUnmatched && row.comparison === "No match"))
      );
  }
  function selectRows(rows: ReviewDataRow[], checked: boolean) {
    setSelected((current) => {
      const next = new Map(current);
      for (const row of rows) {
        if (checked) next.set(row.key, row);
        else next.delete(row.key);
      }
      return next;
    });
  }
  function refreshData() {
    setSelected(new Map());
    onRefresh();
  }
  const selectedKeys = new Set(selected.keys());
  const sourceSelection = [...selected.values()].filter(
    (row) => row.key.startsWith("source:") && Number.isSafeInteger(row.data.id)
  );
  return (
    <section className="space-y-3" aria-label="Table data">
      <div className="flex flex-wrap items-center gap-2">
        <WorkspaceColumnMenu
          columnOptions={columns.map((column) => ({
            id: column,
            label: column,
            checked: !hidden.has(column),
            disabled: visible.length === 1 && visible[0] === column,
            onCheckedChange(checked) {
              setHidden((current) => {
                const next = new Set(current);
                if (checked) next.delete(column);
                else next.add(column);
                return next;
              });
            }
          }))}
          onShowAllColumns={() => setHidden(new Set())}
        />
        <Button
          variant={compare ? "default" : "outline"}
          disabled={busy || !visible.length}
          aria-pressed={compare}
          onClick={() => setCompare((current) => !current)}
        >
          {compare ? "Hide comparison" : "Compare visible data"}
        </Button>
        {compare ? (
          <>
            <Button
              variant={hideMatches ? "default" : "outline"}
              aria-pressed={hideMatches}
              onClick={() => setHideMatches((current) => !current)}
            >
              Hide matches
            </Button>
            <Button
              variant={hideUnmatched ? "default" : "outline"}
              aria-pressed={hideUnmatched}
              onClick={() => setHideUnmatched((current) => !current)}
            >
              Hide unmatched
            </Button>
          </>
        ) : null}
        <Button variant="outline" disabled={busy} onClick={refreshData}>
          Show data
        </Button>
        <Button variant="outline" disabled={busy} onClick={refreshData}>
          Refresh
        </Button>
      </div>
      {compare ? (
        <p className="text-xs text-muted-foreground">
          Comparison covers this page and visible columns only. Redacted fields are not compared.
        </p>
      ) : null}
      {busy ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading table data…
        </p>
      ) : null}
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <ReviewDataTable
          title={sourceTitle}
          columns={visible}
          rows={dataRows(sourceRows, "source", sourceMatches)}
          comparison={compare}
          selected={selectedKeys}
          onSelect={selectRows}
        />
        <ReviewDataTable
          title={targetTitle}
          columns={visible}
          rows={dataRows(targetRows, "target", targetMatches)}
          comparison={compare}
          selected={selectedKeys}
          onSelect={selectRows}
        />
      </div>
      {selected.size ? (
        <section className="space-y-2 rounded-md border p-3" aria-label="Selected rows for review">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Selected for review · {selected.size}</h3>
            <Button variant="outline" onClick={() => setSelected(new Map())}>
              Clear selection
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {sourceSelection.length} source rows · {visible.length} columns for import. Target
            selections are comparison only.
          </p>
          <div className="max-h-56 space-y-2 overflow-auto [scrollbar-width:thin]">
            {[...selected.values()].map((row) => (
              <div key={row.key} className="flex items-start gap-3 text-xs">
                <span className="min-w-16 font-semibold">
                  {row.key.startsWith("source:") ? "Source" : "Target"} ·{" "}
                  {String(row.data.id ?? row.data.uuid ?? "row")}
                </span>
                <pre className="min-w-0 flex-1 whitespace-pre-wrap break-all">
                  {JSON.stringify(
                    Object.fromEntries(visible.map((column) => [column, row.data[column]])),
                    null,
                    2
                  )}
                </pre>
                <Button size="sm" variant="outline" onClick={() => selectRows([row], false)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <div className="flex justify-end">
        <Button
          disabled={busy || !sourceSelection.length || !visible.length}
          onClick={() =>
            onSave(
              sourceSelection.map((row) => Number(row.data.id)),
              visible
            )
          }
        >
          Save selected import review
        </Button>
      </div>
    </section>
  );
}
