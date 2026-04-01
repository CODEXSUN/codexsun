import { Calculator, Landmark, ReceiptText, Scale, ShieldCheck, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@admin-web/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin-web/components/ui/card'
import { useBillingRouteBuilder } from '@billing-web/features/billing/lib/billing-routing'
import { useBillingWorkspace } from '@billing-web/features/billing/lib/use-billing-workspace'
import { BillingWorkspaceStatus } from '@billing-web/features/billing/modules/shared/components/billing-workspace-status'

export function BillingOverviewPage() {
  const { workspace, loading, error } = useBillingWorkspace()
  const buildBillingHref = useBillingRouteBuilder()
  const modules = [
    { name: 'Ledger Groups', route: '/ledger-groups', icon: Landmark, summary: 'Primary and child account-group hierarchy like a Tally-style masters surface.' },
    { name: 'Ledgers', route: '/ledgers', icon: Landmark, summary: 'Account masters, opening balances, GSTIN, and party or bank linkage.' },
    { name: 'Voucher Groups', route: '/voucher-groups', icon: Scale, summary: 'Scaffold for Tally-style voucher grouping and control surfaces.' },
    { name: 'Vouchers', route: '/vouchers', icon: Calculator, summary: 'Cross-voucher directory that will unify all accounting entries.' },
    { name: 'Sales Invoices', route: '/invoices', icon: ReceiptText, summary: 'GST invoice review and voucher surface.' },
    { name: 'Purchases', route: '/purchases', icon: Wallet, summary: 'Supplier inward purchase entries and totals.' },
    { name: 'Receipts', route: '/receipts', icon: Wallet, summary: 'Customer receipts and collection posting.' },
    { name: 'Payments', route: '/payments', icon: Wallet, summary: 'Supplier and expense payments from cash or bank.' },
    { name: 'Journals', route: '/journals', icon: Calculator, summary: 'Manual adjustments with balanced posting lines.' },
    { name: 'Contra', route: '/contra', icon: Scale, summary: 'Cash and bank transfer entries.' },
    { name: 'GST Center', route: '/gst', icon: ShieldCheck, summary: 'Tax rates, compliance totals, and filing-readiness surface.' },
  ].map((item) => ({
    ...item,
    href: buildBillingHref(item.route),
  }))

  return (
    <div className="space-y-3">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="border-b border-border/60 px-5 py-5 md:px-6 md:py-6">
          <Badge className="w-fit">{workspace?.isReadOnly ? 'Accounts Read-Only' : 'Accounts'}</Badge>
          <CardTitle className="text-xl tracking-tight sm:text-2xl">Accounts workspace</CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6">
            Billing is now being broken into separate masters and voucher modules. The current scaffold mirrors a Tally-style flow so ledger groups, ledgers, voucher groups, and voucher types can evolve independently.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 md:p-5 xl:grid-cols-4">
          {modules.map((item) => {
            const ItemIcon = item.icon
            return (
              <Link key={item.route} to={item.href} className="rounded-[1rem] border border-border/70 bg-card/70 p-4 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                    <ItemIcon className="size-5 text-accent" />
                  </div>
                </div>
              </Link>
            )
          })}
        </CardContent>
      </Card>

      <BillingWorkspaceStatus loading={loading} error={error} />
    </div>
  )
}
