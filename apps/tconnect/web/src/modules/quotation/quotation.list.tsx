import { Button } from "@codexsun/ui/components/button";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import { Badge } from "@codexsun/ui/components/badge";
import { WorkspaceTable, formatDate } from "@codexsun/ui/workspace";
import type { Quotation } from "./quotation.types";
export const quotationMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
export function QuotationList({
  records,
  loading,
  mode,
  selected,
  onToggle,
  onView,
  onDiscuss,
  onWithdraw
}: {
  records: Quotation[];
  loading: boolean;
  mode: "buyer" | "seller";
  selected: string[];
  onToggle: (quote: Quotation) => void;
  onView: (quote: Quotation) => void;
  onDiscuss?: ((uuid: string) => void) | undefined;
  onWithdraw: (quote: Quotation) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <WorkspaceTable
      data={records}
      isLoading={loading}
      emptyState={
        mode === "buyer"
          ? "No quotations received yet. Sellers can quote your open requirements and enquiries."
          : "No quotations yet. Open a requirement or enquiry conversation to send an offer."
      }
      columns={[
        ...(mode === "buyer"
          ? [
              {
                id: "select",
                header: "Compare",
                cell: ({ row }: { row: { original: Quotation } }) => (
                  <Checkbox
                    aria-label={`Compare quotation ${row.original.uuid} from ${row.original.sellerName}`}
                    checked={selected.includes(row.original.uuid)}
                    disabled={row.original.status !== "sent" || row.original.validUntil < today}
                    onCheckedChange={() => onToggle(row.original)}
                  />
                )
              }
            ]
          : []),
        { accessorKey: "subject", header: "Requirement / enquiry" },
        {
          id: "business",
          header: mode === "buyer" ? "Seller" : "Buyer",
          cell: ({ row }) =>
            mode === "buyer" ? row.original.sellerName : row.original.buyerBusiness
        },
        {
          id: "quantity",
          header: "Quantity",
          cell: ({ row }) => `${row.original.quantity.toLocaleString("en-IN")} ${row.original.unit}`
        },
        {
          accessorKey: "unitPrice",
          header: "Unit price",
          cell: ({ row }) => quotationMoney(row.original.unitPrice)
        },
        {
          accessorKey: "total",
          header: "Total (INR)",
          cell: ({ row }) => <strong>{quotationMoney(row.original.total)}</strong>
        },
        {
          accessorKey: "deliveryDays",
          header: "Delivery",
          cell: ({ row }) => `${row.original.deliveryDays} days`
        },
        {
          accessorKey: "validUntil",
          header: "Valid through",
          cell: ({ row }) => formatDate(row.original.validUntil)
        },
        {
          id: "status",
          header: "Status",
          cell: ({ row }) => (
            <Badge variant="outline">
              {row.original.status === "withdrawn"
                ? "Withdrawn"
                : row.original.validUntil < today
                  ? "Expired"
                  : "Sent"}
            </Badge>
          )
        },
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => onView(row.original)}>
                View quote
              </Button>
              {onDiscuss ? (
                <Button variant="outline" onClick={() => onDiscuss(row.original.conversationUuid)}>
                  Discuss
                </Button>
              ) : null}
              {mode === "seller" && row.original.status === "sent" ? (
                <Button variant="outline" onClick={() => onWithdraw(row.original)}>
                  Withdraw
                </Button>
              ) : null}
            </div>
          )
        }
      ]}
    />
  );
}
