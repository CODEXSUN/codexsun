import { Badge } from '@admin-web/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin-web/components/ui/card'
import { useBillingWorkspace } from '@billing-web/features/billing/lib/use-billing-workspace'
import { BillingWorkspaceStatus } from '@billing-web/features/billing/modules/shared/components/billing-workspace-status'

export function BillingLedgerGroupPage() {
  const { workspace, loading, error } = useBillingWorkspace()
  const ledgerGroups = workspace?.ledgerGroups ?? []
  const topLevelGroups = ledgerGroups.filter((group) => group.parentGroupId === null)
  const childGroupCount = ledgerGroups.filter((group) => group.parentGroupId !== null).length

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Ledger groups</p><p className="mt-3 text-2xl font-semibold">{ledgerGroups.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Root groups</p><p className="mt-3 text-2xl font-semibold">{topLevelGroups.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Child groups</p><p className="mt-3 text-2xl font-semibold">{childGroupCount}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">System groups</p><p className="mt-3 text-2xl font-semibold">{ledgerGroups.filter((group) => group.isSystem).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger groups</CardTitle>
          <CardDescription>This is the Tally-style master layer above ledgers. Root groups and child groups are now scaffolded as their own module.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {topLevelGroups.map((group) => {
            const children = ledgerGroups.filter((item) => item.parentGroupId === group.id)
            return (
              <div key={group.id} className="rounded-[1rem] border border-border/70 bg-background/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{group.name}</p>
                    <p className="text-sm text-muted-foreground">{group.code}</p>
                  </div>
                  <Badge variant="outline">{group.primaryBucket}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{group.description || 'No description.'}</p>
                <div className="mt-3 space-y-2 text-sm">
                  {children.length > 0 ? children.map((child) => (
                    <div key={child.id} className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
                      <div className="font-medium text-foreground">{child.name}</div>
                      <div className="text-muted-foreground">{child.code}</div>
                    </div>
                  )) : (
                    <div className="text-muted-foreground">No child groups.</div>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <BillingWorkspaceStatus loading={loading} error={error} />
    </div>
  )
}
