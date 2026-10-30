import { useCallback, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { getBusinessWarnings } from "./business-import.services.js";
import { useBusinessPage } from "./business-import.hooks.js";
import { BusinessPager, BusinessLoadState } from "./business-import.presentation.js";
export function BusinessWarnings({
  runId,
  updatedAt,
  onInspect
}: {
  runId: string;
  updatedAt: string;
  onInspect: (table: string) => void;
}) {
  const [page, setPage] = useState(1);
  const load = useCallback(() => getBusinessWarnings(runId, page), [runId, page, updatedAt]);
  const { data, error, busy } = useBusinessPage(load);
  return (
    <section>
      <h3 className="mb-3 font-semibold">Records requiring attention</h3>
      <BusinessLoadState busy={busy} error={error} empty={!data.rows.length} />
      {!busy && !error && data.rows.length ? (
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr>
                {["Group", "Table", "Source row", "Warning", "Action"].map((label) => (
                  <th className="p-3" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, index) => (
                <tr className="border-b" key={`${row.table}-${row.sourceId}-${index}`}>
                  <td className="p-3">{row.group}</td>
                  <td className="p-3">{row.table || "Run"}</td>
                  <td className="p-3">{row.sourceId ?? "—"}</td>
                  <td className="p-3">{row.message}</td>
                  <td className="p-3">
                    {row.table ? (
                      <Button size="sm" variant="outline" onClick={() => onInspect(row.table)}>
                        View table
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <BusinessPager page={page} total={data.total} onChange={setPage} />
    </section>
  );
}
