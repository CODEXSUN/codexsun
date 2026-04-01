import {
  calculateVoucherTotals,
  resolveLedgerName,
} from '@billing-core/index'
import { Badge } from '@admin-web/components/ui/badge'
import { Button } from '@admin-web/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@admin-web/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin-web/components/ui/table'
import type { BillingVoucher, BillingVoucherModuleDefinition } from '@billing-web/features/billing/lib/billing-types'

export function VoucherDetailDialog({
  open,
  voucher,
  workspace,
  module,
  onOpenChange,
}: {
  open: boolean
  voucher: BillingVoucher | null
  workspace: {
    ledgers: import('@billing-core/index').BillingLedger[]
    taxRates: import('@billing-core/index').BillingTaxRate[]
    isReadOnly: boolean
  }
  module: BillingVoucherModuleDefinition
  onOpenChange: (open: boolean) => void
}) {
  if (!voucher) {
    return null
  }

  const totals = calculateVoucherTotals(voucher, workspace.taxRates, module.usesInventoryRows)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-2xl p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>{voucher.voucherNumber}</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">{module.documentLabel} detail surface.</p>
            </div>
            <Badge variant={voucher.status === 'posted' ? 'default' : voucher.status === 'cancelled' ? 'secondary' : 'outline'}>
              {voucher.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid gap-6 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1rem] border border-border/70 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Date</p>
              <p className="mt-2 font-semibold">{voucher.postingDate}</p>
            </div>
            <div className="rounded-[1rem] border border-border/70 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Reference</p>
              <p className="mt-2 font-semibold">{voucher.referenceNumber || '-'}</p>
            </div>
            <div className="rounded-[1rem] border border-border/70 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Counterparty</p>
              <p className="mt-2 font-semibold">{resolveLedgerName(workspace.ledgers, voucher.counterpartyLedgerId)}</p>
            </div>
            <div className="rounded-[1rem] border border-border/70 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Total</p>
              <p className="mt-2 font-semibold">{(module.usesInventoryRows ? totals.total : totals.debit).toFixed(2)}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.2rem] border border-border/70">
            <div className="border-b border-border/60 bg-muted/20 px-4 py-3">
              <p className="font-semibold text-foreground">Rows</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>Ledger</TableHead>
                    <TableHead>Description</TableHead>
                    {module.usesInventoryRows ? (
                      <TableHead className="text-right">Total</TableHead>
                    ) : (
                      <>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voucher.lines.map((line, index) => (
                    <TableRow key={line.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{resolveLedgerName(workspace.ledgers, line.ledgerId)}</TableCell>
                      <TableCell>{line.itemName || line.description || '-'}</TableCell>
                      {module.usesInventoryRows ? (
                        <TableCell className="text-right">{(line.quantity * line.rate).toFixed(2)}</TableCell>
                      ) : (
                        <>
                          <TableCell className="text-right">{line.debit.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{line.credit.toFixed(2)}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          {workspace.isReadOnly ? (
            <p className="mr-auto text-sm text-muted-foreground">
              Billing is currently running in read-only API mode until audit-safe posting flows are added.
            </p>
          ) : null}
          <Button type="button" variant="outline" onClick={() => window.print()}>
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
