import { useMemo, useState } from 'react'
import { CommonList, type CommonListColumn } from '@admin-web/components/forms/CommonList'
import { Badge } from '@admin-web/components/ui/badge'
import { Button } from '@admin-web/components/ui/button'
import { billingVoucherModules } from '@billing-web/features/billing/lib/billing-config'
import { useBillingWorkspace } from '@billing-web/features/billing/lib/use-billing-workspace'
import type { BillingVoucher, BillingVoucherType } from '@billing-web/features/billing/lib/billing-types'
import { resolveLedgerName } from '@billing-core/index'
import { BillingWorkspaceStatus } from './billing-workspace-status'
import { VoucherDetailDialog } from './voucher-detail-dialog'

export function BillingVoucherListPage({ type }: { type: BillingVoucherType }) {
  const module = billingVoucherModules[type]
  const { workspace, loading, error } = useBillingWorkspace()
  const [searchValue, setSearchValue] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const ledgers = workspace?.ledgers ?? []
  const vouchers = workspace?.vouchers ?? []

  const items = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase()
    return vouchers
      .filter((voucher) => voucher.type === type)
      .filter((voucher) =>
        normalized.length === 0
          || [voucher.voucherNumber, voucher.referenceNumber, voucher.narration, resolveLedgerName(ledgers, voucher.counterpartyLedgerId)]
            .join(' ')
            .toLowerCase()
            .includes(normalized),
      )
  }, [ledgers, searchValue, type, vouchers])

  const detailVoucher = detailId ? vouchers.find((item) => item.id === detailId) ?? null : null

  const columns: CommonListColumn<BillingVoucher>[] = [
    {
      id: 'voucher',
      header: module.documentLabel,
      accessor: (item) => item.voucherNumber,
      sortable: true,
      cell: (item) => (
        <div>
          <p className="font-medium text-foreground">{item.voucherNumber}</p>
          <p className="text-sm text-muted-foreground">{item.referenceNumber || 'No reference'}</p>
        </div>
      ),
    },
    {
      id: 'party',
      header: 'Party / Ledger',
      accessor: (item) => resolveLedgerName(ledgers, item.counterpartyLedgerId),
      cell: (item) => (
        <div>
          <p className="font-medium text-foreground">{resolveLedgerName(ledgers, item.counterpartyLedgerId)}</p>
          <p className="text-sm text-muted-foreground">{item.placeOfSupply}</p>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      accessor: (item) => item.postingDate,
      sortable: true,
      cell: (item) => item.postingDate,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (item) => item.status,
      cell: (item) => (
        <Badge variant={item.status === 'posted' ? 'default' : item.status === 'cancelled' ? 'secondary' : 'outline'}>
          {item.status}
        </Badge>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      cell: (item) => (
        <Button type="button" variant="outline" size="sm" onClick={() => setDetailId(item.id)}>
          View
        </Button>
      ),
      className: 'w-24 text-right',
      headerClassName: 'w-24 text-right',
    },
  ]

  return (
    <div className="space-y-4">
      <CommonList
        header={{
          pageTitle: module.title,
          pageDescription: `${module.documentLabel} list from the Codexsun accounts workspace. Billing writes are temporarily disabled while the API foundation is being bound in.`,
        }}
        search={{
          value: searchValue,
          onChange: setSearchValue,
          placeholder: `Search ${module.title.toLowerCase()}`,
        }}
        table={{
          columns,
          data: items,
          loading,
          emptyMessage: `No ${module.title.toLowerCase()} found.`,
          rowKey: (item) => item.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Total vouchers: <span className="font-medium text-foreground">{items.length}</span>
              </span>
            </div>
          ),
        }}
      />

      <BillingWorkspaceStatus loading={loading} error={error} />

      {workspace ? (
        <VoucherDetailDialog
          open={detailId !== null}
          voucher={detailVoucher}
          workspace={workspace}
          module={module}
          onOpenChange={(open) => {
            if (!open) {
              setDetailId(null)
            }
          }}
        />
      ) : null}
    </div>
  )
}
