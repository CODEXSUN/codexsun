import { Link } from "react-router-dom"

import type { BillingAuditTrailReview } from "@billing/shared"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { MetricCard, SectionShell, StateCard } from "./shared"
export function BillingAuditTrailSection({
  auditTrail,
}: {
  auditTrail: BillingAuditTrailReview
}) {
  return (
    <SectionShell
      title="Audit Trail"
      description="Review billing posting, approval, reconciliation, and reversal events recorded in the platform audit ledger."
    >
      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-6">
        <MetricCard label="Entries" value={auditTrail.totalEntries} hint="Billing audit records loaded for review." />
        <MetricCard label="Create" value={auditTrail.createCount} hint="Voucher creation events." />
        <MetricCard label="Post" value={auditTrail.postCount} hint="Posted lifecycle events." />
        <MetricCard label="Reverse" value={auditTrail.reverseCount} hint="Reversal actions captured." />
        <MetricCard label="Review" value={auditTrail.reviewCount} hint="Approval and rejection actions." />
        <MetricCard label="Reconcile" value={auditTrail.reconcileCount} hint="Bank reconciliation actions." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger Review Feed</CardTitle>
          <CardDescription>
            Latest billing audit events from the shared framework activity log.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {auditTrail.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditTrail.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.createdAt.slice(0, 19).replace("T", " ")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            item.level === "error"
                              ? "destructive"
                              : item.level === "warn"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {item.level}
                        </Badge>
                        <span className="text-sm text-foreground">{item.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.voucherId && item.voucherNumber ? (
                        <Link
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                          to="/dashboard/billing/voucher-register"
                        >
                          {item.voucherNumber}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell>{item.actorEmail ?? item.actorType ?? "Unknown"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.routePath ?? "-"}</TableCell>
                    <TableCell className="max-w-[28rem] text-muted-foreground">
                      {item.message}
                      {item.reversalVoucherNumber ? ` Reversal: ${item.reversalVoucherNumber}.` : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6">
              <StateCard message="No billing audit records are available yet." />
            </div>
          )}
        </CardContent>
      </Card>
    </SectionShell>
  )
}


