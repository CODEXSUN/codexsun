import { useState } from "react"
import { Link } from "react-router-dom"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  BillingAccountingReports,
  BillingVoucher,
  BillingVoucherType,
} from "@billing/shared"

import { SectionShell, MetricCard, StateCard } from "./shared"
import {
  formatAmount,
  getVoucherLifecycleBadgeVariant,
  getVoucherPostingRoute,
  getVoucherTotals,
  isVoucherBalanced,
  titleFromVoucherType,
  toStatusLabel,
  toVoucherLifecycleLabel,
} from "./utils"

const voucherInlineSelectClassName =
  "h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"

function ComplianceBadges({ voucher }: { voucher: BillingVoucher }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={getVoucherLifecycleBadgeVariant(voucher.status)}>
        {toVoucherLifecycleLabel(voucher.status)}
      </Badge>
      <Badge variant="outline">{voucher.financialYear.label}</Badge>
      {voucher.billAllocations.length > 0 ? (
        <Badge variant="outline">{voucher.billAllocations.length} bill refs</Badge>
      ) : null}
      {voucher.gst ? <Badge variant="outline">GST {voucher.gst.taxRate}%</Badge> : null}
      <Badge variant={voucher.eInvoice.status === "generated" ? "outline" : "secondary"}>
        E-invoice {toStatusLabel(voucher.eInvoice.status)}
      </Badge>
      <Badge variant={voucher.eWayBill.status === "generated" ? "outline" : "secondary"}>
        E-way {toStatusLabel(voucher.eWayBill.status)}
      </Badge>
    </div>
  )
}

function VoucherRegisterTable({ vouchers }: { vouchers: BillingVoucher[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Voucher</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Narration</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>FY / Compliance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.map((voucher) => {
              const totals = getVoucherTotals(voucher)

              return (
                <TableRow key={voucher.id}>
                  <TableCell>{voucher.date}</TableCell>
                  <TableCell className="font-medium">{voucher.voucherNumber}</TableCell>
                  <TableCell>{titleFromVoucherType(voucher.type)}</TableCell>
                  <TableCell>{voucher.counterparty}</TableCell>
                  <TableCell className="max-w-[26rem] text-muted-foreground">
                    {voucher.narration}
                  </TableCell>
                  <TableCell>{formatAmount(totals.debit)}</TableCell>
                  <TableCell>
                    <ComplianceBadges voucher={voucher} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={isVoucherBalanced(voucher) ? "outline" : "destructive"}>
                      {isVoucherBalanced(voucher) ? "Balanced" : "Mismatch"}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
function StatementsSection({
  reports,
  vouchers,
}: {
  reports: BillingAccountingReports
  vouchers: BillingVoucher[]
}) {
  const recentVouchers = [...vouchers].slice(0, 5)

  return (
    <SectionShell
      title="Statements"
      description="Running business statements across receivables, payables, and recent book movement."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Receivable statement"
          value={formatAmount(reports.outstanding.receivableTotal)}
          hint="Current receivable-side statement value from posted bills."
        />
        <MetricCard
          label="Payable statement"
          value={formatAmount(reports.outstanding.payableTotal)}
          hint="Current payable-side statement value from posted bills."
        />
        <MetricCard
          label="Open bills"
          value={reports.outstanding.items.length}
          hint="Outstanding bill references contributing to statement balances."
        />
        <MetricCard
          label="Recent entries"
          value={recentVouchers.length}
          hint="Recent vouchers included in the statement snapshot below."
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent statement movement</CardTitle>
          <CardDescription>
            Recent voucher activity that would feed customer, supplier, and account statements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentVouchers.map((voucher) => (
            <div
              key={voucher.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3"
            >
              <div>
                <p className="font-medium text-foreground">{voucher.voucherNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {voucher.counterparty} • {titleFromVoucherType(voucher.type)}
                </p>
              </div>
              <Badge variant="outline">{voucher.date}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </SectionShell>
  )
}

void StatementsSection

type PartyStatementEntryView = {
  voucherId: string
  voucherNumber: string
  voucherType: BillingVoucherType
  date: string
  narration: string
  referenceVoucherNumber: string | null
  debitAmount: number
  creditAmount: number
  runningSide: "debit" | "credit"
  runningAmount: number
}

type PartyStatementItemView = {
  partyId: string
  partyName: string
  debitTotal: number
  creditTotal: number
  closingSide: "debit" | "credit"
  closingAmount: number
  entries: PartyStatementEntryView[]
}

function PartyStatementCards({
  emptyMessage,
  items,
  movementHint,
}: {
  emptyMessage: string
  items: PartyStatementItemView[]
  movementHint: string
}) {
  if (items.length === 0) {
    return <StateCard message={emptyMessage} />
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.partyId}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{item.partyName}</CardTitle>
                <CardDescription>{movementHint}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Debit {formatAmount(item.debitTotal)}</Badge>
                <Badge variant="outline">Credit {formatAmount(item.creditTotal)}</Badge>
                <Badge variant="outline">
                  Closing {formatAmount(item.closingAmount)} {item.closingSide}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Running</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.entries.map((entry) => (
                  <TableRow
                    key={`${item.partyId}:${entry.voucherId}:${entry.referenceVoucherNumber ?? "direct"}`}
                  >
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>
                      {getVoucherPostingRoute(entry.voucherType, entry.voucherId) ? (
                        <Link
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                          to={getVoucherPostingRoute(entry.voucherType, entry.voucherId)!}
                        >
                          {entry.voucherNumber}
                        </Link>
                      ) : (
                        <span className="font-medium text-foreground">
                          {entry.voucherNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{entry.referenceVoucherNumber ?? "Direct"}</TableCell>
                    <TableCell>{titleFromVoucherType(entry.voucherType)}</TableCell>
                    <TableCell>{entry.narration || "No narration"}</TableCell>
                    <TableCell className="text-right">
                      {entry.debitAmount > 0 ? formatAmount(entry.debitAmount) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.creditAmount > 0 ? formatAmount(entry.creditAmount) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(entry.runningAmount)} {entry.runningSide}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function StatementsOverviewSection({ reports }: { reports: BillingAccountingReports }) {
  const customerClosingTotal = reports.customerStatement.items.reduce((sum, item) => {
    if (item.closingSide !== "debit") {
      return sum
    }

    return sum + item.closingAmount
  }, 0)
  const supplierClosingTotal = reports.supplierStatement.items.reduce((sum, item) => {
    if (item.closingSide !== "credit") {
      return sum
    }

    return sum + item.closingAmount
  }, 0)

  return (
    <SectionShell
      title="Statements"
      description="Receivable and payable party statements built from posted sales, purchases, notes, receipts, and payments."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Customers"
          value={reports.customerStatement.items.length}
          hint="Customer ledgers with posted receivable movement."
        />
        <MetricCard
          label="Suppliers"
          value={reports.supplierStatement.items.length}
          hint="Supplier ledgers with posted payable movement."
        />
        <MetricCard
          label="Receivable closing"
          value={formatAmount(customerClosingTotal)}
          hint="Net debit balances across customer statements."
        />
        <MetricCard
          label="Payable closing"
          value={formatAmount(supplierClosingTotal)}
          hint="Net credit balances across supplier statements."
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Statement Book</CardTitle>
              <CardDescription>
                Receivable movement from posted sales, credit notes, and receipts.
              </CardDescription>
            </CardHeader>
          </Card>
          <PartyStatementCards
            emptyMessage="No posted customer statement movement is available yet."
            items={reports.customerStatement.items.map((item) => ({
              partyId: item.customerId,
              partyName: item.customerName,
              debitTotal: item.debitTotal,
              creditTotal: item.creditTotal,
              closingSide: item.closingSide,
              closingAmount: item.closingAmount,
              entries: item.entries,
            }))}
            movementHint="Running receivable statement from posted invoices, notes, and receipts."
          />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Statement Book</CardTitle>
              <CardDescription>
                Payable movement from posted purchases, debit notes, and payments.
              </CardDescription>
            </CardHeader>
          </Card>
          <PartyStatementCards
            emptyMessage="No posted supplier statement movement is available yet."
            items={reports.supplierStatement.items.map((item) => ({
              partyId: item.supplierId,
              partyName: item.supplierName,
              debitTotal: item.debitTotal,
              creditTotal: item.creditTotal,
              closingSide: item.closingSide,
              closingAmount: item.closingAmount,
              entries: item.entries,
            }))}
            movementHint="Running payable statement from posted bills, notes, and payments."
          />
        </div>
      </div>
    </SectionShell>
  )
}

export function GstSalesRegisterSection({ reports }: { reports: BillingAccountingReports }) {
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>("all")
  const filteredItems =
    selectedPeriodKey === "all"
      ? reports.gstSalesRegister.items
      : reports.gstSalesRegister.items.filter((item) => item.date.startsWith(selectedPeriodKey))

  return (
    <SectionShell
      title="GST Sales Register"
      description="Outward GST register built from posted sales invoices and credit notes with output-tax movement."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Invoices"
          value={reports.gstSalesRegister.invoiceCount}
          hint="Posted GST sales invoices included in the outward register."
        />
        <MetricCard
          label="Credit notes"
          value={reports.gstSalesRegister.creditNoteCount}
          hint="Posted GST credit notes reducing outward tax liability."
        />
        <MetricCard
          label="Taxable total"
          value={formatAmount(reports.gstSalesRegister.taxableAmountTotal)}
          hint="Net taxable turnover after sales invoices and credit notes."
        />
        <MetricCard
          label="Invoice total"
          value={formatAmount(reports.gstSalesRegister.invoiceAmountTotal)}
          hint="Net document total including GST."
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="CGST"
          value={formatAmount(reports.gstSalesRegister.cgstAmountTotal)}
          hint="Net CGST reported in the outward register."
        />
        <MetricCard
          label="SGST"
          value={formatAmount(reports.gstSalesRegister.sgstAmountTotal)}
          hint="Net SGST reported in the outward register."
        />
        <MetricCard
          label="IGST"
          value={formatAmount(reports.gstSalesRegister.igstAmountTotal)}
          hint="Net IGST reported in the outward register."
        />
        <MetricCard
          label="Total tax"
          value={formatAmount(reports.gstSalesRegister.totalTaxAmountTotal)}
          hint="Net GST liability from posted outward documents."
        />
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-5">
          <label className="text-sm font-medium text-foreground" htmlFor="gst-sales-period">
            Tax period
          </label>
          <select
            id="gst-sales-period"
            className={voucherInlineSelectClassName}
            value={selectedPeriodKey}
            onChange={(event) => setSelectedPeriodKey(event.target.value)}
          >
            <option value="all">All periods</option>
            {reports.gstFilingSummary.periods.map((period) => (
              <option key={period.periodKey} value={period.periodKey}>
                {period.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>
      {filteredItems.length === 0 ? (
        <StateCard message="No posted GST sales documents are available for the sales register yet." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Supply</TableHead>
                  <TableHead>Taxable</TableHead>
                  <TableHead>CGST</TableHead>
                  <TableHead>SGST</TableHead>
                  <TableHead>IGST</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.voucherId}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.voucherNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.documentLabel === "tax_invoice" ? "Tax Invoice" : "Credit Note"}
                          {item.referenceVoucherNumber ? ` • Ref ${item.referenceVoucherNumber}` : ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{item.counterparty}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.hsnOrSac} • {item.taxRate}%
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{item.partyGstin ?? "--"}</TableCell>
                    <TableCell>
                      {item.placeOfSupply} • {item.supplyType === "intra" ? "Intra" : "Inter"}
                    </TableCell>
                    <TableCell>{formatAmount(item.taxableAmount)}</TableCell>
                    <TableCell>{formatAmount(item.cgstAmount)}</TableCell>
                    <TableCell>{formatAmount(item.sgstAmount)}</TableCell>
                    <TableCell>{formatAmount(item.igstAmount)}</TableCell>
                    <TableCell>{formatAmount(item.invoiceAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </SectionShell>
  )
}

export function GstPurchaseRegisterSection({ reports }: { reports: BillingAccountingReports }) {
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>("all")
  const filteredItems =
    selectedPeriodKey === "all"
      ? reports.gstPurchaseRegister.items
      : reports.gstPurchaseRegister.items.filter((item) =>
          item.date.startsWith(selectedPeriodKey)
        )

  return (
    <SectionShell
      title="GST Purchase Register"
      description="Input GST register built from posted purchase invoices and debit notes with input-tax movement."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Invoices"
          value={reports.gstPurchaseRegister.invoiceCount}
          hint="Posted GST purchase invoices included in the input register."
        />
        <MetricCard
          label="Debit notes"
          value={reports.gstPurchaseRegister.debitNoteCount}
          hint="Posted GST debit notes reducing input-tax claim value."
        />
        <MetricCard
          label="Taxable total"
          value={formatAmount(reports.gstPurchaseRegister.taxableAmountTotal)}
          hint="Net taxable purchase value after purchase invoices and debit notes."
        />
        <MetricCard
          label="Invoice total"
          value={formatAmount(reports.gstPurchaseRegister.invoiceAmountTotal)}
          hint="Net purchase document total including GST."
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="CGST"
          value={formatAmount(reports.gstPurchaseRegister.cgstAmountTotal)}
          hint="Net CGST available in the input register."
        />
        <MetricCard
          label="SGST"
          value={formatAmount(reports.gstPurchaseRegister.sgstAmountTotal)}
          hint="Net SGST available in the input register."
        />
        <MetricCard
          label="IGST"
          value={formatAmount(reports.gstPurchaseRegister.igstAmountTotal)}
          hint="Net IGST available in the input register."
        />
        <MetricCard
          label="Total tax"
          value={formatAmount(reports.gstPurchaseRegister.totalTaxAmountTotal)}
          hint="Net input GST from posted inward documents."
        />
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-5">
          <label className="text-sm font-medium text-foreground" htmlFor="gst-purchase-period">
            Tax period
          </label>
          <select
            id="gst-purchase-period"
            className={voucherInlineSelectClassName}
            value={selectedPeriodKey}
            onChange={(event) => setSelectedPeriodKey(event.target.value)}
          >
            <option value="all">All periods</option>
            {reports.gstFilingSummary.periods.map((period) => (
              <option key={period.periodKey} value={period.periodKey}>
                {period.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>
      {filteredItems.length === 0 ? (
        <StateCard message="No posted GST purchase documents are available for the purchase register yet." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Supply</TableHead>
                  <TableHead>Taxable</TableHead>
                  <TableHead>CGST</TableHead>
                  <TableHead>SGST</TableHead>
                  <TableHead>IGST</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.voucherId}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.voucherNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.documentLabel === "purchase_invoice"
                            ? "Purchase Invoice"
                            : "Debit Note"}
                          {item.referenceVoucherNumber ? ` • Ref ${item.referenceVoucherNumber}` : ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{item.counterparty}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.hsnOrSac} • {item.taxRate}%
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{item.partyGstin ?? "--"}</TableCell>
                    <TableCell>
                      {item.placeOfSupply} • {item.supplyType === "intra" ? "Intra" : "Inter"}
                    </TableCell>
                    <TableCell>{formatAmount(item.taxableAmount)}</TableCell>
                    <TableCell>{formatAmount(item.cgstAmount)}</TableCell>
                    <TableCell>{formatAmount(item.sgstAmount)}</TableCell>
                    <TableCell>{formatAmount(item.igstAmount)}</TableCell>
                    <TableCell>{formatAmount(item.invoiceAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </SectionShell>
  )
}

export function InputOutputTaxSummarySection({ reports }: { reports: BillingAccountingReports }) {
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>(
    reports.gstFilingSummary.latestPeriodKey ?? "all"
  )
  const filingPeriod =
    selectedPeriodKey === "all"
      ? null
      : reports.gstFilingSummary.periods.find((period) => period.periodKey === selectedPeriodKey) ??
        null
  const summary = reports.inputOutputTaxSummary

  return (
    <SectionShell
      title="Input vs Output Tax"
      description="Net GST control summary comparing outward tax liability against inward input-tax credit from posted GST documents."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="As of"
          value={summary.asOfDate}
          hint="Current posted-book cutoff for GST control totals."
        />
        <MetricCard
          label="Output tax"
          value={formatAmount(summary.outputTaxTotal)}
          hint="Net outward GST from sales invoices and credit notes."
        />
        <MetricCard
          label="Input tax"
          value={formatAmount(summary.inputTaxTotal)}
          hint="Net inward GST from purchase invoices and debit notes."
        />
        <MetricCard
          label="Net payable"
          value={formatAmount(summary.netTaxPayable)}
          hint="Output GST less input credit across the current books."
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="CGST net"
          value={formatAmount(summary.netCgstPayable)}
          hint="Output CGST less input CGST."
        />
        <MetricCard
          label="SGST net"
          value={formatAmount(summary.netSgstPayable)}
          hint="Output SGST less input SGST."
        />
        <MetricCard
          label="IGST net"
          value={formatAmount(summary.netIgstPayable)}
          hint="Output IGST less input IGST."
        />
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-5">
          <label className="text-sm font-medium text-foreground" htmlFor="gst-summary-period">
            Tax period
          </label>
          <select
            id="gst-summary-period"
            className={voucherInlineSelectClassName}
            value={selectedPeriodKey}
            onChange={(event) => setSelectedPeriodKey(event.target.value)}
          >
            <option value="all">All periods</option>
            {reports.gstFilingSummary.periods.map((period) => (
              <option key={period.periodKey} value={period.periodKey}>
                {period.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>
      {filingPeriod ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Period output"
            value={formatAmount(filingPeriod.outputTaxTotal)}
            hint={`${filingPeriod.label} outward GST for filing review.`}
          />
          <MetricCard
            label="Period input"
            value={formatAmount(filingPeriod.inputTaxTotal)}
            hint={`${filingPeriod.label} inward GST credit for filing review.`}
          />
          <MetricCard
            label="Period net"
            value={formatAmount(filingPeriod.netTaxPayable)}
            hint={`${filingPeriod.label} net GST payable after input setoff.`}
          />
          <MetricCard
            label="Period docs"
            value={
              filingPeriod.salesInvoiceCount +
              filingPeriod.salesCreditNoteCount +
              filingPeriod.purchaseInvoiceCount +
              filingPeriod.purchaseDebitNoteCount
            }
            hint="Posted GST documents in the selected filing period."
          />
        </div>
      ) : null}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tax Head</TableHead>
                <TableHead>Output</TableHead>
                <TableHead>Input</TableHead>
                <TableHead>Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">CGST</TableCell>
                <TableCell>{formatAmount(summary.outputCgst)}</TableCell>
                <TableCell>{formatAmount(summary.inputCgst)}</TableCell>
                <TableCell>{formatAmount(summary.netCgstPayable)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">SGST</TableCell>
                <TableCell>{formatAmount(summary.outputSgst)}</TableCell>
                <TableCell>{formatAmount(summary.inputSgst)}</TableCell>
                <TableCell>{formatAmount(summary.netSgstPayable)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">IGST</TableCell>
                <TableCell>{formatAmount(summary.outputIgst)}</TableCell>
                <TableCell>{formatAmount(summary.inputIgst)}</TableCell>
                <TableCell>{formatAmount(summary.netIgstPayable)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="font-semibold">
                  {formatAmount(summary.outputTaxTotal)}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatAmount(summary.inputTaxTotal)}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatAmount(summary.netTaxPayable)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Filing Period Summary</CardTitle>
          <CardDescription>
            Monthly GST-ready summary built from posted books for filing review.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Sales Docs</TableHead>
                <TableHead>Purchase Docs</TableHead>
                <TableHead>Outward Taxable</TableHead>
                <TableHead>Inward Taxable</TableHead>
                <TableHead>Output Tax</TableHead>
                <TableHead>Input Tax</TableHead>
                <TableHead>Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.gstFilingSummary.periods.map((period) => (
                <TableRow key={period.periodKey}>
                  <TableCell className="font-medium">{period.label}</TableCell>
                  <TableCell>
                    {period.salesInvoiceCount + period.salesCreditNoteCount}
                  </TableCell>
                  <TableCell>
                    {period.purchaseInvoiceCount + period.purchaseDebitNoteCount}
                  </TableCell>
                  <TableCell>{formatAmount(period.outwardTaxableAmount)}</TableCell>
                  <TableCell>{formatAmount(period.inwardTaxableAmount)}</TableCell>
                  <TableCell>{formatAmount(period.outputTaxTotal)}</TableCell>
                  <TableCell>{formatAmount(period.inputTaxTotal)}</TableCell>
                  <TableCell>{formatAmount(period.netTaxPayable)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </SectionShell>
  )
}

export function DayBookSection({ vouchers }: { vouchers: BillingVoucher[] }) {
  const postedVouchers = vouchers
    .filter((voucher) => voucher.status === "posted")
    .sort((left, right) =>
      left.date.localeCompare(right.date) ||
      left.voucherNumber.localeCompare(right.voucherNumber)
    )
  const draftCount = vouchers.filter((voucher) => voucher.status === "draft").length
  const cancelledCount = vouchers.filter((voucher) => voucher.status === "cancelled").length
  const reversedCount = vouchers.filter((voucher) => voucher.status === "reversed").length
  const excludedCount = vouchers.length - postedVouchers.length

  return (
    <SectionShell
      title="Day Book"
      description="Chronological day book built from posted vouchers only, so the book reflects accounting movement rather than draft or invalidated records."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Posted entries"
          value={postedVouchers.length}
          hint="Vouchers currently contributing to the accounting day book."
        />
        <MetricCard
          label="Excluded records"
          value={excludedCount}
          hint="Draft, cancelled, and reversed records left out of the posted book."
        />
        <MetricCard
          label="Drafts"
          value={draftCount}
          hint="Unposted records still under preparation."
        />
        <MetricCard
          label="Invalidated"
          value={cancelledCount + reversedCount}
          hint="Cancelled and reversed records removed from the live day book."
        />
      </div>
      {excludedCount > 0 ? (
        <Card>
          <CardContent className="flex flex-wrap gap-3 p-5 text-sm text-muted-foreground">
            <span>Draft {draftCount}</span>
            <span>Cancelled {cancelledCount}</span>
            <span>Reversed {reversedCount}</span>
          </CardContent>
        </Card>
      ) : null}
      {postedVouchers.length === 0 ? (
        <StateCard message="No posted vouchers are available for the day book yet." />
      ) : (
        <VoucherRegisterTable vouchers={postedVouchers} />
      )}
    </SectionShell>
  )
}

export function DoubleEntrySection({ vouchers }: { vouchers: BillingVoucher[] }) {
  return (
    <SectionShell
      title="Double Entry"
      description="Per-voucher debit and credit inspection modeled the way a Tally-trained operator expects to verify postings."
    >
      <Accordion type="single" collapsible className="space-y-4">
        {vouchers.map((voucher) => {
          const totals = getVoucherTotals(voucher)

          return (
            <AccordionItem
              key={voucher.id}
              value={voucher.id}
              className="overflow-hidden rounded-[1rem] border border-border/70 bg-card/70"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex flex-1 flex-col items-start gap-2 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{voucher.voucherNumber}</p>
                    <Badge variant="outline">{titleFromVoucherType(voucher.type)}</Badge>
                    <Badge variant={isVoucherBalanced(voucher) ? "outline" : "destructive"}>
                      {isVoucherBalanced(voucher) ? "Balanced" : "Mismatch"}
                    </Badge>
                  </div>
                  <div className="mt-1">
                    <ComplianceBadges voucher={voucher} />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {voucher.date} | {voucher.counterparty} | {voucher.narration}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="rounded-[1rem] border border-border/70 bg-background/80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ledger</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Dr</TableHead>
                        <TableHead>Cr</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voucher.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium">{line.ledgerName}</TableCell>
                          <TableCell className="text-muted-foreground">{line.note}</TableCell>
                          <TableCell>
                            {line.side === "debit" ? formatAmount(line.amount) : "--"}
                          </TableCell>
                          <TableCell>
                            {line.side === "credit" ? formatAmount(line.amount) : "--"}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-semibold">Total</TableCell>
                        <TableCell />
                        <TableCell className="font-semibold">
                          {formatAmount(totals.debit)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatAmount(totals.credit)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </SectionShell>
  )
}

export function TrialBalanceSection({ reports }: { reports: BillingAccountingReports }) {
  return (
    <SectionShell
      title="Trial Balance"
      description="Ledger-wise opening, movement, and closing balances derived from posted vouchers."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Debit closing"
          value={formatAmount(reports.trialBalance.debitTotal)}
          hint="Total closing debit balances across the current books."
        />
        <MetricCard
          label="Credit closing"
          value={formatAmount(reports.trialBalance.creditTotal)}
          hint="Total closing credit balances across the current books."
        />
        <MetricCard
          label="Ledgers"
          value={reports.trialBalance.items.length}
          hint="Every billing ledger contributes to this derived balance view."
        />
        <MetricCard
          label="Gap"
          value={formatAmount(
            Math.abs(reports.trialBalance.debitTotal - reports.trialBalance.creditTotal)
          )}
          hint="Any difference here indicates incomplete opening equity or unsupported books."
        />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ledger</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead>Dr</TableHead>
                <TableHead>Cr</TableHead>
                <TableHead>Closing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.trialBalance.items.map((item) => (
                <TableRow key={item.ledgerId}>
                  <TableCell className="font-medium">{item.ledgerName}</TableCell>
                  <TableCell>{item.group}</TableCell>
                  <TableCell>
                    {formatAmount(item.openingAmount)} {item.openingSide === "debit" ? "Dr" : "Cr"}
                  </TableCell>
                  <TableCell>{formatAmount(item.debitAmount)}</TableCell>
                  <TableCell>{formatAmount(item.creditAmount)}</TableCell>
                  <TableCell>
                    {formatAmount(item.closingAmount)} {item.closingSide === "debit" ? "Dr" : "Cr"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </SectionShell>
  )
}

export function GeneralLedgerSection({ reports }: { reports: BillingAccountingReports }) {
  return (
    <SectionShell
      title="General Ledger"
      description="Ledger-wise running movement register built from normalized posted accounting entries."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Ledger books"
          value={reports.generalLedger.items.length}
          hint="Each ledger gets its own running movement register."
        />
        <MetricCard
          label="Entry rows"
          value={reports.generalLedger.items.reduce((sum, item) => sum + item.entries.length, 0)}
          hint="Posted debit and credit movements included across all ledger books."
        />
        <MetricCard
          label="Largest debit"
          value={formatAmount(
            Math.max(0, ...reports.generalLedger.items.map((item) => item.debitTotal))
          )}
          hint="Highest debit movement among the current ledger registers."
        />
        <MetricCard
          label="Largest credit"
          value={formatAmount(
            Math.max(0, ...reports.generalLedger.items.map((item) => item.creditTotal))
          )}
          hint="Highest credit movement among the current ledger registers."
        />
      </div>
      <div className="space-y-4">
        {reports.generalLedger.items.map((ledger) => (
          <Card key={ledger.ledgerId}>
            <CardHeader>
              <CardTitle>{ledger.ledgerName}</CardTitle>
              <CardDescription>
                {ledger.group} • Opening {formatAmount(ledger.openingAmount)} {ledger.openingSide === "debit" ? "Dr" : "Cr"} • Closing {formatAmount(ledger.closingAmount)} {ledger.closingSide === "debit" ? "Dr" : "Cr"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <MetricCard
                  label="Debit total"
                  value={formatAmount(ledger.debitTotal)}
                  hint="Debit movement posted into this ledger."
                />
                <MetricCard
                  label="Credit total"
                  value={formatAmount(ledger.creditTotal)}
                  hint="Credit movement posted into this ledger."
                />
                <MetricCard
                  label="Entries"
                  value={ledger.entries.length}
                  hint="Running ledger rows available for drillback."
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Voucher</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>Dr/Cr</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Running</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        No posted movements for this ledger yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledger.entries.map((entry) => (
                      <TableRow key={entry.entryId}>
                        <TableCell>{entry.voucherDate}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{entry.voucherNumber}</p>
                            <p className="text-xs text-muted-foreground">{titleFromVoucherType(entry.voucherType)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{entry.counterparty}</p>
                            <p className="text-xs text-muted-foreground">{entry.narration}</p>
                          </div>
                        </TableCell>
                        <TableCell>{entry.side === "debit" ? "Dr" : "Cr"}</TableCell>
                        <TableCell>{formatAmount(entry.amount)}</TableCell>
                        <TableCell>
                          {formatAmount(entry.runningAmount)} {entry.runningSide === "debit" ? "Dr" : "Cr"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionShell>
  )
}

export function BankBookSection({ reports }: { reports: BillingAccountingReports }) {
  return (
    <SectionShell
      title="Bank Book"
      description="Bank-ledger running book built from posted normalized ledger entries."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Bank ledgers"
          value={reports.bankBook.items.length}
          hint="Bank account ledgers contributing to the current bank book."
        />
        <MetricCard
          label="Entry rows"
          value={reports.bankBook.items.reduce((sum, item) => sum + item.entries.length, 0)}
          hint="Posted bank-book movements across all bank ledgers."
        />
        <MetricCard
          label="Largest debit"
          value={formatAmount(
            Math.max(0, ...reports.bankBook.items.map((item) => item.debitTotal))
          )}
          hint="Highest debit movement across bank ledgers."
        />
        <MetricCard
          label="Largest credit"
          value={formatAmount(
            Math.max(0, ...reports.bankBook.items.map((item) => item.creditTotal))
          )}
          hint="Highest credit movement across bank ledgers."
        />
      </div>
      {reports.bankBook.items.length === 0 ? (
        <StateCard message="No bank ledgers with posted movement are available yet." />
      ) : (
        <div className="space-y-4">
          {reports.bankBook.items.map((ledger) => (
            <Card key={ledger.ledgerId}>
              <CardHeader>
                <CardTitle>{ledger.ledgerName}</CardTitle>
                <CardDescription>
                  {ledger.group} | Opening {formatAmount(ledger.openingAmount)}{" "}
                  {ledger.openingSide === "debit" ? "Dr" : "Cr"} | Closing{" "}
                  {formatAmount(ledger.closingAmount)}{" "}
                  {ledger.closingSide === "debit" ? "Dr" : "Cr"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <MetricCard
                    label="Debit total"
                    value={formatAmount(ledger.debitTotal)}
                    hint="Money received into the bank ledger."
                  />
                  <MetricCard
                    label="Credit total"
                    value={formatAmount(ledger.creditTotal)}
                    hint="Money paid out of the bank ledger."
                  />
                  <MetricCard
                    label="Entries"
                    value={ledger.entries.length}
                    hint="Running rows available for drillback."
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Voucher</TableHead>
                      <TableHead>Counterparty</TableHead>
                      <TableHead>Dr/Cr</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Running</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          No posted movements for this bank ledger yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledger.entries.map((entry) => (
                        <TableRow key={entry.entryId}>
                          <TableCell>{entry.voucherDate}</TableCell>
                          <TableCell className="font-medium">
                            {getVoucherPostingRoute(entry.voucherType, entry.voucherId) ? (
                              <Link
                                className="underline-offset-4 hover:underline"
                                to={getVoucherPostingRoute(entry.voucherType, entry.voucherId)!}
                              >
                                {entry.voucherNumber}
                              </Link>
                            ) : (
                              entry.voucherNumber
                            )}
                          </TableCell>
                          <TableCell>{entry.counterparty}</TableCell>
                          <TableCell>{entry.side === "debit" ? "Dr" : "Cr"}</TableCell>
                          <TableCell>{formatAmount(entry.amount)}</TableCell>
                          <TableCell>
                            {formatAmount(entry.runningAmount)}{" "}
                            {entry.runningSide === "debit" ? "Dr" : "Cr"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

export function CashBookSection({ reports }: { reports: BillingAccountingReports }) {
  return (
    <SectionShell
      title="Cash Book"
      description="Cash-ledger running book built from posted normalized ledger entries."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Cash ledgers"
          value={reports.cashBook.items.length}
          hint="Cash ledgers contributing to the current cash book."
        />
        <MetricCard
          label="Entry rows"
          value={reports.cashBook.items.reduce((sum, item) => sum + item.entries.length, 0)}
          hint="Posted cash-book movements across all cash ledgers."
        />
        <MetricCard
          label="Largest debit"
          value={formatAmount(
            Math.max(0, ...reports.cashBook.items.map((item) => item.debitTotal))
          )}
          hint="Highest debit movement across cash ledgers."
        />
        <MetricCard
          label="Largest credit"
          value={formatAmount(
            Math.max(0, ...reports.cashBook.items.map((item) => item.creditTotal))
          )}
          hint="Highest credit movement across cash ledgers."
        />
      </div>
      {reports.cashBook.items.length === 0 ? (
        <StateCard message="No cash ledgers with posted movement are available yet." />
      ) : (
        <div className="space-y-4">
          {reports.cashBook.items.map((ledger) => (
            <Card key={ledger.ledgerId}>
              <CardHeader>
                <CardTitle>{ledger.ledgerName}</CardTitle>
                <CardDescription>
                  {ledger.group} | Opening {formatAmount(ledger.openingAmount)}{" "}
                  {ledger.openingSide === "debit" ? "Dr" : "Cr"} | Closing{" "}
                  {formatAmount(ledger.closingAmount)}{" "}
                  {ledger.closingSide === "debit" ? "Dr" : "Cr"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <MetricCard
                    label="Debit total"
                    value={formatAmount(ledger.debitTotal)}
                    hint="Cash received into this ledger."
                  />
                  <MetricCard
                    label="Credit total"
                    value={formatAmount(ledger.creditTotal)}
                    hint="Cash paid out from this ledger."
                  />
                  <MetricCard
                    label="Entries"
                    value={ledger.entries.length}
                    hint="Running rows available for drillback."
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Voucher</TableHead>
                      <TableHead>Counterparty</TableHead>
                      <TableHead>Dr/Cr</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Running</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          No posted movements for this cash ledger yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledger.entries.map((entry) => (
                        <TableRow key={entry.entryId}>
                          <TableCell>{entry.voucherDate}</TableCell>
                          <TableCell className="font-medium">
                            {getVoucherPostingRoute(entry.voucherType, entry.voucherId) ? (
                              <Link
                                className="underline-offset-4 hover:underline"
                                to={getVoucherPostingRoute(entry.voucherType, entry.voucherId)!}
                              >
                                {entry.voucherNumber}
                              </Link>
                            ) : (
                              entry.voucherNumber
                            )}
                          </TableCell>
                          <TableCell>{entry.counterparty}</TableCell>
                          <TableCell>{entry.side === "debit" ? "Dr" : "Cr"}</TableCell>
                          <TableCell>{formatAmount(entry.amount)}</TableCell>
                          <TableCell>
                            {formatAmount(entry.runningAmount)}{" "}
                            {entry.runningSide === "debit" ? "Dr" : "Cr"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

export function BankReconciliationSection({
  reports,
  onReconcileVoucher,
}: {
  reports: BillingAccountingReports
  onReconcileVoucher: (
    voucherId: string,
    status: "pending" | "matched" | "mismatch"
  ) => Promise<void>
}) {
  return (
    <SectionShell
      title="Bank Reconciliation"
      description="Pending and mismatched bank-entry reconciliation workbench built from posted bank-book movement and stored voucher reconciliation state."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="As of"
          value={reports.bankReconciliation.asOfDate}
          hint="Current reconciliation view cutoff date."
        />
        <MetricCard
          label="Matched rows"
          value={reports.bankReconciliation.matchedEntryCount}
          hint="Bank entries already tied to statement references and cleared dates."
        />
        <MetricCard
          label="Pending rows"
          value={reports.bankReconciliation.pendingEntryCount}
          hint="Bank-entry rows still awaiting reconciliation treatment."
        />
        <MetricCard
          label="Mismatch amount"
          value={formatAmount(reports.bankReconciliation.mismatchAmountTotal)}
          hint="Absolute statement-to-book mismatch currently under review."
        />
        <MetricCard
          label="Oldest pending"
          value={`${reports.bankReconciliation.oldestPendingDays} days`}
          hint="Age of the oldest unreconciled bank entry in the current books."
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Matched debit"
          value={formatAmount(reports.bankReconciliation.matchedDebitTotal)}
          hint="Cleared bank inflows matched to statement activity."
        />
        <MetricCard
          label="Matched credit"
          value={formatAmount(reports.bankReconciliation.matchedCreditTotal)}
          hint="Cleared bank outflows matched to statement activity."
        />
        <MetricCard
          label="Pending debit"
          value={formatAmount(reports.bankReconciliation.pendingDebitTotal)}
          hint="Bank inflow movement pending reconciliation."
        />
        <MetricCard
          label="Pending credit"
          value={formatAmount(reports.bankReconciliation.pendingCreditTotal)}
          hint="Bank outflow movement pending reconciliation."
        />
      </div>
      {reports.bankReconciliation.ledgers.length === 0 ? (
        <StateCard message="No bank-ledger entries are available for reconciliation yet." />
      ) : (
        <div className="space-y-4">
          {reports.bankReconciliation.ledgers.map((ledger) => (
            <Card key={ledger.ledgerId}>
              <CardHeader>
                <CardTitle>{ledger.ledgerName}</CardTitle>
                <CardDescription>
                  Opening {formatAmount(ledger.openingAmount)}{" "}
                  {ledger.openingSide === "debit" ? "Dr" : "Cr"} | Closing{" "}
                  {formatAmount(ledger.closingAmount)}{" "}
                  {ledger.closingSide === "debit" ? "Dr" : "Cr"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <MetricCard
                    label="Matched rows"
                    value={ledger.matchedEntryCount}
                    hint="Cleared rows for this bank ledger."
                  />
                  <MetricCard
                    label="Matched debit"
                    value={formatAmount(ledger.matchedDebitTotal)}
                    hint="Debit rows already matched to statement movement."
                  />
                  <MetricCard
                    label="Matched credit"
                    value={formatAmount(ledger.matchedCreditTotal)}
                    hint="Credit rows already matched to statement movement."
                  />
                  <MetricCard
                    label="Pending debit"
                    value={formatAmount(ledger.pendingDebitTotal)}
                    hint="Debit-side entries awaiting statement matching."
                  />
                  <MetricCard
                    label="Pending credit"
                    value={formatAmount(ledger.pendingCreditTotal)}
                    hint="Credit-side entries awaiting statement matching."
                  />
                  <MetricCard
                    label="Mismatch rows"
                    value={ledger.mismatchEntryCount}
                    hint="Voucher rows with statement differences that need resolution."
                  />
                  <MetricCard
                    label="Mismatch amount"
                    value={formatAmount(ledger.mismatchAmountTotal)}
                    hint="Absolute amount difference across mismatched rows."
                  />
                  <MetricCard
                    label="Oldest pending"
                    value={`${ledger.oldestPendingDays} days`}
                    hint="Age of the oldest pending row in this ledger."
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Voucher</TableHead>
                      <TableHead>Counterparty</TableHead>
                      <TableHead>Dr/Cr</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Statement state</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.pendingEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-muted-foreground">
                          No pending statement matches for this ledger.
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledger.pendingEntries.map((entry) => (
                        <TableRow key={entry.entryId}>
                          <TableCell>{entry.voucherDate}</TableCell>
                          <TableCell className="font-medium">
                            {getVoucherPostingRoute(entry.voucherType, entry.voucherId) ? (
                              <Link
                                className="underline-offset-4 hover:underline"
                                to={getVoucherPostingRoute(entry.voucherType, entry.voucherId)!}
                              >
                                {entry.voucherNumber}
                              </Link>
                            ) : (
                              entry.voucherNumber
                            )}
                          </TableCell>
                          <TableCell>{entry.counterparty}</TableCell>
                          <TableCell>{entry.side === "debit" ? "Dr" : "Cr"}</TableCell>
                          <TableCell>{formatAmount(entry.amount)}</TableCell>
                          <TableCell>{entry.pendingAgeDays ?? 0} days</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            Awaiting statement reference and cleared amount.
                          </TableCell>
                          <TableCell className="space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void onReconcileVoucher(entry.voucherId, "matched")}
                            >
                              Mark Cleared
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => void onReconcileVoucher(entry.voucherId, "mismatch")}
                            >
                              Mark Mismatch
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                    </Table>
                    {ledger.matchedEntries.length > 0 ? (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Matched Entries</div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Voucher</TableHead>
                              <TableHead>Cleared Date</TableHead>
                              <TableHead>Statement Ref</TableHead>
                              <TableHead>Dr/Cr</TableHead>
                              <TableHead>Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ledger.matchedEntries.map((entry) => (
                              <TableRow key={entry.entryId}>
                                <TableCell>{entry.voucherDate}</TableCell>
                                <TableCell className="font-medium">
                                  {getVoucherPostingRoute(entry.voucherType, entry.voucherId) ? (
                                    <Link
                                      className="underline-offset-4 hover:underline"
                                      to={getVoucherPostingRoute(entry.voucherType, entry.voucherId)!}
                                    >
                                      {entry.voucherNumber}
                                    </Link>
                                  ) : (
                                    entry.voucherNumber
                                  )}
                                </TableCell>
                                <TableCell>{entry.clearedDate ?? "--"}</TableCell>
                                <TableCell>{entry.statementReference ?? "--"}</TableCell>
                                <TableCell>{entry.side === "debit" ? "Dr" : "Cr"}</TableCell>
                                <TableCell>{formatAmount(entry.amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : null}
                {ledger.mismatchedEntries.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Mismatched Entries</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Voucher</TableHead>
                          <TableHead>Statement Ref</TableHead>
                          <TableHead>Book Amount</TableHead>
                          <TableHead>Statement Amount</TableHead>
                          <TableHead>Mismatch</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledger.mismatchedEntries.map((entry) => (
                          <TableRow key={entry.entryId}>
                            <TableCell>{entry.voucherDate}</TableCell>
                            <TableCell className="font-medium">
                              {getVoucherPostingRoute(entry.voucherType, entry.voucherId) ? (
                                <Link
                                  className="underline-offset-4 hover:underline"
                                  to={getVoucherPostingRoute(entry.voucherType, entry.voucherId)!}
                                >
                                  {entry.voucherNumber}
                                </Link>
                              ) : (
                                entry.voucherNumber
                              )}
                            </TableCell>
                            <TableCell>{entry.statementReference ?? "--"}</TableCell>
                            <TableCell>{formatAmount(entry.amount)}</TableCell>
                            <TableCell>
                              {entry.statementAmount !== null
                                ? formatAmount(entry.statementAmount)
                                : "--"}
                            </TableCell>
                            <TableCell>
                              {entry.mismatchAmount !== null
                                ? formatAmount(entry.mismatchAmount)
                                : "--"}
                            </TableCell>
                            <TableCell className="space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void onReconcileVoucher(entry.voucherId, "matched")}
                              >
                                Mark Cleared
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => void onReconcileVoucher(entry.voucherId, "pending")}
                              >
                                Reset Pending
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

export function ProfitAndLossSection({ reports }: { reports: BillingAccountingReports }) {
  return (
    <SectionShell
      title="Profit & Loss"
      description="Income and expense statement built from posted ledgers and voucher movements."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total income"
          value={formatAmount(reports.profitAndLoss.totalIncome)}
          hint="Income-ledger closings contributing to the current period statement."
        />
        <MetricCard
          label="Total expense"
          value={formatAmount(reports.profitAndLoss.totalExpense)}
          hint="Expense-ledger closings contributing to the current period statement."
        />
        <MetricCard
          label="Net profit"
          value={formatAmount(reports.profitAndLoss.netProfit)}
          hint="Shown when income exceeds expense."
        />
        <MetricCard
          label="Net loss"
          value={formatAmount(reports.profitAndLoss.netLoss)}
          hint="Shown when expense exceeds income."
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.profitAndLoss.incomeItems.map((item) => (
              <div
                key={item.ledgerId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">{item.ledgerName}</p>
                  <p className="text-sm text-muted-foreground">{item.group}</p>
                </div>
                <p className="font-medium text-foreground">{formatAmount(item.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.profitAndLoss.expenseItems.map((item) => (
              <div
                key={item.ledgerId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">{item.ledgerName}</p>
                  <p className="text-sm text-muted-foreground">{item.group}</p>
                </div>
                <p className="font-medium text-foreground">{formatAmount(item.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}

export function BalanceSheetSection({ reports }: { reports: BillingAccountingReports }) {
  return (
    <SectionShell
      title="Balance Sheet"
      description="Asset and liability view with current period earnings carried into the statement."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Assets"
          value={formatAmount(reports.balanceSheet.totalAssets)}
          hint="Asset-side closing balances including any current period loss carry."
        />
        <MetricCard
          label="Liabilities"
          value={formatAmount(reports.balanceSheet.totalLiabilities)}
          hint="Liability-side closing balances including current period profit carry."
        />
        <MetricCard
          label="Balance gap"
          value={formatAmount(reports.balanceSheet.balanceGap)}
          hint="A non-zero gap usually means capital/opening equity is not modeled yet."
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.balanceSheet.assetItems.map((item) => (
              <div
                key={item.ledgerId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">{item.ledgerName}</p>
                  <p className="text-sm text-muted-foreground">{item.group}</p>
                </div>
                <p className="font-medium text-foreground">{formatAmount(item.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Liabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.balanceSheet.liabilityItems.map((item) => (
              <div
                key={item.ledgerId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">{item.ledgerName}</p>
                  <p className="text-sm text-muted-foreground">{item.group}</p>
                </div>
                <p className="font-medium text-foreground">{formatAmount(item.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}

export function LedgerGuideSupportSection() {
  return (
    <SectionShell
      title="Ledger Usage Guide"
      description="How to structure billing accounts using category, ledger, voucher group, and voucher type in the finalized accounting model."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Setup Order</CardTitle>
            <CardDescription>
              Create masters in this order so the accounting chain stays valid.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="font-medium text-foreground">1. Category</p>
              <p>Create the accounting bucket such as Assets, Liabilities, Income, or Expenses.</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="font-medium text-foreground">2. Ledger</p>
              <p>Create the account master under the selected category, for example Sales Account or Purchase Account.</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="font-medium text-foreground">3. Voucher Group</p>
              <p>Create the business-side voucher grouping such as Sales, Purchase, Receipt, Payment, Contra, or Journal.</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="font-medium text-foreground">4. Voucher Type</p>
              <p>Bind the voucher type to one voucher group, one category, and one ledger so posting intent stays explicit.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Master Chain</CardTitle>
            <CardDescription>
              The finalized billing model now keeps both accounting and operational grouping aligned.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="font-medium text-foreground">Accounting chain</p>
              <p><code>Category -&gt; Ledger -&gt; Voucher Type</code></p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="font-medium text-foreground">Operational chain</p>
              <p><code>Voucher Group -&gt; Voucher Type</code></p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="font-medium text-foreground">Validation rule</p>
              <p>The selected voucher type ledger must belong to the selected category, so the account structure stays strict.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Example</CardTitle>
          <CardDescription>
            One practical setup for sales-side billing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
            <p><span className="font-medium text-foreground">Category:</span> Income</p>
            <p><span className="font-medium text-foreground">Ledger:</span> Sales Account</p>
            <p><span className="font-medium text-foreground">Voucher Group:</span> Sales</p>
            <p><span className="font-medium text-foreground">Voucher Type:</span> Fabric Sales</p>
          </div>
          <p>
            In that model, the voucher type belongs to the Sales group operationally, and it also points to the Sales Account ledger under the Income category for accounting alignment.
          </p>
        </CardContent>
      </Card>
    </SectionShell>
  )
}

export function BillOutstandingSection({ reports }: { reports: BillingAccountingReports }) {
  return (
    <SectionShell
      title="Bill Outstanding"
      description="Receivable and payable control view covering open bills, aging, follow-up, overpayment or on-account exceptions, and party-wise settlement summaries."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Receivables"
          value={formatAmount(reports.outstanding.receivableTotal)}
          hint="Open sales bills after receipt adjustments."
        />
        <MetricCard
          label="Payables"
          value={formatAmount(reports.outstanding.payableTotal)}
          hint="Open purchase bills after payment adjustments."
        />
        <MetricCard
          label="Open bills"
          value={reports.outstanding.items.length}
          hint="Each item tracks original, settled, and outstanding values."
        />
        <MetricCard
          label="Exceptions"
          value={reports.settlementExceptions.items.length}
          hint="Advance, on-account, and overpayment cases needing operator attention."
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receivable Aging</CardTitle>
            <CardDescription>
              Sales-side dues as of {reports.receivableAging.asOfDate}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.receivableAging.buckets.map((bucket) => (
              <div
                key={bucket.bucketKey}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-card/70 px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">{bucket.label}</span>
                <span className="font-medium text-foreground">{formatAmount(bucket.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payable Aging</CardTitle>
            <CardDescription>
              Purchase-side dues as of {reports.payableAging.asOfDate}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.payableAging.buckets.map((bucket) => (
              <div
                key={bucket.bucketKey}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-card/70 px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">{bucket.label}</span>
                <span className="font-medium text-foreground">{formatAmount(bucket.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Settlement Follow-up</CardTitle>
          <CardDescription>
            Open bills ranked by overdue position and collection or payment action.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.settlementFollowUp.items.map((item) => (
                <TableRow key={`${item.voucherId}:follow-up`}>
                  <TableCell className="font-medium">
                    {getVoucherPostingRoute(item.voucherType, item.voucherId) ? (
                      <Link
                        className="underline-offset-4 hover:underline"
                        to={getVoucherPostingRoute(item.voucherType, item.voucherId)!}
                      >
                        {item.voucherNumber}
                      </Link>
                    ) : (
                      item.voucherNumber
                    )}
                  </TableCell>
                  <TableCell>{item.counterparty}</TableCell>
                  <TableCell>{item.dueDate ?? "No due date"}</TableCell>
                  <TableCell>{item.overdueDays} days</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.priority === "high"
                          ? "destructive"
                          : item.priority === "medium"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatAmount(item.outstandingAmount)}</TableCell>
                  <TableCell>
                    <Link className="underline-offset-4 hover:underline" to={item.actionRoute}>
                      {item.recommendedAction}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Settlement Exceptions</CardTitle>
            <CardDescription>
              Advance, on-account, and overpayment positions needing explicit treatment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Advance"
                value={formatAmount(reports.settlementExceptions.advanceTotal)}
                hint="New-reference settlements recorded before bill matching."
              />
              <MetricCard
                label="On account"
                value={formatAmount(reports.settlementExceptions.onAccountTotal)}
                hint="Unmatched on-account settlements still pending allocation."
              />
              <MetricCard
                label="Overpayment"
                value={formatAmount(reports.settlementExceptions.overpaymentTotal)}
                hint="Collections or payments exceeding original bill value."
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.settlementExceptions.items.map((item) => (
                  <TableRow key={`${item.voucherId}:${item.category}:${item.referenceVoucherNumber ?? "direct"}`}>
                    <TableCell className="font-medium">{item.voucherNumber}</TableCell>
                    <TableCell>{item.counterparty}</TableCell>
                    <TableCell className="capitalize">{item.category.replace("_", " ")}</TableCell>
                    <TableCell>{item.referenceVoucherNumber ?? "Direct"}</TableCell>
                    <TableCell>{formatAmount(item.amount)}</TableCell>
                    <TableCell>{item.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Party-wise Collection and Payment Summary</CardTitle>
            <CardDescription>
              Receipt and payment behavior summarized by counterparty.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Receipts</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Unallocated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.partySettlementSummary.items.map((item) => (
                  <TableRow key={item.counterparty}>
                    <TableCell className="font-medium">{item.counterparty}</TableCell>
                    <TableCell>
                      {formatAmount(item.receiptAmount)}
                      <p className="text-sm text-muted-foreground">{item.receiptCount} vouchers</p>
                    </TableCell>
                    <TableCell>
                      {formatAmount(item.paymentAmount)}
                      <p className="text-sm text-muted-foreground">{item.paymentCount} vouchers</p>
                    </TableCell>
                    <TableCell>
                      {formatAmount(item.allocatedReceiptAmount + item.allocatedPaymentAmount)}
                    </TableCell>
                    <TableCell>
                      {formatAmount(item.unallocatedReceiptAmount + item.unallocatedPaymentAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Open Bills</CardTitle>
          <CardDescription>
            Detailed bill-wise exposure as of {reports.outstanding.asOfDate}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Original</TableHead>
                <TableHead>Settled</TableHead>
                <TableHead>Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.outstanding.items.map((item) => (
                <TableRow key={item.voucherId}>
                  <TableCell className="font-medium">
                    {item.voucherNumber}
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                  </TableCell>
                  <TableCell className="capitalize">{item.voucherType}</TableCell>
                  <TableCell>{item.counterparty}</TableCell>
                  <TableCell>{item.dueDate ?? item.date}</TableCell>
                  <TableCell>{item.overdueDays} days</TableCell>
                  <TableCell>{formatAmount(item.originalAmount)}</TableCell>
                  <TableCell>{formatAmount(item.settledAmount)}</TableCell>
                  <TableCell>{formatAmount(item.outstandingAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </SectionShell>
  )
}

export function MonthEndChecklistSection({
  reports,
}: {
  reports: BillingAccountingReports
}) {
  return (
    <SectionShell
      title="Month-End Checklist"
      description="Period-close readiness view built from billing control signals, reconciliation state, GST summaries, and finance review queues."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Ready"
          value={reports.monthEndChecklist.readyCount}
          hint="Checklist controls currently clear for closing."
        />
        <MetricCard
          label="Attention"
          value={reports.monthEndChecklist.attentionCount}
          hint="Controls that should be reviewed before closing."
        />
        <MetricCard
          label="Blocked"
          value={reports.monthEndChecklist.blockedCount}
          hint="Controls that should stop period close until resolved."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Close Controls</CardTitle>
          <CardDescription>
            Checklist status as of {reports.monthEndChecklist.asOfDate}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Control</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.monthEndChecklist.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.status}</Badge>
                    </TableCell>
                    <TableCell>{item.value}</TableCell>
                    <TableCell className="text-muted-foreground">{item.detail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  )
}

export function FinancialYearCloseSection({
  onRunYearEndControl,
  onRunRollover,
  onRunWorkflow,
  reports,
}: {
  onRunYearEndControl: (action: "preview" | "apply") => Promise<void>
  onRunRollover: (action: "preview" | "apply") => Promise<void>
  onRunWorkflow: (action: "preview" | "close") => Promise<void>
  reports: BillingAccountingReports
}) {
  const workflow = reports.financialYearCloseWorkflow
  const rolloverPolicy = reports.openingBalanceRolloverPolicy
  const yearEndControlPolicy = reports.yearEndAdjustmentControlPolicy

  return (
    <SectionShell
      title="Financial-Year Close"
      description="Preview and close the active billing financial year using the current month-end control posture."
    >
      {workflow ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Financial Year" value={workflow.financialYearLabel} hint={workflow.financialYearCode} />
            <MetricCard label="Voucher Count" value={workflow.voucherCount} hint="Vouchers in the active financial year candidate." />
            <MetricCard label="Blocked" value={workflow.blockedItemCount} hint="Checklist blockers that still prevent close." />
            <MetricCard label="Ready" value={workflow.readyItemCount} hint="Checklist items already clear for close." />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Close Workflow</CardTitle>
              <CardDescription>
                Current status: {workflow.status}. Year range {workflow.startDate} to {workflow.endDate}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void onRunWorkflow("preview")} variant="outline">
                  Refresh Preview
                </Button>
                <Button
                  onClick={() => void onRunWorkflow("close")}
                  disabled={workflow.status === "closed"}
                >
                  Close Financial Year
                </Button>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
                {workflow.status === "closed"
                  ? `Closed at ${workflow.closedAt ?? "-"} by ${workflow.closedByUserId ?? "unknown user"}.`
                  : "Close will remain blocked until month-end checklist blockers are cleared."}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opening Balance Rollover</CardTitle>
              <CardDescription>
                Prepare the next financial year opening balances from the closed year policy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void onRunRollover("preview")} variant="outline">
                  Preview Rollover
                </Button>
                <Button
                  onClick={() => void onRunRollover("apply")}
                  disabled={workflow.status !== "closed"}
                >
                  Apply Rollover
                </Button>
              </div>
              {rolloverPolicy ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <MetricCard label="Target Year" value={rolloverPolicy.targetFinancialYearLabel} hint={rolloverPolicy.targetFinancialYearCode} />
                    <MetricCard label="Carry Forward" value={rolloverPolicy.carryForwardLedgerCount} hint="Balance-sheet ledgers carried forward." />
                    <MetricCard label="Reset" value={rolloverPolicy.resetLedgerCount} hint="Nominal ledgers reset to zero." />
                    <MetricCard label="Status" value={rolloverPolicy.status} hint={rolloverPolicy.appliedAt ? `Applied ${rolloverPolicy.appliedAt.slice(0, 10)}` : `Prepared ${rolloverPolicy.preparedAt.slice(0, 10)}`} />
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
                    {rolloverPolicy.status === "applied"
                      ? `Applied by ${rolloverPolicy.appliedByUserId ?? "unknown user"} on ${rolloverPolicy.appliedAt ?? "-"}.`
                      : "Preview the carry-forward set first, then apply after close confirmation."}
                  </div>
                  <div className="overflow-hidden rounded-[1rem] border border-border/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ledger</TableHead>
                          <TableHead>Treatment</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Rollover</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rolloverPolicy.items.slice(0, 12).map((item) => (
                          <TableRow key={item.ledgerId}>
                            <TableCell>
                              <div className="font-medium text-foreground">{item.ledgerName}</div>
                              <div className="text-xs text-muted-foreground">{item.ledgerGroup}</div>
                            </TableCell>
                            <TableCell>{item.policyTreatment === "carry_forward" ? "Carry forward" : "Reset nominal"}</TableCell>
                            <TableCell>{item.sourceClosingSide} {formatAmount(item.sourceClosingAmount)}</TableCell>
                            <TableCell>{item.rolloverSide} {formatAmount(item.rolloverAmount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <StateCard message="No opening-balance rollover policy has been prepared yet." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Year-End Controls</CardTitle>
              <CardDescription>
                Review adjustment-journal and carry-forward controls before final year-end sign-off.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void onRunYearEndControl("preview")} variant="outline">
                  Preview Controls
                </Button>
                <Button
                  onClick={() => void onRunYearEndControl("apply")}
                  disabled={workflow.status !== "closed"}
                >
                  Apply Controls
                </Button>
              </div>
              {yearEndControlPolicy ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <MetricCard label="Journal Review" value={yearEndControlPolicy.journalVoucherCount} hint="Journal vouchers in the source year." />
                    <MetricCard label="Nominal Ledgers" value={yearEndControlPolicy.nominalLedgerCount} hint="Income and expense ledgers in the close set." />
                    <MetricCard label="Carry Forward" value={yearEndControlPolicy.carryForwardLedgerCount} hint="Balance-sheet ledgers available for brought-forward balances." />
                    <MetricCard label="Status" value={yearEndControlPolicy.status} hint={`${yearEndControlPolicy.blockedItemCount} blocked / ${yearEndControlPolicy.attentionItemCount} attention`} />
                  </div>
                  <div className="overflow-hidden rounded-[1rem] border border-border/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Control</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Detail</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {yearEndControlPolicy.items.map((item) => (
                          <TableRow key={item.controlKey}>
                            <TableCell className="font-medium">{item.label}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.status}</Badge>
                            </TableCell>
                            <TableCell>{item.value}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.detail} {item.recommendedAction}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <StateCard message="No year-end adjustment control policy has been prepared yet." />
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <StateCard message="No billing financial year candidate is available yet for close workflow." />
      )}
    </SectionShell>
  )
}

