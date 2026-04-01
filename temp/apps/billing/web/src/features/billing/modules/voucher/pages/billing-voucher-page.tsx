import { Badge } from '@admin-web/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin-web/components/ui/card'
import { useBillingWorkspace } from '@billing-web/features/billing/lib/use-billing-workspace'
import { BillingWorkspaceStatus } from '@billing-web/features/billing/modules/shared/components/billing-workspace-status'

export function BillingVoucherPage() {
  const { workspace, loading, error } = useBillingWorkspace()
  const vouchers = workspace?.vouchers ?? []

  const counts = vouchers.reduce<Record<string, number>>((summary, voucher) => {
    summary[voucher.type] = (summary[voucher.type] ?? 0) + 1
    return summary
  }, {})

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Vouchers</CardTitle>
          <CardDescription>This module is the future cross-voucher desk. It will eventually own unified search, numbering, status filters, and audit review across all voucher types.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(counts).map(([type, count]) => (
            <div key={type} className="rounded-[1rem] border border-border/70 bg-background/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold capitalize text-foreground">{type}</p>
                <Badge variant="outline">{count}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Scaffolded voucher directory entry for {type} vouchers.</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <BillingWorkspaceStatus loading={loading} error={error} />
    </div>
  )
}
