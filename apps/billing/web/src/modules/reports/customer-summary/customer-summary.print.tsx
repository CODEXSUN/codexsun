import { formatDateTime } from "@codexsun/ui/workspace";
import { WorkspacePrintSheet } from "@codexsun/ui/workspace/print";
import { BillingDocumentHeader } from "../../settings";
import { formatCustomerSummaryMoney } from "./customer-summary.services";
import type { CustomerSummary, CustomerSummaryItem } from "./customer-summary.types";

export function CustomerSummaryPrint({
  summary,
  entries,
  search
}: {
  summary: CustomerSummary;
  entries: CustomerSummaryItem[];
  search: string;
}) {
  const totals = entries.reduce(
    (result, entry) => ({
      debit: result.debit + entry.debit,
      credit: result.credit + entry.credit,
      balance: result.balance + entry.balance
    }),
    { debit: 0, credit: 0, balance: 0 }
  );
  return (
    <WorkspacePrintSheet className="billing-print-document billing-customer-summary-print-document">
      <style>{`@media print {
        .billing-customer-summary-print-document article { break-inside: auto; page-break-inside: auto; }
        .billing-customer-summary-print-document thead { display: table-header-group; }
        .billing-customer-summary-print-document tr { break-inside: avoid; }
      }`}</style>
      <article className="bg-white px-3 py-3 text-[10px] text-black">
        <BillingDocumentHeader
          className="border border-slate-500"
          documentMeta={summary.financialYearName}
          documentTitle="Customer Summary"
        />
        <section className="border-x border-b border-slate-500 px-3 py-2">
          <div>Customers: {entries.length}</div>
          {search ? <div>Search: {search}</div> : null}
        </section>
        <table className="w-full border-collapse border-x border-b border-slate-500">
          <thead>
            <tr>
              {["Customer", "Code", "Debit", "Credit", "Balance"].map((heading) => (
                <th
                  className="border-b border-r border-slate-500 px-2 py-2 text-center last:border-r-0"
                  key={heading}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="border-b border-r border-slate-300 px-2 py-1.5 font-semibold">
                  {entry.name}
                </td>
                <td className="border-b border-r border-slate-300 px-2 py-1.5">
                  {entry.code || "-"}
                </td>
                {[entry.debit, entry.credit, entry.balance].map((value, index) => (
                  <td
                    className="border-b border-r border-slate-300 px-2 py-1.5 text-right last:border-r-0"
                    key={index}
                  >
                    {formatCustomerSummaryMoney(value)}
                  </td>
                ))}
              </tr>
            ))}
            {!entries.length ? (
              <tr>
                <td className="border-b border-slate-300 px-2 py-3 text-center" colSpan={5}>
                  No customer outstanding balances found.
                </td>
              </tr>
            ) : null}
            <tr className="font-bold">
              <td className="border-r border-slate-500 px-2 py-2" colSpan={2}>
                Total
              </td>
              {[totals.debit, totals.credit, totals.balance].map((value, index) => (
                <td
                  className="border-r border-slate-500 px-2 py-2 text-right last:border-r-0"
                  key={index}
                >
                  {formatCustomerSummaryMoney(value)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <footer className="flex justify-between border-x border-b border-slate-500 px-3 py-3">
          <span>Generated {formatDateTime(new Date())}</span>
          <span className="font-semibold">For {summary.companyName}</span>
        </footer>
      </article>
    </WorkspacePrintSheet>
  );
}
