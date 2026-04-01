import { CommonList } from '@admin-web/components/forms/CommonList'
import { Badge } from '@admin-web/components/ui/badge'
import { useBillingWorkspace } from '@billing-web/features/billing/lib/use-billing-workspace'
import { BillingWorkspaceStatus } from '@billing-web/features/billing/modules/shared/components/billing-workspace-status'

export function BillingLedgerListPage() {
  const { workspace, loading, error } = useBillingWorkspace()
  const ledgers = workspace?.ledgers ?? []

  return (
    <div className="space-y-4">
      <CommonList
        header={{
          pageTitle: 'Ledgers',
          pageDescription: 'Ledger masters across the Codexsun accounts workspace, loaded from the persistent billing accounting foundation.',
        }}
        table={{
          columns: [
            {
              id: 'ledger',
              header: 'Ledger',
              accessor: (item) => item.name,
              sortable: true,
              cell: (item) => (
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.code}</p>
                </div>
              ),
            },
            {
              id: 'category',
              header: 'Category',
              accessor: (item) => item.category,
              sortable: true,
              cell: (item) => <Badge variant="outline">{item.category}</Badge>,
            },
            {
              id: 'group',
              header: 'Parent Group',
              accessor: (item) => item.parentGroup,
              sortable: true,
              cell: (item) => item.parentGroup,
            },
            {
              id: 'opening',
              header: 'Opening',
              accessor: (item) => item.openingBalance,
              sortable: true,
              cell: (item) => `${item.balanceSide.toUpperCase()} ${item.openingBalance.toFixed(2)}`,
            },
            {
              id: 'gstin',
              header: 'GSTIN',
              accessor: (item) => item.gstin,
              cell: (item) => item.gstin || '-',
            },
          ],
          data: ledgers,
          loading,
          rowKey: (item) => item.id,
        }}
      />

      <BillingWorkspaceStatus loading={loading} error={error} />
    </div>
  )
}
