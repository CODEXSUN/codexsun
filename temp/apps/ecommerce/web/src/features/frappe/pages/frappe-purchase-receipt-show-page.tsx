import type { FrappePurchaseReceipt } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DetailGrid,
  DetailItem,
  DetailList,
  DetailSection,
  EntityDetailHeader,
  formatDetailValue,
} from '@/components/entity/entity-detail'
import { HttpError, getFrappePurchaseReceipt } from '@/shared/api/client'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Unable to load Frappe Purchase Receipt.'
}

function formatDateTime(value: string) {
  if (!value) {
    return '-'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency || 'INR'} ${value.toFixed(2)}`
  }
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border/60 last:border-b-0">
      <th className="w-[168px] border-r border-border/70 px-3 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:w-[188px]">
        {label}
      </th>
      <td className="px-4 py-3 text-sm text-foreground">{value}</td>
    </tr>
  )
}

export function FrappePurchaseReceiptShowPage() {
  const { session } = useAuth()
  const { receiptId } = useParams()
  const [item, setItem] = useState<FrappePurchaseReceipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadReceipt() {
      if (!receiptId || !session?.accessToken) {
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const response = await getFrappePurchaseReceipt(session.accessToken, receiptId)
        if (!cancelled) {
          setItem(response)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadReceipt()
    return () => {
      cancelled = true
    }
  }, [receiptId, session?.accessToken])

  const itemRows = useMemo(() => item?.items ?? [], [item])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Loading purchase receipt...</CardContent>
      </Card>
    )
  }

  if (!item) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-destructive">{errorMessage ?? 'Purchase receipt not found.'}</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <EntityDetailHeader
        backHref="/admin/dashboard/frappe/purchase-receipts"
        backLabel="Back to purchase receipts"
        title={item.receiptNumber}
        description="Review the ERPNext purchase receipt, linked products, and local sync snapshot."
        isActive={item.status !== 'Cancelled'}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{item.status}</Badge>
            {item.isReturn ? <Badge variant="outline">Return</Badge> : <Badge variant="outline">Receipt</Badge>}
            {item.isSyncedLocally ? <Badge variant="outline">Synced</Badge> : <Badge variant="outline">Not synced</Badge>}
          </div>
        )}
      />

      <DetailSection title="Overview" description="Document identity and posting details.">
        <table className="w-full overflow-hidden rounded-[1.25rem] border border-border/70">
          <tbody>
            <OverviewRow label="Receipt Number" value={item.receiptNumber} />
            <OverviewRow label="Supplier" value={item.supplierName || item.supplier || '-'} />
            <OverviewRow label="Company" value={item.company || '-'} />
            <OverviewRow label="Warehouse" value={item.warehouse || '-'} />
            <OverviewRow label="Bill No" value={item.billNo || '-'} />
            <OverviewRow label="Posting Date" value={formatDateTime(item.postingDate)} />
            <OverviewRow label="Posting Time" value={item.postingTime || '-'} />
            <OverviewRow label="Currency" value={item.currency || 'INR'} />
            <OverviewRow label="Modified" value={formatDateTime(item.modifiedAt)} />
          </tbody>
        </table>
      </DetailSection>

      <DetailSection title="Totals and sync" description="Financial totals and local sync metadata.">
        <DetailGrid>
          <DetailItem label="Grand Total" value={formatCurrency(item.grandTotal, item.currency)} />
          <DetailItem label="Rounded Total" value={formatCurrency(item.roundedTotal, item.currency)} />
          <DetailItem label="Item Count" value={formatDetailValue(item.itemCount)} />
          <DetailItem label="Linked Product Count" value={formatDetailValue(item.linkedProductCount)} />
          <DetailItem label="Local Sync" value={item.isSyncedLocally ? `Synced at ${formatDateTime(item.syncedAt)}` : 'Not synced locally'} />
          <DetailItem label="Sync Record" value={item.syncedRecordId || '-'} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Items" description="Each ERPNext purchase receipt row and the product it maps to.">
        <DetailList
          items={itemRows}
          emptyMessage="No receipt rows found."
          renderItem={(row) => (
            <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{row.itemName}</p>
                  <p className="text-sm text-muted-foreground">{row.itemCode}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.isSyncedToProduct ? <Badge variant="outline">Synced</Badge> : <Badge variant="outline">Unlinked</Badge>}
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                <p><span className="font-medium text-foreground">Qty:</span> {row.quantity}</p>
                <p><span className="font-medium text-foreground">Received:</span> {row.receivedQuantity}</p>
                <p><span className="font-medium text-foreground">Rejected:</span> {row.rejectedQuantity}</p>
                <p><span className="font-medium text-foreground">Rate:</span> {formatCurrency(row.rate, item.currency)}</p>
                <p><span className="font-medium text-foreground">Amount:</span> {formatCurrency(row.amount, item.currency)}</p>
                <p><span className="font-medium text-foreground">Warehouse:</span> {row.warehouse || '-'}</p>
                <p><span className="font-medium text-foreground">UOM:</span> {row.uom || '-'}</p>
                <p><span className="font-medium text-foreground">Stock UOM:</span> {row.stockUom || '-'}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Linked product:</span>
                {row.productId ? (
                  <Link to={`/admin/dashboard/products/${row.productId}`} className="font-medium text-foreground underline underline-offset-4">
                    {row.productName || row.productSlug || row.productId}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Not linked</span>
                )}
              </div>
              {row.description ? (
                <p className="mt-3 text-sm text-muted-foreground">{row.description}</p>
              ) : null}
            </div>
          )}
        />
      </DetailSection>
    </div>
  )
}

export default FrappePurchaseReceiptShowPage
