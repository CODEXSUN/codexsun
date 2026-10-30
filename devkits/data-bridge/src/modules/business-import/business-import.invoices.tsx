import { useCallback, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@codexsun/ui/components/dialog";
import { getBusinessInvoices } from "./business-import.services.js";
import { useBusinessPage } from "./business-import.hooks.js";
import {
  BusinessStatus,
  BusinessPager,
  BusinessLoadState
} from "./business-import.presentation.js";
import type { BusinessInvoice, InvoiceSelection } from "./business-import.types.js";
export function BusinessInvoices({
  runId,
  updatedAt,
  onInspect
}: {
  runId: string;
  updatedAt: string;
  onInspect: (table: string, invoice: InvoiceSelection) => void;
}) {
  const [page, setPage] = useState(1),
    [warningsOnly, setWarnings] = useState(false),
    [selected, setSelected] = useState<BusinessInvoice | null>(null);
  const load = useCallback(
    () => getBusinessInvoices(runId, page, warningsOnly),
    [runId, page, warningsOnly, updatedAt]
  );
  const { data, error, busy } = useBusinessPage(load);
  function inspect(table: string) {
    if (selected) {
      onInspect(table, { table: selected.table, sourceId: selected.sourceId });
      setSelected(null);
    }
  }
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">Full invoice verification</h3>
        <Button
          variant={warningsOnly ? "default" : "outline"}
          onClick={() => {
            setWarnings((v) => !v);
            setPage(1);
          }}
        >
          Needs attention only
        </Button>
      </div>
      <BusinessLoadState busy={busy} error={error} empty={!data.rows.length} />
      {!busy && !error && data.rows.length ? (
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr>
                {[
                  "Table",
                  "Invoice identity",
                  "Source / target row",
                  "Children",
                  "Result",
                  "Action"
                ].map((label) => (
                  <th key={label} className="p-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((invoice) => (
                <tr className="border-b" key={`${invoice.table}-${invoice.sourceId}`}>
                  <td className="p-3">{invoice.table}</td>
                  <td className="max-w-sm break-all p-3">
                    {invoice.identity}
                    {invoice.deleted ? (
                      <span className="ml-2 text-muted-foreground">Deleted history</span>
                    ) : null}
                  </td>
                  <td className="p-3">
                    {invoice.sourceId} → {invoice.targetId ?? "—"}
                  </td>
                  <td className="p-3">
                    {invoice.children.reduce((n, c) => n + c.matched, 0)} matched
                  </td>
                  <td className="p-3">
                    <BusinessStatus status={invoice.status} />
                  </td>
                  <td className="p-3">
                    <Button size="sm" variant="outline" onClick={() => setSelected(invoice)}>
                      View invoice
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <BusinessPager page={page} total={data.total} onChange={setPage} />
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          className="max-h-[85vh] overflow-auto sm:max-w-5xl"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>
              {selected?.table} · Source row {selected?.sourceId}
            </DialogTitle>
          </DialogHeader>
          {selected ? (
            <>
              <BusinessStatus status={selected.status} />
              <p className="text-sm">{selected.message}</p>
              <Button variant="outline" onClick={() => inspect(selected.table)}>
                View invoice data
              </Button>
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    {[
                      "Child table",
                      "Source",
                      "Target",
                      "Matched",
                      "Different / missing",
                      "Extra",
                      "Data"
                    ].map((label) => (
                      <th key={label} className="p-2">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.children.map((child) => (
                    <tr className="border-b" key={child.table}>
                      <td className="p-2">{child.table}</td>
                      <td className="p-2">{child.sourceRows}</td>
                      <td className="p-2">{child.targetRows}</td>
                      <td className="p-2">{child.matched}</td>
                      <td className="p-2">{child.differences}</td>
                      <td className="p-2">{child.extra}</td>
                      <td className="p-2">
                        <Button variant="outline" size="sm" onClick={() => inspect(child.table)}>
                          View rows
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
