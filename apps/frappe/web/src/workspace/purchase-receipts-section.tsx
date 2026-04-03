import { useEffect, useMemo, useState } from "react"

import type { FrappePurchaseReceipt, FrappePurchaseReceiptManager } from "@frappe/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDashboardShell } from "@/features/dashboard/dashboard-shell"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import {
  listFrappePurchaseReceipts,
  syncFrappePurchaseReceipts,
} from "../api/frappe-api"
import {
  MetricCard,
  NativeCheckbox,
  SectionShell,
  StateCard,
  formatCurrency,
  formatDateTime,
  getActiveOptions,
  toErrorMessage,
} from "./shared"

export function FrappePurchaseReceiptsSection() {
  const { user } = useDashboardShell()
  const [items, setItems] = useState<FrappePurchaseReceipt[]>([])
  const [references, setReferences] =
    useState<FrappePurchaseReceiptManager["references"] | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [previewReceiptId, setPreviewReceiptId] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const [lastSyncedAt, setLastSyncedAt] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  useGlobalLoading(isLoading)

  async function loadReceipts() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await listFrappePurchaseReceipts()
      setItems(response.manager.items)
      setReferences(response.manager.references)
      setLastSyncedAt(response.manager.syncedAt)
      setPreviewReceiptId((current) =>
        current && response.manager.items.some((item) => item.id === current)
          ? current
          : response.manager.items[0]?.id ?? null
      )
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadReceipts()
  }, [])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    if (!normalizedSearch) {
      return items
    }

    return items.filter((item) =>
      [
        item.receiptNumber,
        item.supplier,
        item.supplierName,
        item.company,
        item.warehouse,
        item.billNo,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    )
  }, [items, searchValue])

  const previewReceipt =
    items.find((item) => item.id === previewReceiptId) ?? null

  function toggleSelected(receiptId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? [...new Set([...current, receiptId])]
        : current.filter((value) => value !== receiptId)
    )
  }

  async function handleSyncSelected() {
    if (selectedIds.length === 0) {
      setError("Select one or more purchase receipts before syncing.")
      return
    }

    setIsSyncing(true)
    setError(null)

    try {
      await syncFrappePurchaseReceipts({ receiptIds: selectedIds })
      setSelectedIds([])
      await loadReceipts()
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return null
  }

  const syncedCount = items.filter((item) => item.isSyncedLocally).length
  const linkedProductCount = items.reduce(
    (sum, item) => sum + item.linkedProductCount,
    0
  )

  return (
    <SectionShell
      title="Purchase Receipts"
      description="Review ERPNext purchase receipt snapshots and sync them after the related item records are mapped into ecommerce."
      actions={(
        <>
          <Button variant="outline" onClick={() => void loadReceipts()}>
            Refresh
          </Button>
          {user.isSuperAdmin ? (
            <Button onClick={() => void handleSyncSelected()} disabled={isSyncing}>
              {isSyncing ? "Syncing..." : "Sync selected"}
            </Button>
          ) : null}
        </>
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Receipts"
          value={items.length}
          hint="Current purchase receipt snapshots stored locally."
        />
        <MetricCard
          label="Synced"
          value={syncedCount}
          hint="Receipts already projected into local sync records."
        />
        <MetricCard
          label="Linked Products"
          value={linkedProductCount}
          hint="Receipt rows already resolved to ecommerce products."
        />
        <MetricCard
          label="Last Sync"
          value={lastSyncedAt ? formatDateTime(lastSyncedAt) : "Pending"}
          hint="Latest receipt snapshot refresh time."
        />
      </div>

      {error ? <StateCard message={error} /> : null}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Receipt Snapshots</CardTitle>
            <CardDescription>
              Inspect receipts before pulling them into the local connector flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search receipt number, supplier, company, or warehouse"
              />
              <Badge variant="outline">
                Status refs {getActiveOptions(references?.statuses ?? []).length}
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {user.isSuperAdmin ? <TableHead>Select</TableHead> : null}
                  <TableHead>Receipt</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Totals</TableHead>
                  <TableHead>Sync</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    {user.isSuperAdmin ? (
                      <TableCell>
                        <NativeCheckbox
                          checked={selectedIds.includes(item.id)}
                          onChange={(checked) => toggleSelected(item.id, checked)}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{item.receiptNumber}</p>
                        <p className="text-xs text-muted-foreground">{item.billNo || "No bill number"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <p>{item.supplierName || item.supplier || "Not set"}</p>
                      <p>{item.company || "No company"}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <p>{formatCurrency(item.grandTotal, item.currency)}</p>
                      <p>{item.itemCount} items</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.isSyncedLocally
                        ? formatDateTime(item.syncedAt)
                        : "Not synced"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={item.isSyncedLocally ? "default" : "outline"}>
                          {item.isSyncedLocally ? "Synced" : "Pending"}
                        </Badge>
                        {item.isReturn ? <Badge variant="outline">Return</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewReceiptId(item.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receipt Preview</CardTitle>
            <CardDescription>
              Review the selected receipt rows and resolved product links.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewReceipt ? (
              <>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                    <p className="font-medium text-foreground">{previewReceipt.receiptNumber}</p>
                    <p>{previewReceipt.supplierName || previewReceipt.supplier || "No supplier"}</p>
                    <p>{previewReceipt.company || "No company"} | {previewReceipt.warehouse || "No warehouse"}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                    <p>Posting: {previewReceipt.postingDate} {previewReceipt.postingTime}</p>
                    <p>Rounded total: {formatCurrency(previewReceipt.roundedTotal, previewReceipt.currency)}</p>
                    <p>Linked products: {previewReceipt.linkedProductCount}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {previewReceipt.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border/70 bg-card/70 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{item.itemName}</p>
                          <p className="text-sm text-muted-foreground">{item.itemCode}</p>
                        </div>
                        <Badge variant={item.isSyncedToProduct ? "default" : "outline"}>
                          {item.isSyncedToProduct ? "Linked" : "Unlinked"}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        <p>Warehouse: {item.warehouse || "Not set"}</p>
                        <p>Quantity: {item.receivedQuantity}/{item.quantity} {item.uom || item.stockUom}</p>
                        <p>Amount: {formatCurrency(item.amount, previewReceipt.currency)}</p>
                        <p>Product: {item.productName || "Not linked"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a purchase receipt to inspect its line items.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}
