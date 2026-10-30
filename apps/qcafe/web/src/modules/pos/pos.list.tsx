import { Button } from "@codexsun/ui/components/button";
import { Badge } from "@codexsun/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@codexsun/ui/components/table";
import type { PosBill } from "./pos.types";

export function PosList({
  bills,
  onSelect
}: {
  bills: PosBill[];
  onSelect: (bill: PosBill) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bill</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Outstanding</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {bills.map((bill) => (
          <TableRow key={bill.uuid}>
            <TableCell className="font-medium">{bill.number}</TableCell>
            <TableCell>
              {new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
              })
                .format(new Date(bill.createdAt))
                .replaceAll("/", "-")
                .replace(",", "")}
            </TableCell>
            <TableCell>₹{(bill.total / 100).toFixed(2)}</TableCell>
            <TableCell>₹{((bill.total - bill.paid) / 100).toFixed(2)}</TableCell>
            <TableCell>
              <Badge
                className={
                  bill.status === "paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }
              >
                {bill.status === "paid"
                  ? "Paid"
                  : bill.status === "part-paid"
                    ? "Part-paid"
                    : "Unpaid"}
              </Badge>
            </TableCell>
            <TableCell>
              <Button variant="outline" onClick={() => onSelect(bill)}>
                View / collect
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
