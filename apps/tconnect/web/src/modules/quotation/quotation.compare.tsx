import { Button } from "@codexsun/ui/components/button";
import {
  WorkspaceFormPanel,
  WorkspaceTable,
  formatDateTime,
  formatDate
} from "@codexsun/ui/workspace";
import type { Quotation } from "./quotation.types";
import { quotationMoney } from "./quotation.list";
export function QuotationCompare({
  records,
  onBack,
  onDiscuss
}: {
  records: Quotation[];
  onBack: () => void;
  onDiscuss?: ((uuid: string) => void) | undefined;
}) {
  const terms = [
    "Reference",
    "Buyer",
    "Requirement / enquiry",
    "Request reference",
    "Quantity",
    "Unit price",
    "Subtotal",
    "Tax",
    "Shipping",
    "Total (INR)",
    "Delivery",
    "Valid through (UTC)",
    "Payment terms",
    "Specifications / exclusions",
    "Status",
    "Sent"
  ];
  const values = records.map((quote) => [
    quote.uuid,
    quote.buyerBusiness,
    quote.subject,
    quote.requirementUuid ? `Requirement ${quote.requirementUuid}` : `Enquiry ${quote.inquiryUuid}`,
    `${quote.quantity.toLocaleString("en-IN")} ${quote.unit}`,
    quotationMoney(quote.unitPrice),
    quotationMoney(quote.subtotal),
    `${quote.taxPercent}% · ${quotationMoney(quote.taxAmount)}`,
    quotationMoney(quote.shipping),
    quotationMoney(quote.total),
    `${quote.deliveryDays} days`,
    formatDate(quote.validUntil),
    quote.paymentTerms,
    quote.notes || "No additional notes",
    quote.status === "withdrawn"
      ? "Withdrawn"
      : quote.validUntil < new Date().toISOString().slice(0, 10)
        ? "Expired"
        : "Sent",
    formatDateTime(quote.createdAt)
  ]);
  const data = terms.map((label, index) => ({
    label,
    values: Object.fromEntries(
      records.map((quote, column) => [quote.uuid, values[column]![index]!])
    )
  }));
  return (
    <WorkspaceFormPanel title={records.length > 1 ? "Compare quotations" : "Quotation details"}>
      <div className="space-y-4">
        <Button variant="outline" onClick={onBack}>
          Back to quotations
        </Button>
        <p className="text-sm text-muted-foreground">
          Compare quantities, units, specifications, tax and delivery together. Different quantities
          or terms can make totals unsuitable for direct comparison. Quotes are offers for
          discussion; no order or payment is created.
        </p>
        <p className="text-xs text-muted-foreground sm:hidden">
          Swipe the table horizontally to compare sellers.
        </p>
        <WorkspaceTable
          data={data}
          emptyState="Select quotations to compare."
          columns={[
            { accessorKey: "label", header: "Terms" },
            ...records.map((quote) => ({
              id: quote.uuid,
              header: `${quote.sellerName} · ${quote.uuid}`,
              cell: ({ row }: { row: { original: (typeof data)[number] } }) => (
                <span
                  className={`whitespace-pre-wrap break-words ${row.original.label === "Total (INR)" ? "font-semibold" : ""}`}
                >
                  {row.original.values[quote.uuid]}
                </span>
              )
            }))
          ]}
        />
        {onDiscuss ? (
          <div className="flex flex-wrap gap-2">
            {records.map((quote) => (
              <Button
                key={quote.uuid}
                variant="outline"
                onClick={() => onDiscuss(quote.conversationUuid)}
              >
                Discuss with {quote.sellerName}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </WorkspaceFormPanel>
  );
}
