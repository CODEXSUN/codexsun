import type {
  FrappePurchaseReceipt,
  FrappePurchaseReceiptManager,
} from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckIcon, EyeIcon, MoreHorizontalIcon, RefreshCcw } from 'lucide-react'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { CommonList } from '@/components/forms/CommonList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ActiveStatusBadge, StatusBadge } from '@/components/ui/status-badge'
import { warningCardClassName } from '@/shared/forms/validation'
import {
  HttpError,
  listFrappePurchaseReceipts,
  syncFrappePurchaseReceipts,
} from '@/shared/api/client'
import { showErrorToast, showSuccessToast } from '@/shared/notifications/toast'

const AUTO_REFRESH_MS = 60_000

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to load Frappe Purchase Receipts.'
}

function formatDateTime(value: string) {
  if (!value) {
    return 'Not updated'
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

export function FrappePurchaseReceiptPage() {
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? null
  const isSuperAdmin = Boolean(session?.user.isSuperAdmin)
  const [items, setItems] = useState<FrappePurchaseReceipt[]>([])
  const [references, setReferences] = useState<FrappePurchaseReceiptManager['references'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [returnOnly, setReturnOnly] = useState(false)
  const [syncedOnly, setSyncedOnly] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [lastSyncedAt, setLastSyncedAt] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewReceipt, setPreviewReceipt] = useState<FrappePurchaseReceipt | null>(null)

  async function loadReceiptsWithToken(token: string, options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoading(true)
    }

    try {
      const response = await listFrappePurchaseReceipts(token)
      setItems(response.items)
      setReferences(response.references)
      setLastSyncedAt(response.syncedAt)
      setErrorMessage(null)
      return true
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
      return false
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (typeof accessToken !== 'string') {
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadInitial() {
      const token = accessToken
      if (!token || cancelled) {
        return
      }

      await loadReceiptsWithToken(token)
    }

    void loadInitial()

    const intervalId = isSuperAdmin
      ? window.setInterval(() => {
          const token = accessToken
          if (!token || cancelled) {
            return
          }

          void loadReceiptsWithToken(token, { silent: true })
        }, AUTO_REFRESH_MS)
      : null

    return () => {
      cancelled = true
      if (intervalId != null) {
        window.clearInterval(intervalId)
      }
    }
  }, [accessToken, isSuperAdmin])

  useEffect(() => {
    const nextIds = new Set(items.map((item) => item.id))
    setSelectedIds((current) => current.filter((id) => nextIds.has(id)))
  }, [items])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return items.filter((item) => {
      const matchesSearch = normalizedSearch.length === 0 || [
        item.receiptNumber,
        item.supplier,
        item.supplierName,
        item.company,
        item.warehouse,
        item.billNo,
        ...item.items.map((entry) => entry.itemCode),
        ...item.items.map((entry) => entry.itemName),
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch))

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesReturn = !returnOnly || item.isReturn
      const matchesSynced = !syncedOnly || item.isSyncedLocally

      return matchesSearch && matchesStatus && matchesReturn && matchesSynced
    })
  }, [items, returnOnly, searchValue, statusFilter, syncedOnly])

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  const currentPageIds = paginatedItems.map((item) => item.id)
  const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id))

  function toggleSelected(receiptId: string, checked: boolean) {
    setSelectedIds((current) => (
      checked
        ? [...new Set([...current, receiptId])]
        : current.filter((id) => id !== receiptId)
    ))
  }

  function toggleCurrentPageSelection(checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return [...new Set([...current, ...currentPageIds])]
      }

      return current.filter((id) => !currentPageIds.includes(id))
    })
  }

  async function handleManualSync() {
    if (!accessToken) {
      return
    }

    setErrorMessage(null)
    await loadReceiptsWithToken(accessToken)
  }

  async function handleSyncReceipts(targetIds?: string[]) {
    if (!accessToken) {
      return
    }

    const receiptIds = targetIds && targetIds.length > 0 ? targetIds : selectedIds
    if (receiptIds.length === 0) {
      return
    }

    setSyncing(true)
    setErrorMessage(null)

    try {
      const sync = await syncFrappePurchaseReceipts(accessToken, { receiptIds })
      const syncedCount = sync.items.length
      const linkedProductCount = sync.items.reduce((sum, item) => sum + item.linkedProductCount, 0)

      showSuccessToast({
        title: 'Purchase Receipts synced',
        description: `${syncedCount} receipt${syncedCount === 1 ? '' : 's'} synced locally with ${linkedProductCount} linked product item${linkedProductCount === 1 ? '' : 's'}.`,
      })

      await loadReceiptsWithToken(accessToken, { silent: true })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to sync Purchase Receipts',
        description: message,
      })
    } finally {
      setSyncing(false)
    }
  }

  const statusOptions = references?.statuses ?? []

  return (
    <div className="space-y-4">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="border-b border-border/60 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge>Frappe</Badge>
              <div>
                <CardTitle className="text-3xl">ERPNext Purchase Receipt manager</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
                  Review inbound purchase receipts from ERPNext, inspect receipt items and dependencies, and sync selected receipts into local purchase snapshots linked to ecommerce products.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{isSuperAdmin ? 'Auto refresh 60s' : 'Read only'}</Badge>
              <Badge variant="outline">{lastSyncedAt ? `Last sync ${formatDateTime(lastSyncedAt)}` : 'Waiting for first sync'}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-md">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>Total: <span className="font-medium text-foreground">{items.length}</span></span>
            <span>Returns: <span className="font-medium text-foreground">{items.filter((item) => item.isReturn).length}</span></span>
            <span>Synced: <span className="font-medium text-foreground">{items.filter((item) => item.isSyncedLocally).length}</span></span>
            <span>Linked products: <span className="font-medium text-foreground">{items.reduce((sum, item) => sum + item.linkedProductCount, 0)}</span></span>
            {isSuperAdmin ? (
              <span>Selected: <span className="font-medium text-foreground">{selectedIds.length}</span></span>
            ) : null}
          </div>
          {isSuperAdmin ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSyncReceipts()}
                disabled={syncing || selectedIds.length === 0}
              >
                <CheckIcon className="size-4" />
                {syncing ? 'Syncing...' : 'Sync selected receipts'}
              </Button>
              <Button type="button" variant="outline" onClick={() => void handleManualSync()} disabled={syncing || loading}>
                <RefreshCcw className="size-4" />
                Refresh frappe list
              </Button>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Receipt sync is available only to super-admin users.</span>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">References and dependencies</CardTitle>
          <CardDescription>
            The manager loads ERPNext Suppliers, Companies, Warehouses, and receipt statuses. Sync links receipt items to ecommerce products by Frappe item code and stores a local receipt snapshot for verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>Suppliers: <span className="font-medium text-foreground">{references?.suppliers.length ?? 0}</span></span>
          <span>Companies: <span className="font-medium text-foreground">{references?.companies.length ?? 0}</span></span>
          <span>Warehouses: <span className="font-medium text-foreground">{references?.warehouses.length ?? 0}</span></span>
          <span>Statuses: <span className="font-medium text-foreground">{references?.statuses.length ?? 0}</span></span>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Card className={`${warningCardClassName} rounded-md`}>
          <CardContent className="rounded-md p-4 text-sm">
            <p className="font-medium">{errorMessage}</p>
            <p className="mt-3 text-muted-foreground">
              Check the ERPNext connection in <Link to="/admin/dashboard/frappe/connection" className="font-medium text-foreground underline underline-offset-4">Frappe Connection</Link> if this looks like a configuration problem.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <CommonList
        header={{
          pageTitle: 'Frappe Purchase Receipts',
          pageDescription: 'List, filter, inspect, and sync ERPNext Purchase Receipts and their item rows into local purchase snapshots.',
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: 'Search Purchase Receipts',
        }}
        filters={{
          buttonLabel: 'Receipt filters',
          options: [
            {
              key: 'all-status',
              label: 'All statuses',
              isActive: statusFilter === 'all',
              onSelect: () => {
                setStatusFilter('all')
                setCurrentPage(1)
              },
            },
            ...statusOptions.map((status) => ({
              key: `status:${status.id}`,
              label: status.label,
              isActive: statusFilter === status.id,
              onSelect: () => {
                setStatusFilter((current) => current === status.id ? 'all' : status.id)
                setCurrentPage(1)
              },
            })),
            {
              key: 'returns',
              label: 'Returns only',
              isActive: returnOnly,
              onSelect: () => {
                setReturnOnly((current) => !current)
                setCurrentPage(1)
              },
            },
            {
              key: 'synced',
              label: 'Synced only',
              isActive: syncedOnly,
              onSelect: () => {
                setSyncedOnly((current) => !current)
                setCurrentPage(1)
              },
            },
          ],
          activeFilters: [
            ...(statusFilter === 'all' ? [] : [{ key: 'status', label: 'Status', value: statusFilter }]),
            ...(returnOnly ? [{ key: 'returns', label: 'Type', value: 'Return' }] : []),
            ...(syncedOnly ? [{ key: 'synced', label: 'Sync', value: 'Synced locally' }] : []),
          ],
          onRemoveFilter: (key) => {
            if (key === 'status') {
              setStatusFilter('all')
            }
            if (key === 'returns') {
              setReturnOnly(false)
            }
            if (key === 'synced') {
              setSyncedOnly(false)
            }
          },
          onClearAllFilters: () => {
            setStatusFilter('all')
            setReturnOnly(false)
            setSyncedOnly(false)
            setCurrentPage(1)
          },
        }}
        table={{
          columns: [
            ...(isSuperAdmin ? [{
              id: 'select',
              header: 'Select',
              className: 'w-14 min-w-14 px-2 text-center',
              headerClassName: 'w-14 min-w-14 px-2 text-center',
              sticky: 'left' as const,
              cell: (item: FrappePurchaseReceipt) => (
                <div className="flex justify-center">
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={(checked) => toggleSelected(item.id, Boolean(checked))}
                    aria-label={`Select ${item.receiptNumber}`}
                  />
                </div>
              ),
            }] : []),
            {
              id: 'serial',
              header: 'Sl.No',
              cell: (item) => ((safeCurrentPage - 1) * pageSize) + paginatedItems.findIndex((entry) => entry.id === item.id) + 1,
              className: 'w-12 min-w-12 px-2 text-center',
              headerClassName: 'w-12 min-w-12 px-2 text-center',
              sticky: isSuperAdmin ? undefined : 'left',
            },
            {
              id: 'receipt',
              header: 'Receipt',
              sortable: true,
              accessor: (item) => item.receiptNumber,
              className: 'min-w-0 max-w-[16rem]',
              cell: (item) => (
                <div className="min-w-0 max-w-[16rem]">
                  <Link to={`/admin/dashboard/frappe/purchase-receipts/${item.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                    {item.receiptNumber}
                  </Link>
                  <p className="text-sm text-muted-foreground">{item.billNo || 'No supplier bill number'}</p>
                  <p className="text-sm text-muted-foreground">{item.postingDate || 'No posting date'} {item.postingTime || ''}</p>
                </div>
              ),
            },
            {
              id: 'supplier',
              header: 'Supplier',
              sortable: true,
              accessor: (item) => item.supplierName || item.supplier,
              cell: (item) => (
                <div>
                  <p>{item.supplierName || item.supplier || 'Not set'}</p>
                  <p className="text-sm text-muted-foreground">{item.supplier || 'No supplier code'}</p>
                </div>
              ),
            },
            {
              id: 'references',
              header: 'References',
              cell: (item) => (
                <div>
                  <p>{item.company || 'No company'}</p>
                  <p className="text-sm text-muted-foreground">{item.warehouse || 'No warehouse'}</p>
                </div>
              ),
            },
            {
              id: 'items',
              header: 'Receipt Items',
              accessor: (item) => item.itemCount,
              cell: (item) => (
                <div>
                  <p>{item.itemCount} item{item.itemCount === 1 ? '' : 's'}</p>
                  <p className="text-sm text-muted-foreground">{item.linkedProductCount} linked to products</p>
                </div>
              ),
            },
            {
              id: 'totals',
              header: 'Totals',
              sortable: true,
              accessor: (item) => item.grandTotal,
              cell: (item) => (
                <div>
                  <p>{formatCurrency(item.grandTotal, item.currency)}</p>
                  <p className="text-sm text-muted-foreground">Rounded {formatCurrency(item.roundedTotal, item.currency)}</p>
                </div>
              ),
            },
            {
              id: 'sync',
              header: 'Local Sync',
              accessor: (item) => item.syncedAt,
              cell: (item) => item.isSyncedLocally ? (
                <div>
                  <p className="font-medium text-foreground">Synced</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(item.syncedAt)}</p>
                </div>
              ) : (
                <StatusBadge tone="manual">Not synced</StatusBadge>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              accessor: (item) => item.status,
              cell: (item) => (
                <div className="flex flex-wrap items-center gap-2">
                  <ActiveStatusBadge isActive={item.status !== 'Cancelled'} activeLabel={item.status} inactiveLabel={item.status} />
                  {item.isReturn ? <StatusBadge tone="manual">Return</StatusBadge> : <StatusBadge tone="publishing">Receipt</StatusBadge>}
                </div>
              ),
            },
            {
              id: 'modifiedAt',
              header: 'Modified',
              sortable: true,
              accessor: (item) => item.modifiedAt,
              cell: (item) => <span>{formatDateTime(item.modifiedAt)}</span>,
            },
            {
              id: 'actions',
              header: 'Actions',
              className: 'w-12 min-w-12 px-2 text-center',
              headerClassName: 'w-12 min-w-12 px-2 text-center',
              sticky: 'right' as const,
              cell: (item: FrappePurchaseReceipt) => (
                <div className="flex justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" size="icon-sm" variant="ghost">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => {
                        setPreviewReceipt(item)
                        setPreviewOpen(true)
                      }}>
                        <EyeIcon className="size-4" />
                        <span>View receipt items</span>
                      </DropdownMenuItem>
                      {isSuperAdmin ? (
                        <DropdownMenuItem className="gap-2" onClick={() => void handleSyncReceipts([item.id])}>
                          <CheckIcon className="size-4" />
                          <span>Sync receipt</span>
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ),
            },
          ],
          data: paginatedItems,
          loading,
          loadingMessage: 'Loading Frappe Purchase Receipts...',
          emptyMessage: errorMessage ?? 'No Frappe Purchase Receipts found.',
          rowKey: (item) => item.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>Total records: <span className="font-medium text-foreground">{totalRecords}</span></span>
              <span>Return records: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.isReturn).length}</span></span>
              <span>Synced records: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.isSyncedLocally).length}</span></span>
              <span>Receipt items: <span className="font-medium text-foreground">{filteredItems.reduce((sum, item) => sum + item.itemCount, 0)}</span></span>
              {isSuperAdmin ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={() => toggleCurrentPageSelection(!allCurrentPageSelected)}
                >
                  {allCurrentPageSelected ? 'Clear page selection' : 'Select page'}
                </Button>
              ) : null}
            </div>
          ),
        }}
        pagination={{
          currentPage: safeCurrentPage,
          pageSize,
          totalRecords,
          pageSizeOptions: [10, 25, 50, 100],
          onPageChange: setCurrentPage,
          onPageSizeChange: (value) => {
            setPageSize(value)
            setCurrentPage(1)
          },
        }}
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{previewReceipt?.receiptNumber ?? 'Purchase Receipt'}</DialogTitle>
            <DialogDescription>
              Review the ERPNext item rows, warehouses, quantities, and linked products before syncing.
            </DialogDescription>
          </DialogHeader>

          {previewReceipt ? (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-4">
                <span>Supplier: <span className="font-medium text-foreground">{previewReceipt.supplierName || previewReceipt.supplier || 'Not set'}</span></span>
                <span>Company: <span className="font-medium text-foreground">{previewReceipt.company || 'Not set'}</span></span>
                <span>Warehouse: <span className="font-medium text-foreground">{previewReceipt.warehouse || 'Not set'}</span></span>
                <span>Total: <span className="font-medium text-foreground">{formatCurrency(previewReceipt.grandTotal, previewReceipt.currency)}</span></span>
              </div>

              <div className="max-h-[28rem] overflow-auto rounded-md border border-border/60">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/60 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Item</th>
                      <th className="px-3 py-2 font-medium">Warehouse</th>
                      <th className="px-3 py-2 font-medium">Qty</th>
                      <th className="px-3 py-2 font-medium">Rate</th>
                      <th className="px-3 py-2 font-medium">Amount</th>
                      <th className="px-3 py-2 font-medium">Product</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewReceipt.items.map((item) => (
                      <tr key={item.id} className="border-t border-border/60">
                        <td className="px-3 py-2 align-top">
                          <p className="font-medium text-foreground">{item.itemName}</p>
                          <p className="text-muted-foreground">{item.itemCode}</p>
                          <p className="line-clamp-2 text-muted-foreground">{item.description || 'No description'}</p>
                        </td>
                        <td className="px-3 py-2 align-top">{item.warehouse || 'Not set'}</td>
                        <td className="px-3 py-2 align-top">
                          <p>{item.quantity} {item.uom || item.stockUom}</p>
                          <p className="text-muted-foreground">Received {item.receivedQuantity}</p>
                        </td>
                        <td className="px-3 py-2 align-top">{formatCurrency(item.rate, previewReceipt.currency)}</td>
                        <td className="px-3 py-2 align-top">{formatCurrency(item.amount, previewReceipt.currency)}</td>
                        <td className="px-3 py-2 align-top">
                          {item.isSyncedToProduct ? (
                            <Link
                              to={`/admin/dashboard/products/${item.productId}`}
                              className="font-medium text-foreground underline-offset-4 hover:underline"
                            >
                              {item.productName}
                            </Link>
                          ) : (
                            <StatusBadge tone="manual">Not linked</StatusBadge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FrappePurchaseReceiptPage
