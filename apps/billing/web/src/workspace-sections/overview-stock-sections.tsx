import { Link } from "react-router-dom"

import type { BillingAccountingReports, BillingLedger, BillingVoucher, BillingVoucherType } from "@billing/shared"
import { billingWorkspaceItems } from "@billing/shared"
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

import {
  MetricCard,
  SectionShell,
  StateCard,
} from "./shared"
import {
  formatAmount,
  getVoucherTotals,
  isVoucherBalanced,
  titleFromVoucherType,
} from "./utils"
export function OverviewSection({
  ledgers,
  reports,
  vouchers,
}: {
  ledgers: BillingLedger[]
  reports: BillingAccountingReports
  vouchers: BillingVoucher[]
}) {
  const totalDebits = vouchers.reduce(
    (sum, voucher) => sum + getVoucherTotals(voucher).debit,
    0
  )
  const balancedCount = vouchers.filter((voucher) => isVoucherBalanced(voucher)).length
  const summary = vouchers.reduce<Record<BillingVoucherType, number>>(
    (counts, voucher) => {
      counts[voucher.type] += 1
      return counts
    },
    {
      payment: 0,
      receipt: 0,
      sales: 0,
      sales_return: 0,
      credit_note: 0,
      purchase: 0,
      purchase_return: 0,
      debit_note: 0,
      stock_adjustment: 0,
      landed_cost: 0,
      contra: 0,
      journal: 0,
    }
  )

  return (
    <SectionShell
      title="Accounts Overview"
      description="A Tally-style accounting desk focused on voucher-led posting, ledger discipline, and visible double-entry balance checks."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Ledgers"
          value={ledgers.length}
          hint="Primary books used across cash, bank, debtors, creditors, sales, purchase, and adjustments."
        />
        <MetricCard
          label="Voucher Types"
          value="6"
          hint="Payment, receipt, sales, purchase, contra, and journal are modeled as separate posting lanes."
        />
        <MetricCard
          label="Posted Debits"
          value={formatAmount(totalDebits)}
          hint="Credits match the same amount whenever vouchers stay balanced."
        />
        <MetricCard
          label="Balanced Entries"
          value={`${balancedCount}/${vouchers.length}`}
          hint="Every voucher must balance before it is treated as posted."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pending Review"
          value={reports.financeDashboard.pendingReviewCount}
          hint={`${formatAmount(reports.financeDashboard.pendingReviewAmount)} still waiting for finance approval.`}
        />
        <MetricCard
          label="Receivables"
          value={formatAmount(reports.financeDashboard.receivableTotal)}
          hint="Open receivable exposure from posted books."
        />
        <MetricCard
          label="Payables"
          value={formatAmount(reports.financeDashboard.payableTotal)}
          hint="Open payable exposure from posted books."
        />
        <MetricCard
          label="Inventory Value"
          value={formatAmount(reports.financeDashboard.inventoryValue)}
          hint="Current stock value from the billing valuation policy."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Cash Balance"
          value={formatAmount(reports.financeDashboard.cashBalance)}
          hint="Cash-in-hand closing from the posted books."
        />
        <MetricCard
          label="Bank Balance"
          value={formatAmount(reports.financeDashboard.bankBalance)}
          hint="Bank-account closing from the posted books."
        />
        <MetricCard
          label="Bank Pending"
          value={reports.financeDashboard.bankPendingEntryCount}
          hint={`${formatAmount(reports.financeDashboard.bankMismatchAmount)} currently mismatched in reconciliation.`}
        />
        <MetricCard
          label="Back-dated"
          value={reports.financeDashboard.backDatedVoucherCount}
          hint="Posted entries where voucher date is earlier than creation date."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(Object.entries(summary) as [BillingVoucherType, number][]).map(([type, count]) => (
          <Card key={type}>
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-foreground">{titleFromVoucherType(type)}</p>
                <Badge variant="outline">{count}</Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {titleFromVoucherType(type)} vouchers remain explicit instead of hiding accounting impact.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accounting Exceptions</CardTitle>
          <CardDescription>
            Altered, reversed, and back-dated entries surfaced for finance-control review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Altered"
              value={reports.exceptions.alteredCount}
              hint="Posted or control-touched vouchers with updated timestamps."
            />
            <MetricCard
              label="Reversed"
              value={reports.exceptions.reversedCount}
              hint="Original posted vouchers that were later reversed."
            />
            <MetricCard
              label="Back-dated"
              value={reports.exceptions.backDatedCount}
              hint="Non-draft vouchers whose accounting date predates entry creation."
            />
          </div>
          {reports.exceptions.items.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Voucher</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.exceptions.items.slice(0, 10).map((item) => (
                    <TableRow key={`${item.exceptionType}:${item.voucherId}:${item.updatedAt}`}>
                      <TableCell>
                        <Badge variant="outline">{item.exceptionType.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{item.voucherNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {titleFromVoucherType(item.voucherType)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{item.voucherDate}</TableCell>
                      <TableCell>{item.counterparty}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {[item.dimensions.branch, item.dimensions.project, item.dimensions.costCenter]
                          .filter(Boolean)
                          .join(" / ") || "Unassigned"}
                      </TableCell>
                      <TableCell className="text-right">{formatAmount(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <StateCard message="No accounting exceptions are currently detected from the posted billing books." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Menu</CardTitle>
          <CardDescription>
            Frontend billing pages are connected as dedicated routes so the app can expand into desktop modules later.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {billingWorkspaceItems
            .filter((item) => item.id !== "overview")
            .map((item) => (
              <Link
                key={item.id}
                to={item.route}
                className="rounded-[1rem] border border-border/70 bg-card/70 p-4 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card"
              >
                <p className="font-semibold text-foreground">{item.name}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.summary}
                </p>
              </Link>
            ))}
        </CardContent>
      </Card>
    </SectionShell>
  )
}

export function StockSection({
  ledgers,
  reports,
}: {
  ledgers: BillingLedger[]
  reports: BillingAccountingReports
}) {
  const stockLedgers = ledgers.filter((ledger) =>
    ["stock", "purchase", "direct"].some((value) =>
      ledger.group.toLowerCase().includes(value)
    )
  )

  return (
    <SectionShell
      title="Stock"
      description="Inventory accounting control over shared core product and warehouse masters, including authority, valuation policy, stock ledger foundation, posting rules, and warehouse positions."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Master authority"
          value={reports.inventoryAuthority.masterOwner.toUpperCase()}
          hint="Shared product and warehouse masters stay in core while billing owns finance interpretation."
        />
        <MetricCard
          label="Valuation method"
          value={reports.stockValuationPolicy.method.replace(/_/g, " ")}
          hint="Billing stock value policy used for inventory finance reporting."
        />
        <MetricCard
          label="Warehouses"
          value={reports.warehouseStockPosition.items.length}
          hint="Warehouse positions currently visible from shared core stock masters."
        />
        <MetricCard
          label="Inventory value"
          value={formatAmount(reports.stockValuationReport.totalInventoryValue)}
          hint="Warehouse-wise stock value derived from current valuation policy."
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Authority Decision</CardTitle>
          <CardDescription>
            Billing inventory foundation established for `B9.1`.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Product master</p>
            <p className="mt-2 font-medium text-foreground">{reports.inventoryAuthority.masterOwner}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Warehouse master</p>
            <p className="mt-2 font-medium text-foreground">{reports.inventoryAuthority.warehouseOwner}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Stock transactions</p>
            <p className="mt-2 font-medium text-foreground">{reports.inventoryAuthority.transactionOwner}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Valuation owner</p>
            <p className="mt-2 font-medium text-foreground">{reports.inventoryAuthority.valuationOwner}</p>
          </div>
        </CardContent>
        <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
          {reports.inventoryAuthority.summary}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Stock-linked ledgers</CardTitle>
          <CardDescription>
            Current accounting ledgers that can anchor the next inventory layer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {stockLedgers.map((ledger) => (
            <div
              key={ledger.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3"
            >
              <div>
                <p className="font-medium text-foreground">{ledger.name}</p>
                <p className="text-sm text-muted-foreground">{ledger.group}</p>
              </div>
              <Badge variant="outline" className="capitalize">
                {ledger.nature}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Positions</CardTitle>
            <CardDescription>
              Warehouse-wise stock position as of {reports.warehouseStockPosition.asOfDate}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>On hand</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.warehouseStockPosition.items.map((item) => (
                  <TableRow key={item.warehouseId}>
                    <TableCell className="font-medium">{item.warehouseName}</TableCell>
                    <TableCell>{item.productCount}</TableCell>
                    <TableCell>{item.quantityOnHand}</TableCell>
                    <TableCell>{item.reservedQuantity}</TableCell>
                    <TableCell>{item.availableQuantity}</TableCell>
                    <TableCell>{formatAmount(item.inventoryValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Stock-to-Account Rules</CardTitle>
            <CardDescription>
              Posting posture established for `B9.4` before operational stock bridges in `B10`.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.stockAccountingRules.items.map((item) => (
              <div
                key={item.ruleKey}
                className="rounded-xl border border-border/70 bg-card/70 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <Badge variant={item.status === "active" ? "outline" : "secondary"}>
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Debit {item.debitTarget} / Credit {item.creditTarget}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Stock Ledger Foundation</CardTitle>
          <CardDescription>
            Inventory ledger view based on shared core stock items and movement history under the current valuation policy.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>In</TableHead>
                <TableHead>Out</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.stockLedger.items.slice(0, 24).map((item) => (
                <TableRow key={item.entryId}>
                  <TableCell>{item.movementDate}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.productId}</p>
                    </div>
                  </TableCell>
                  <TableCell>{item.warehouseName}</TableCell>
                  <TableCell>{item.movementType}</TableCell>
                  <TableCell>{item.quantityIn || "-"}</TableCell>
                  <TableCell>{item.quantityOut || "-"}</TableCell>
                  <TableCell>{item.balanceQuantity}</TableCell>
                  <TableCell>{item.availableQuantity}</TableCell>
                  <TableCell>{formatAmount(item.balanceValue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Stock Valuation</CardTitle>
          <CardDescription>
            Current inventory valuation by product and warehouse using the configured {reports.stockValuationReport.valuationMethod.replace(/_/g, " ")} method.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Last Move</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.stockValuationReport.items.slice(0, 24).map((item) => (
                <TableRow key={`${item.productId}:${item.warehouseId}`}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>{item.warehouseName}</TableCell>
                  <TableCell>{item.quantityOnHand}</TableCell>
                  <TableCell>{formatAmount(item.unitCost)}</TableCell>
                  <TableCell>{formatAmount(item.inventoryValue)}</TableCell>
                  <TableCell>{item.lastMovementDate ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </SectionShell>
  )
}


