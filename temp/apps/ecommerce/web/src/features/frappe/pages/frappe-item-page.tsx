import type {
  FrappeItem,
  FrappeItemManager,
  FrappeItemProductSyncLog,
  FrappeItemUpsertPayload,
  FrappeReferenceOption,
} from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckIcon, EditIcon, MoreHorizontalIcon, PowerIcon, RefreshCcw } from 'lucide-react'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ActiveStatusBadge, StatusBadge } from '@/components/ui/status-badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  createFieldErrors,
  inputErrorClassName,
  isBlank,
  setFieldError,
  summarizeFieldErrors,
  type FieldErrors,
  warningCardClassName,
} from '@/shared/forms/validation'
import {
  createFrappeItem,
  getFrappeItem,
  HttpError,
  listFrappeItems,
  listFrappeItemProductSyncLogs,
  syncFrappeItemsToProducts,
  updateFrappeItem,
} from '@/shared/api/client'
import {
  showErrorToast,
  showSavedToast,
  showStatusChangeToast,
  showSuccessToast,
  showValidationToast,
} from '@/shared/notifications/toast'

const AUTO_REFRESH_MS = 30_000

function stripHtml(value: string) {
  const trimmedValue = value.trim()
  if (!trimmedValue.includes('<')) {
    return trimmedValue
  }

  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    const parser = new window.DOMParser()
    const document = parser.parseFromString(trimmedValue, 'text/html')
    return document.body.textContent?.replace(/\s+/g, ' ').trim() ?? trimmedValue
  }

  return trimmedValue
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeItem(item: FrappeItem): FrappeItem {
  return {
    ...item,
    description: stripHtml(item.description),
  }
}

function createDefaultValues(references: FrappeItemManager['references'] | null): FrappeItemUpsertPayload {
  return {
    itemCode: '',
    itemName: '',
    description: '',
    itemGroup: references?.defaults.itemGroup || '',
    stockUom: 'Nos',
    brand: '',
    gstHsnCode: '',
    defaultWarehouse: references?.defaults.warehouse || '',
    disabled: false,
    isStockItem: true,
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to load Frappe Items.'
}

function validateItem(values: FrappeItemUpsertPayload) {
  const errors = createFieldErrors()

  if (isBlank(values.itemCode)) {
    setFieldError(errors, 'itemCode', 'Item code is required.')
  }

  if (isBlank(values.itemName)) {
    setFieldError(errors, 'itemName', 'Item name is required.')
  }

  if (isBlank(values.itemGroup)) {
    setFieldError(errors, 'itemGroup', 'Item group is required.')
  }

  if (isBlank(values.stockUom)) {
    setFieldError(errors, 'stockUom', 'Stock UOM is required.')
  }

  if (isBlank(values.brand)) {
    setFieldError(errors, 'brand', 'Brand is required for this ERPNext site.')
  }

  if (isBlank(values.gstHsnCode)) {
    setFieldError(errors, 'gstHsnCode', 'GST HSN code is required for this ERPNext site.')
  }

  return errors
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

function getLeafOptions(options: FrappeReferenceOption[]) {
  return options.filter((option) => !option.isGroup && !option.disabled)
}

function getActiveOptions(options: FrappeReferenceOption[]) {
  return options.filter((option) => !option.disabled)
}

type SyncDuplicateMode = 'overwrite' | 'skip'

export function FrappeItemPage() {
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? null
  const isSuperAdmin = Boolean(session?.user.isSuperAdmin)
  const [items, setItems] = useState<FrappeItem[]>([])
  const [references, setReferences] = useState<FrappeItemManager['references'] | null>(null)
  const [syncLogs, setSyncLogs] = useState<FrappeItemProductSyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncingProducts, setSyncingProducts] = useState(false)
  const [editing, setEditing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(createFieldErrors())
  const [values, setValues] = useState<FrappeItemUpsertPayload>(createDefaultValues(null))
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'stock' | 'service'>('all')
  const [syncFilter, setSyncFilter] = useState<'all' | 'synced' | 'notSynced'>('all')
  const [variantsOnly, setVariantsOnly] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)
  const [syncDuplicateMode, setSyncDuplicateMode] = useState<SyncDuplicateMode>('overwrite')
  const [syncTargetIds, setSyncTargetIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [lastSyncedAt, setLastSyncedAt] = useState('')
  const [activeTab, setActiveTab] = useState<'items' | 'logs'>('items')

  const itemGroupOptions = useMemo(() => getLeafOptions(references?.itemGroups ?? []), [references])
  const warehouseOptions = useMemo(() => getLeafOptions(references?.warehouses ?? []), [references])
  const stockUomOptions = useMemo(() => getActiveOptions(references?.stockUoms ?? []), [references])
  const brandOptions = useMemo(() => getActiveOptions(references?.brands ?? []), [references])
  const gstHsnOptions = useMemo(() => getActiveOptions(references?.gstHsnCodes ?? []), [references])
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])

  async function loadItemsWithToken(token: string, options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoading(true)
    }

    try {
      const [responseResult, syncLogResult] = await Promise.allSettled([
        listFrappeItems(token),
        listFrappeItemProductSyncLogs(token),
      ])
      if (responseResult.status === 'rejected') {
        throw responseResult.reason
      }

      setItems(responseResult.value.items.map(normalizeItem))
      setReferences(responseResult.value.references)
      setLastSyncedAt(responseResult.value.syncedAt)

      if (syncLogResult.status === 'fulfilled') {
        setSyncLogs(syncLogResult.value.items)
      }
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

      await loadItemsWithToken(token)
    }

    void loadInitial()

    const intervalId = isSuperAdmin
      ? window.setInterval(() => {
          const token = accessToken
          if (!token || cancelled) {
            return
          }

          void loadItemsWithToken(token, { silent: true })
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
    if (!references) {
      return
    }

    setValues((current) => {
      if (dialogOpen || editingId) {
        return current
      }

      return createDefaultValues(references)
    })
  }, [dialogOpen, editingId, references])

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => items.some((item) => item.id === id)))
  }, [items])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return items.filter((item) => {
      const matchesSearch = normalizedSearch.length === 0
        || [
          item.itemCode,
          item.itemName,
          item.description,
          item.itemGroup,
          item.stockUom,
          item.brand,
          item.gstHsnCode,
          item.syncedProductName,
          item.syncedProductSlug,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch))

      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && !item.disabled)
        || (statusFilter === 'disabled' && item.disabled)

      const matchesStock = stockFilter === 'all'
        || (stockFilter === 'stock' && item.isStockItem)
        || (stockFilter === 'service' && !item.isStockItem)

      const matchesSync = syncFilter === 'all'
        || (syncFilter === 'synced' && item.isSyncedToProduct)
        || (syncFilter === 'notSynced' && !item.isSyncedToProduct)

      const matchesVariants = !variantsOnly || item.hasVariants

      return matchesSearch && matchesStatus && matchesStock && matchesSync && matchesVariants
    })
  }, [items, searchValue, statusFilter, stockFilter, syncFilter, variantsOnly])

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)
  const pageIds = paginatedItems.map((item) => item.id)
  const selectedItemCount = selectedIds.length
  const syncTargetItems = useMemo(
    () => syncTargetIds.map((id) => itemById.get(id)).filter((item): item is FrappeItem => Boolean(item)),
    [itemById, syncTargetIds],
  )
  const syncDuplicateItems = useMemo(
    () => syncTargetItems.filter((item) => item.isSyncedToProduct),
    [syncTargetItems],
  )
  const selectedOnPageCount = paginatedItems.filter((item) => selectedIds.includes(item.id)).length
  const allCurrentPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))
  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id))
  const hasSyncDuplicates = syncDuplicateItems.length > 0

  function resetDialogState() {
    setDialogOpen(false)
    setEditingId(null)
    setEditing(false)
    setValues(createDefaultValues(references))
    setFieldErrors(createFieldErrors())
  }

  function openCreateDialog() {
    setEditingId(null)
    setEditing(false)
    setValues(createDefaultValues(references))
    setFieldErrors(createFieldErrors())
    setDialogOpen(true)
  }

  async function startEdit(itemId: string) {
    if (!isSuperAdmin || typeof accessToken !== 'string') {
      return
    }

    setEditing(true)
    setErrorMessage(null)

    try {
      const item = normalizeItem(await getFrappeItem(accessToken, itemId))
      setEditingId(item.id)
      setValues({
        itemCode: item.itemCode,
        itemName: item.itemName,
        description: item.description,
        itemGroup: item.itemGroup,
        stockUom: item.stockUom,
        brand: item.brand,
        gstHsnCode: item.gstHsnCode,
        defaultWarehouse: item.defaultWarehouse || references?.defaults.warehouse || '',
        disabled: item.disabled,
        isStockItem: item.isStockItem,
      })
      setFieldErrors(createFieldErrors())
      setDialogOpen(true)
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to load Frappe Item',
        description: message,
      })
    } finally {
      setEditing(false)
    }
  }

  async function handleSubmit() {
    if (!isSuperAdmin || typeof accessToken !== 'string') {
      return
    }

    const nextFieldErrors = validateItem(values)
    setFieldErrors(nextFieldErrors)

    if (Object.keys(nextFieldErrors).length > 0) {
      setErrorMessage('Validation failed.')
      showValidationToast('frappe item')
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      if (editingId) {
        const updated = await updateFrappeItem(accessToken, editingId, values)
        showSavedToast({
          entityLabel: 'frappe item',
          recordName: updated.itemName,
          referenceId: updated.id,
          mode: 'update',
        })
      } else {
        const created = await createFrappeItem(accessToken, values)
        showSavedToast({
          entityLabel: 'frappe item',
          recordName: created.itemName,
          referenceId: created.id,
          mode: 'create',
        })
      }

      resetDialogState()
      await loadItemsWithToken(accessToken, { silent: true })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: editingId ? 'Unable to update Frappe Item' : 'Unable to create Frappe Item',
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleManualSync() {
    if (!isSuperAdmin || typeof accessToken !== 'string') {
      return
    }

    setSyncing(true)
    try {
      const success = await loadItemsWithToken(accessToken)
      if (success) {
        showSuccessToast({
          title: 'Frappe Items synced',
          description: 'The latest ERPNext Item documents were pulled into the manager.',
        })
      }
    } finally {
      setSyncing(false)
    }
  }

  function toggleSelected(itemId: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(itemId) ? current : [...current, itemId]
      }

      return current.filter((entry) => entry !== itemId)
    })
  }

  function toggleCurrentPageSelection(checked: boolean) {
    const pageIds = paginatedItems.map((item) => item.id)
    setSelectedIds((current) => {
      if (checked) {
        return [...new Set([...current, ...pageIds])]
      }

      return current.filter((id) => !pageIds.includes(id))
    })
  }

  function toggleFilteredSelection(checked: boolean) {
    const filteredIds = filteredItems.map((item) => item.id)
    setSelectedIds((current) => {
      if (checked) {
        return [...new Set([...current, ...filteredIds])]
      }

      return current.filter((id) => !filteredIds.includes(id))
    })
  }

  function clearSelection() {
    setSelectedIds([])
  }

  function openSyncDialog(itemIds?: string[]) {
    if (!isSuperAdmin || typeof accessToken !== 'string') {
      return
    }

    const targetIds = (itemIds ?? selectedIds).filter(Boolean)
    if (targetIds.length === 0) {
      showValidationToast('frappe item sync')
      return
    }

    setSyncTargetIds(targetIds)
    setSyncDuplicateMode('overwrite')

    const hasDuplicates = targetIds.some((id) => itemById.get(id)?.isSyncedToProduct)
    if (hasDuplicates) {
      setSyncDialogOpen(true)
      return
    }

    void handleSyncProducts(targetIds, 'overwrite')
  }

  async function handleSyncProducts(itemIds?: string[], duplicateMode: SyncDuplicateMode = 'overwrite') {
    if (!isSuperAdmin || typeof accessToken !== 'string') {
      return
    }

    const targetIds = (itemIds ?? selectedIds).filter(Boolean)
    if (targetIds.length === 0) {
      showValidationToast('frappe item sync')
      return
    }

    setSyncingProducts(true)
    setErrorMessage(null)

    try {
      const sync = await syncFrappeItemsToProducts(accessToken, {
        itemIds: targetIds,
        duplicateMode,
      })
      const createCount = sync.items.filter((item) => item.mode === 'create').length
      const updateCount = sync.items.filter((item) => item.mode === 'update').length
      const skippedCount = sync.summary.skippedCount
      const failedCount = sync.summary.failureCount

      showSuccessToast({
        title: 'Products synced from Frappe',
        description: failedCount > 0
          ? `${createCount} created, ${updateCount} updated, ${skippedCount} skipped, ${failedCount} failed.`
          : skippedCount > 0
            ? `${createCount} created, ${updateCount} updated, ${skippedCount} duplicates skipped.`
          : sync.items.length === 1
            ? `${sync.items[0].productName} is now synced to ecommerce and visible in the storefront.`
            : `${sync.items.length} products were synced to ecommerce and are storefront-visible.`,
      })

      setSelectedIds([])
      setSyncTargetIds([])
      setSyncDialogOpen(false)
      await loadItemsWithToken(accessToken)
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to sync Frappe Items to ecommerce',
        description: message,
      })
    } finally {
      setSyncingProducts(false)
    }
  }

  async function handleToggleDisabled(item: FrappeItem) {
    if (!isSuperAdmin || typeof accessToken !== 'string') {
      return
    }

    try {
      await updateFrappeItem(accessToken, item.id, {
        itemCode: item.itemCode,
        itemName: item.itemName,
        description: item.description,
        itemGroup: item.itemGroup,
        stockUom: item.stockUom,
        brand: item.brand,
        gstHsnCode: item.gstHsnCode,
        defaultWarehouse: item.defaultWarehouse || references?.defaults.warehouse || '',
        disabled: !item.disabled,
        isStockItem: item.isStockItem,
      })

      setItems((current) => current.map((entry) => (
        entry.id === item.id
          ? {
              ...entry,
              disabled: !entry.disabled,
              modifiedAt: new Date().toISOString(),
            }
          : entry
      )))
      setLastSyncedAt(new Date().toISOString())

      showStatusChangeToast({
        entityLabel: 'frappe item',
        recordName: item.itemName,
        referenceId: item.id,
        action: item.disabled ? 'restore' : 'deactivate',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to update Frappe Item',
        description: message,
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="border-b border-border/60 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge>Frappe</Badge>
              <div>
                <CardTitle className="text-3xl">ERPNext Item manager</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
                  Sync Item documents from ERPNext, review core dependencies, and push selected records into ecommerce products with storefront visibility defaults.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{isSuperAdmin ? 'Auto refresh 30s' : 'Read only'}</Badge>
              <Badge variant="outline">{lastSyncedAt ? `Last sync ${formatDateTime(lastSyncedAt)}` : 'Waiting for first sync'}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'items' | 'logs')} className="space-y-4">
        <TabsList variant="line" className="w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger value="items" className="rounded-none px-4">Product table</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-none px-4">Sync log manager</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
      <Card className="rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">References and dependencies</CardTitle>
          <CardDescription>
            The form loads ERPNext Item Groups, Warehouses, UOMs, Brands, and GST HSN codes. Product sync maps these to ecommerce masters, creates missing references when needed, and falls back to system defaults for any remaining gaps.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>Item Groups: <span className="font-medium text-foreground">{itemGroupOptions.length}</span></span>
          <span>Warehouses: <span className="font-medium text-foreground">{warehouseOptions.length}</span></span>
          <span>UOMs: <span className="font-medium text-foreground">{stockUomOptions.length}</span></span>
          <span>Brands: <span className="font-medium text-foreground">{brandOptions.length}</span></span>
          <span>HSN references: <span className="font-medium text-foreground">{gstHsnOptions.length}</span></span>
          {references?.defaults.company ? (
            <span>Default company: <span className="font-medium text-foreground">{references.defaults.company}</span></span>
          ) : null}
          {references?.defaults.warehouse ? (
            <span>Default warehouse: <span className="font-medium text-foreground">{references.defaults.warehouse}</span></span>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>Total records: <span className="font-medium text-foreground">{totalRecords}</span></span>
              <span>Selected on page: <span className="font-medium text-foreground">{selectedOnPageCount}</span></span>
              <span>Selected across filters: <span className="font-medium text-foreground">{selectedItemCount}</span></span>
            </div>
            {isSuperAdmin ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openSyncDialog()}
                  disabled={syncingProducts || saving || editing || selectedIds.length === 0}
                >
                  <CheckIcon className="size-4" />
                  {syncingProducts ? 'Syncing products...' : 'Sync selected to ecommerce'}
                </Button>
                <Button type="button" variant="outline" onClick={() => void handleManualSync()} disabled={syncing || saving || editing || syncingProducts}>
                  <RefreshCcw className="size-4" />
                  {syncing ? 'Syncing...' : 'Refresh frappe list'}
                </Button>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Product sync and edits are available only to super-admin users.</span>
            )}
          </div>

          {syncingProducts ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Syncing selected to ecommerce</span>
                <span>Please wait...</span>
              </div>
              <Progress value={100} className="h-1" />
            </div>
          ) : null}

          {isSuperAdmin ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => toggleCurrentPageSelection(!allCurrentPageSelected)}
              >
                {allCurrentPageSelected ? 'Clear page selection' : 'Select page'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => toggleFilteredSelection(!allFilteredSelected)}
              >
                {allFilteredSelected ? 'Clear filtered selection' : 'Select all filtered'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={clearSelection}
                disabled={selectedItemCount === 0}
              >
                Clear selection
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {errorMessage ? (
        <Card className={`${warningCardClassName} rounded-md`}>
          <CardContent className="rounded-md p-4 text-sm">
            <p className="font-medium">{errorMessage}</p>
            {Object.keys(fieldErrors).length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {summarizeFieldErrors(fieldErrors).map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-muted-foreground">
              Check the ERPNext connection in <Link to="/admin/dashboard/frappe/connection" className="font-medium text-foreground underline underline-offset-4">Frappe Connection</Link> if this looks like a configuration problem.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <CommonList
        header={{
          pageTitle: 'Frappe Items',
          pageDescription: 'List, search, filter, sync to ecommerce products, and upsert ERPNext Item documents from one manager.',
          addLabel: isSuperAdmin ? 'New Item' : undefined,
          onAddClick: isSuperAdmin ? openCreateDialog : undefined,
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: 'Search ERPNext Items',
        }}
        filters={{
          buttonLabel: 'Item filters',
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
            {
              key: 'active',
              label: 'Active only',
              isActive: statusFilter === 'active',
              onSelect: () => {
                setStatusFilter((current) => (current === 'active' ? 'all' : 'active'))
                setCurrentPage(1)
              },
            },
            {
              key: 'disabled',
              label: 'Disabled only',
              isActive: statusFilter === 'disabled',
              onSelect: () => {
                setStatusFilter((current) => (current === 'disabled' ? 'all' : 'disabled'))
                setCurrentPage(1)
              },
            },
            {
              key: 'stock',
              label: 'Stock items',
              isActive: stockFilter === 'stock',
              onSelect: () => {
                setStockFilter((current) => (current === 'stock' ? 'all' : 'stock'))
                setCurrentPage(1)
              },
            },
            {
              key: 'service',
              label: 'Service items',
              isActive: stockFilter === 'service',
              onSelect: () => {
                setStockFilter((current) => (current === 'service' ? 'all' : 'service'))
                setCurrentPage(1)
              },
            },
            {
              key: 'synced',
              label: 'Synced products',
              isActive: syncFilter === 'synced',
              onSelect: () => {
                setSyncFilter((current) => (current === 'synced' ? 'all' : 'synced'))
                setCurrentPage(1)
              },
            },
            {
              key: 'not-synced',
              label: 'Not synced',
              isActive: syncFilter === 'notSynced',
              onSelect: () => {
                setSyncFilter((current) => (current === 'notSynced' ? 'all' : 'notSynced'))
                setCurrentPage(1)
              },
            },
            {
              key: 'variants',
              label: 'Variants only',
              isActive: variantsOnly,
              onSelect: () => {
                setVariantsOnly((current) => !current)
                setCurrentPage(1)
              },
            },
          ],
          activeFilters: [
            ...(statusFilter === 'all' ? [] : [{ key: 'status', label: 'Status', value: statusFilter === 'active' ? 'Active' : 'Disabled' }]),
            ...(stockFilter === 'all' ? [] : [{ key: 'stock', label: 'Type', value: stockFilter === 'stock' ? 'Stock' : 'Service' }]),
            ...(syncFilter === 'all' ? [] : [{ key: 'sync', label: 'Sync', value: syncFilter === 'synced' ? 'Synced' : 'Not synced' }]),
            ...(variantsOnly ? [{ key: 'variants', label: 'Variants', value: 'Yes' }] : []),
          ],
          onRemoveFilter: (key) => {
            if (key === 'status') {
              setStatusFilter('all')
            }

            if (key === 'stock') {
              setStockFilter('all')
            }

            if (key === 'sync') {
              setSyncFilter('all')
            }

            if (key === 'variants') {
              setVariantsOnly(false)
            }
          },
          onClearAllFilters: () => {
            setStatusFilter('all')
            setStockFilter('all')
            setSyncFilter('all')
            setVariantsOnly(false)
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
              cell: (item: FrappeItem) => (
                <div className="flex justify-center">
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={(checked) => toggleSelected(item.id, checked === true)}
                    aria-label={`Select ${item.itemName}`}
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
              id: 'item',
              header: 'Item',
              sortable: true,
              accessor: (item) => item.itemName,
              className: 'min-w-0 max-w-[24rem]',
              cell: (item) => (
                <div className="min-w-0 max-w-[24rem]">
                  <p className="font-medium text-foreground">{item.itemName}</p>
                  <p className="truncate text-sm text-muted-foreground">{item.itemCode}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.description || 'No description'}</p>
                </div>
              ),
            },
            {
              id: 'group',
              header: 'Group',
              accessor: (item) => item.itemGroup,
              cell: (item) => (
                <div>
                  <p>{item.itemGroup || 'Not set'}</p>
                  <p className="text-sm text-muted-foreground">{item.stockUom || 'No UOM'}</p>
                </div>
              ),
            },
            {
              id: 'brand',
              header: 'Brand / HSN',
              accessor: (item) => item.brand,
              cell: (item) => (
                <div>
                  <p>{item.brand || 'Unbranded'}</p>
                  <p className="text-sm text-muted-foreground">{item.gstHsnCode || 'No HSN'}</p>
                </div>
              ),
            },
            {
              id: 'warehouse',
              header: 'Default Warehouse',
              accessor: (item) => item.defaultWarehouse,
              cell: (item) => <span>{item.defaultWarehouse || references?.defaults.warehouse || 'Not set'}</span>,
            },
            {
              id: 'productSync',
              header: 'Ecommerce Product',
              accessor: (item) => item.syncedProductName || item.syncedProductSlug || item.syncedProductId,
              cell: (item) => item.isSyncedToProduct ? (
                <div>
                  <Link
                    to={`/admin/dashboard/products/${item.syncedProductId}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {item.syncedProductName}
                  </Link>
                  <p className="text-sm text-muted-foreground">/{item.syncedProductSlug}</p>
                </div>
              ) : (
                <StatusBadge tone="manual">Not synced</StatusBadge>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              accessor: (item) => item.disabled,
              cell: (item) => (
                <div className="flex flex-wrap items-center gap-2">
                  <ActiveStatusBadge isActive={!item.disabled} activeLabel="Active" inactiveLabel="Disabled" />
                  {item.isStockItem ? <StatusBadge tone="publishing">Stock</StatusBadge> : <StatusBadge tone="manual">Service</StatusBadge>}
                  {item.hasVariants ? <StatusBadge tone="featured">Variants</StatusBadge> : null}
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
            ...(isSuperAdmin ? [{
              id: 'actions',
              header: 'Actions',
              className: 'w-12 min-w-12 px-2 text-center',
              headerClassName: 'w-12 min-w-12 px-2 text-center',
              sticky: 'right' as const,
              cell: (item: FrappeItem) => (
                <div className="flex justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" size="icon-sm" variant="ghost">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => openSyncDialog([item.id])}>
                        <CheckIcon className="size-4" />
                        <span>Sync to ecommerce</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => void startEdit(item.id)}>
                        <EditIcon className="size-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => void handleToggleDisabled(item)}>
                        <PowerIcon className="size-4" />
                        <span>{item.disabled ? 'Restore' : 'Disable'}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ),
            }] : []),
          ],
          data: paginatedItems,
          loading,
          loadingMessage: 'Loading Frappe Items...',
          emptyMessage: errorMessage ?? 'No Frappe Items found.',
          rowKey: (item) => item.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>Total records: <span className="font-medium text-foreground">{totalRecords}</span></span>
              <span>Active records: <span className="font-medium text-foreground">{filteredItems.filter((item) => !item.disabled).length}</span></span>
              <span>Stock records: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.isStockItem).length}</span></span>
              <span>Variant records: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.hasVariants).length}</span></span>
              <span>Synced products: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.isSyncedToProduct).length}</span></span>
            </div>
          ),
        }}
        pagination={{
          currentPage: safeCurrentPage,
          pageSize,
          totalRecords,
          pageSizeOptions: [10, 25, 50, 100, 200],
          onPageChange: setCurrentPage,
          onPageSizeChange: (value) => {
            setPageSize(value)
            setCurrentPage(1)
          },
        }}
      />

        </TabsContent>
        <TabsContent value="logs" className="space-y-4">
          <Card className="rounded-md">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Sync log manager</CardTitle>
                  <CardDescription>
                    Review recent Frappe item to product sync sessions, success counts, skipped items, and failure reasons.
                  </CardDescription>
                </div>
                <Badge variant="outline">{syncLogs.length} sessions</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {syncLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sync sessions recorded yet.</p>
              ) : syncLogs.slice(0, 5).map((log) => {
                const failedItems = log.items.filter((item) => item.mode === 'failed')

                return (
                  <div key={log.id} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{formatDateTime(log.syncedAt)}</p>
                        <p className="text-xs text-muted-foreground">{log.summary}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{log.duplicateMode}</Badge>
                        <Badge variant="secondary">Success {log.successCount}</Badge>
                        <Badge variant="secondary">Skipped {log.skippedCount}</Badge>
                        <Badge
                          variant="outline"
                          className={log.failureCount > 0 ? 'border-destructive/40 bg-destructive/10 text-destructive' : undefined}
                        >
                          Failed {log.failureCount}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-4">
                      <span>Total requested: <span className="font-medium text-foreground">{log.requestedCount}</span></span>
                      <span>Started: <span className="font-medium text-foreground">{formatDateTime(log.startedAt)}</span></span>
                      <span>Finished: <span className="font-medium text-foreground">{formatDateTime(log.finishedAt)}</span></span>
                      <span>By: <span className="font-medium text-foreground">{log.createdByUserId || 'System'}</span></span>
                    </div>

                    {failedItems.length > 0 ? (
                      <details className="mt-3 rounded-lg border border-border/60 bg-background/80 p-3">
                        <summary className="cursor-pointer text-sm font-medium text-foreground">
                          Failed items ({failedItems.length})
                        </summary>
                        <div className="mt-3 space-y-2">
                          {failedItems.map((item) => (
                            <div key={`${log.id}-${item.frappeItemId}`} className="rounded-md bg-muted/40 p-3 text-sm">
                              <p className="font-medium text-foreground">{item.frappeItemCode}</p>
                              <p className="text-muted-foreground">{item.reason}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Sync selected items</DialogTitle>
            <DialogDescription>
              {syncTargetItems.length} selected item{syncTargetItems.length === 1 ? '' : 's'} will be sent to ecommerce.
              {hasSyncDuplicates ? ` ${syncDuplicateItems.length} already have linked products, so choose overwrite or skip before continuing.` : ' These items will create new ecommerce products.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setSyncDuplicateMode('overwrite')}
                className={`rounded-2xl border p-4 text-left transition ${
                  syncDuplicateMode === 'overwrite'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border/70 bg-background hover:border-primary/40'
                }`}
              >
                <p className="font-medium text-foreground">Overwrite duplicates</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update existing ecommerce products with the latest ERPNext values.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setSyncDuplicateMode('skip')}
                className={`rounded-2xl border p-4 text-left transition ${
                  syncDuplicateMode === 'skip'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border/70 bg-background hover:border-primary/40'
                }`}
              >
                <p className="font-medium text-foreground">Skip duplicates</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Leave existing ecommerce products unchanged and only create new ones.
                </p>
              </button>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Sync field mapping</p>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                <p><span className="font-medium text-foreground">Product name:</span> ERPNext item name</p>
                <p><span className="font-medium text-foreground">Slug:</span> generated from item name</p>
                <p><span className="font-medium text-foreground">SKU:</span> ERPNext item code</p>
                <p><span className="font-medium text-foreground">Group:</span> ERPNext item group</p>
                <p><span className="font-medium text-foreground">Brand:</span> ERPNext brand</p>
                <p><span className="font-medium text-foreground">HSN:</span> ERPNext GST HSN code</p>
              </div>
            </div>

            <div className="max-h-[20rem] overflow-y-auto rounded-2xl border border-border/70 bg-card/60 p-3">
              <div className="grid gap-3">
                {syncTargetItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/60 bg-background/80 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{item.itemName}</p>
                        <p className="text-sm text-muted-foreground">{item.itemCode}</p>
                      </div>
                      <Badge variant={item.isSyncedToProduct ? 'outline' : 'secondary'}>
                        {item.isSyncedToProduct ? 'Duplicate' : 'New'}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                      <p><span className="font-medium text-foreground">Group:</span> {item.itemGroup || 'Not set'}</p>
                      <p><span className="font-medium text-foreground">Brand:</span> {item.brand || 'Not set'}</p>
                      <p><span className="font-medium text-foreground">HSN:</span> {item.gstHsnCode || 'Not set'}</p>
                      <p><span className="font-medium text-foreground">Product:</span> {item.syncedProductName || 'Will be created'}</p>
                      <p className="md:col-span-2">
                        <span className="font-medium text-foreground">Slug:</span> {item.syncedProductSlug || 'Will be generated from the item name'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row sm:items-center">
            <Button type="button" variant="ghost" onClick={() => setSyncDialogOpen(false)} disabled={syncingProducts}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleSyncProducts(syncTargetIds, 'skip')}
              disabled={syncingProducts || !hasSyncDuplicates}
            >
              Skip duplicates and sync
            </Button>
            <Button
              type="button"
              onClick={() => void handleSyncProducts(syncTargetIds, syncDuplicateMode)}
              disabled={syncingProducts}
            >
              {syncDuplicateMode === 'skip' ? 'Sync without overwriting' : 'Overwrite and sync'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open && !saving && !editing) {
          resetDialogState()
          return
        }

        setDialogOpen(open)
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Frappe Item' : 'Create Frappe Item'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? `Update ERPNext Item ${editingId} from the popup form.`
                : 'Create a new ERPNext Item using the loaded reference data.'}
            </DialogDescription>
          </DialogHeader>

          {editing ? (
            <div className="rounded-md border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
              Loading item details...
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="frappe-item-code" className={fieldErrors.itemCode ? 'text-destructive' : undefined}>
                    Item Code
                  </Label>
                  <Input
                    id="frappe-item-code"
                    className={inputErrorClassName(Boolean(fieldErrors.itemCode))}
                    value={values.itemCode}
                    onChange={(event) => {
                      setValues((current) => ({ ...current, itemCode: event.target.value }))
                      setFieldErrors((current) => {
                        const nextErrors = { ...current }
                        delete nextErrors.itemCode
                        return nextErrors
                      })
                    }}
                    placeholder="ITEM-0001"
                    disabled={Boolean(editingId)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This ERPNext site may replace the entered code with its naming-series value when the item is saved.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="frappe-item-name" className={fieldErrors.itemName ? 'text-destructive' : undefined}>
                    Item Name
                  </Label>
                  <Input
                    id="frappe-item-name"
                    className={inputErrorClassName(Boolean(fieldErrors.itemName))}
                    value={values.itemName}
                    onChange={(event) => {
                      setValues((current) => ({ ...current, itemName: event.target.value }))
                      setFieldErrors((current) => {
                        const nextErrors = { ...current }
                        delete nextErrors.itemName
                        return nextErrors
                      })
                    }}
                    placeholder="codexsun Inventory Item"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="frappe-item-group" className={fieldErrors.itemGroup ? 'text-destructive' : undefined}>
                    Item Group
                  </Label>
                  <select
                    id="frappe-item-group"
                    className={`${inputErrorClassName(Boolean(fieldErrors.itemGroup))} flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`}
                    value={values.itemGroup}
                    onChange={(event) => {
                      setValues((current) => ({ ...current, itemGroup: event.target.value }))
                      setFieldErrors((current) => {
                        const nextErrors = { ...current }
                        delete nextErrors.itemGroup
                        return nextErrors
                      })
                    }}
                  >
                    <option value="">Select Item Group</option>
                    {itemGroupOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="frappe-item-stock-uom" className={fieldErrors.stockUom ? 'text-destructive' : undefined}>
                    Stock UOM
                  </Label>
                  <select
                    id="frappe-item-stock-uom"
                    className={`${inputErrorClassName(Boolean(fieldErrors.stockUom))} flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`}
                    value={values.stockUom}
                    onChange={(event) => {
                      setValues((current) => ({ ...current, stockUom: event.target.value }))
                      setFieldErrors((current) => {
                        const nextErrors = { ...current }
                        delete nextErrors.stockUom
                        return nextErrors
                      })
                    }}
                  >
                    <option value="">Select UOM</option>
                    {stockUomOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="frappe-item-brand" className={fieldErrors.brand ? 'text-destructive' : undefined}>
                    Brand
                  </Label>
                  <Input
                    id="frappe-item-brand"
                    list="frappe-item-brand-options"
                    className={inputErrorClassName(Boolean(fieldErrors.brand))}
                    value={values.brand}
                    onChange={(event) => {
                      setValues((current) => ({ ...current, brand: event.target.value }))
                      setFieldErrors((current) => {
                        const nextErrors = { ...current }
                        delete nextErrors.brand
                        return nextErrors
                      })
                    }}
                    placeholder="Select or type an existing brand"
                  />
                  <datalist id="frappe-item-brand-options">
                    {brandOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </datalist>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="frappe-item-gst-hsn" className={fieldErrors.gstHsnCode ? 'text-destructive' : undefined}>
                    GST HSN Code
                  </Label>
                  <Input
                    id="frappe-item-gst-hsn"
                    list="frappe-item-gst-hsn-options"
                    className={inputErrorClassName(Boolean(fieldErrors.gstHsnCode))}
                    value={values.gstHsnCode}
                    onChange={(event) => {
                      setValues((current) => ({ ...current, gstHsnCode: event.target.value }))
                      setFieldErrors((current) => {
                        const nextErrors = { ...current }
                        delete nextErrors.gstHsnCode
                        return nextErrors
                      })
                    }}
                    placeholder="85235100"
                  />
                  <datalist id="frappe-item-gst-hsn-options">
                    {gstHsnOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.description || option.label}</option>
                    ))}
                  </datalist>
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="frappe-item-default-warehouse">Default Warehouse</Label>
                  <select
                    id="frappe-item-default-warehouse"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    value={values.defaultWarehouse}
                    onChange={(event) => setValues((current) => ({ ...current, defaultWarehouse: event.target.value }))}
                  >
                    <option value="">No default warehouse</option>
                    {warehouseOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                  {references?.defaults.company ? (
                    <p className="text-xs text-muted-foreground">
                      Item defaults will be saved against company {references.defaults.company}.
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="frappe-item-description">Description</Label>
                  <Textarea
                    id="frappe-item-description"
                    value={values.description}
                    onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Internal notes, sellable copy, or ERPNext item description"
                  />
                </div>
              </div>

              <div className="grid gap-3 rounded-md border border-border/60 bg-muted/15 p-4 md:grid-cols-2">
                <label className="flex items-center gap-3">
                  <Checkbox
                    checked={!values.disabled}
                    onCheckedChange={(checked) => setValues((current) => ({ ...current, disabled: checked !== true }))}
                  />
                  <span className="text-sm font-medium">Active Item</span>
                </label>
                <label className="flex items-center gap-3">
                  <Checkbox
                    checked={values.isStockItem}
                    onCheckedChange={(checked) => setValues((current) => ({ ...current, isStockItem: checked === true }))}
                  />
                  <span className="text-sm font-medium">Stock Item</span>
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetDialogState} disabled={saving || editing}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={saving || editing}>
              {saving ? 'Saving...' : editingId ? 'Save Item' : 'Create Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
