import { Calculator, ReceiptText, Scale, ShieldCheck, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@admin-web/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin-web/components/ui/card'
import { useBillingHref } from '@billing-web/features/billing/lib/billing-routing'
import { useBillingWorkspace } from '@billing-web/features/billing/lib/use-billing-workspace'
import { BillingWorkspaceStatus } from '@billing-web/features/billing/modules/shared/components/billing-workspace-status'

export function BillingGstCenterPage() {
  const { workspace, loading, error } = useBillingWorkspace()
  const ledgersHref = useBillingHref('/ledgers')
  const topLedgers = (workspace?.ledgers ?? [])
    .map((ledger) => {
      const balance = workspace?.ledgerBalances.find((item) => item.ledgerId === ledger.id) ?? { debit: 0, credit: 0 }
      return { ledger, ...balance }
    })
    .filter((entry) => entry.debit + entry.credit > 0)
    .slice(0, 6)

  if (!workspace) {
    return <BillingWorkspaceStatus loading={loading} error={error} />
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Output GST</span><ReceiptText className="size-4 text-muted-foreground" /></div><p className="mt-3 text-2xl font-semibold">{workspace.overview.outputGst.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Input GST</span><Wallet className="size-4 text-muted-foreground" /></div><p className="mt-3 text-2xl font-semibold">{workspace.overview.inputGst.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Net Liability</span><Calculator className="size-4 text-muted-foreground" /></div><p className="mt-3 text-2xl font-semibold">{workspace.overview.netGstLiability.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Active Rates</span><Scale className="size-4 text-muted-foreground" /></div><p className="mt-3 text-2xl font-semibold">{workspace.overview.activeTaxRateCount}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger Drill-down</CardTitle>
          <CardDescription>Jump from accounts reports into active ledgers carrying posting movement.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {topLedgers.map((entry) => (
            <Link key={entry.ledger.id} to={`${ledgersHref}?focus=${encodeURIComponent(entry.ledger.id)}`} className="rounded-[1rem] border border-border/70 bg-background/60 px-4 py-3 transition hover:border-accent/40 hover:bg-background">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{entry.ledger.name}</p>
                  <p className="text-sm text-muted-foreground">{entry.ledger.code}</p>
                </div>
                <Badge variant="outline">{entry.ledger.category}</Badge>
              </div>
              <div className="mt-3 grid gap-1 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Debit</span><span>{entry.debit.toFixed(2)}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Credit</span><span>{entry.credit.toFixed(2)}</span></div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Checklist</CardTitle>
          <CardDescription>Codexsun readiness points for GST-aware accounting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            'GST treatment present on every sales and purchase voucher.',
            'HSN/SAC captured in item rows.',
            'Input vs output GST visible before filing handoff.',
            'Voucher posting remains traceable from list to row level.',
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-[1rem] border border-border/70 bg-background/60 px-4 py-3">
              <ShieldCheck className="mt-0.5 size-4 text-emerald-600" />
              <span>{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
