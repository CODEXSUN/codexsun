import { useEffect, useMemo, useState } from "react"
import { PackagePlusIcon, RefreshCwIcon, SendIcon, UploadCloudIcon } from "lucide-react"

import type { ProductSummary } from "@core/shared"
import type {
  FrappeItem,
  FrappeItemManager,
  FrappeItemProductMappingResponse,
  FrappeItemProductMappingUpsertPayload,
  FrappeItemUpsertPayload,
} from "@frappe/shared"
import { MasterList } from "@/components/blocks/master-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useDashboardShell } from "@/features/dashboard/dashboard-shell"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import {
  createFrappeItem,
  getFrappeItemMapping,
  listCoreProducts,
  listFrappeItemSyncLogs,
  listFrappeItems,
  pullFrappeItemsLive,
  syncFrappeItemsToProducts,
  updateFrappeItem,
  updateFrappeItemMapping,
} from "../api/frappe-api"
import { getConnectionStatus } from "../services/frappe"
import { ItemMappingComparePanel } from "./item-mapping-compare-panel"
import {
  Field,
  NativeCheckbox,
  StateCard,
  createDefaultItemValues,
  formatDateTime,
  getActiveOptions,
  getLeafOptions,
  toErrorMessage,
} from "./shared"

function toMappingValues(
  response: FrappeItemProductMappingResponse
): FrappeItemProductMappingUpsertPayload {
  return {
    targetProductId: response.mapping.targetProductId,
    productName: response.mapping.productName,
    productSlug: response.mapping.productSlug,
    shortDescription: response.mapping.shortDescription,
    categoryName: response.mapping.categoryName,
    productGroupName: response.mapping.productGroupName,
    productTypeName: response.mapping.productTypeName,
    brandName: response.mapping.brandName,
    hsnCodeId: response.mapping.hsnCodeId,
    sku: response.mapping.sku,
    storefrontDepartment: response.mapping.storefrontDepartment,
    isActive: response.mapping.isActive,
    isFeatured: response.mapping.isFeatured,
    isNewArrival: response.mapping.isNewArrival,
    isBestSeller: response.mapping.isBestSeller,
    isFeaturedLabel: response.mapping.isFeaturedLabel,
    catalogBadge: response.mapping.catalogBadge,
    promoBadge: response.mapping.promoBadge,
    shippingNote: response.mapping.shippingNote,
    tagNames: response.mapping.tagNames,
    notes: response.mapping.notes,
  }
}

export function FrappeItemsSection() {
  const { user } = useDashboardShell()
  const [items, setItems] = useState<FrappeItem[]>([])
  const [coreProducts, setCoreProducts] = useState<ProductSummary[]>([])
  const [references, setReferences] =
    useState<FrappeItemManager["references"] | null>(null)
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([])
  const [searchValue, setSearchValue] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [duplicateMode, setDuplicateMode] = useState<"overwrite" | "skip">("overwrite")
  const [values, setValues] = useState<FrappeItemUpsertPayload>(createDefaultItemValues(null))
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [lastSyncedAt, setLastSyncedAt] = useState("")
  const [manualQuery, setManualQuery] = useState("disabled=0")
  const [connectionState, setConnectionState] = useState<"connected" | "failed">("failed")
  const [activeCompareItemId, setActiveCompareItemId] = useState<string | null>(null)
  const [mappingResponse, setMappingResponse] = useState<FrappeItemProductMappingResponse | null>(null)
  const [mappingValues, setMappingValues] = useState<FrappeItemProductMappingUpsertPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isMappingLoading, setIsMappingLoading] = useState(false)
  const [isMappingSaving, setIsMappingSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  useGlobalLoading(isLoading || isSyncing)

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()
    if (!normalizedSearch) {
      return items
    }
    return items.filter((item) =>
      [
        item.itemCode,
        item.itemName,
        item.description,
        item.itemGroup,
        item.brand,
        item.gstHsnCode,
        item.defaultWarehouse,
        item.syncedProductName,
        item.syncedProductSlug,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    )
  }, [items, searchValue])

  const activeCompareItem =
    filteredItems.find((item) => item.id === activeCompareItemId) ??
    items.find((item) => item.id === activeCompareItemId) ??
    filteredItems[0] ??
    items[0] ??
    null

  async function loadItems() {
    setIsLoading(true)
    setError(null)

    try {
      const [itemResponse, logResponse, connectionStatus, coreProductResponse] = await Promise.all([
        listFrappeItems(),
        listFrappeItemSyncLogs(),
        getConnectionStatus().catch(() => null),
        listCoreProducts().catch(() => ({ items: [] })),
      ])

      setItems(itemResponse.manager.items)
      setCoreProducts(coreProductResponse.items)
      setReferences(itemResponse.manager.references)
      setLastSyncedAt(itemResponse.manager.syncedAt)
      setConnectionState(connectionStatus?.state === "connected" ? "connected" : "failed")

      if (!activeCompareItemId && itemResponse.manager.items[0]) {
        setActiveCompareItemId(itemResponse.manager.items[0].id)
      }

      const latestLog = logResponse.manager.items[0]
      if (latestLog && !syncMessage) {
        setSyncMessage(latestLog.summary)
      }
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadItems()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchValue])

  useEffect(() => {
    if (!editingId) {
      setValues(createDefaultItemValues(references))
    }
  }, [editingId, references])

  useEffect(() => {
    if (selectedIds.length > 0) {
      setActiveCompareItemId(String(selectedIds[0]))
      return
    }

    if (!activeCompareItemId && filteredItems[0]) {
      setActiveCompareItemId(filteredItems[0].id)
    }
  }, [activeCompareItemId, filteredItems, selectedIds])

  useEffect(() => {
    if (!activeCompareItem) {
      setMappingResponse(null)
      setMappingValues(null)
      return
    }

    let cancelled = false

    async function loadMapping() {
      setIsMappingLoading(true)

      try {
        const response = await getFrappeItemMapping(activeCompareItem.id)
        if (cancelled) {
          return
        }
        setMappingResponse(response)
        setMappingValues(toMappingValues(response))
      } catch (nextError) {
        if (!cancelled) {
          setError(toErrorMessage(nextError))
        }
      } finally {
        if (!cancelled) {
          setIsMappingLoading(false)
        }
      }
    }

    void loadMapping()

    return () => {
      cancelled = true
    }
  }, [activeCompareItem?.id])

  const totalRecords = filteredItems.length
  const safeCurrentPage = Math.min(currentPage, Math.max(1, Math.ceil(totalRecords / pageSize)))
  const paginatedItems = filteredItems.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )

  function resetForm() {
    setEditingId(null)
    setValues(createDefaultItemValues(references))
  }

  function openCreateDialog() {
    resetForm()
    setDialogOpen(true)
  }

  function startEdit(item: FrappeItem) {
    setEditingId(item.id)
    setValues({
      itemCode: item.itemCode,
      itemName: item.itemName,
      description: item.description,
      itemGroup: item.itemGroup,
      stockUom: item.stockUom,
      brand: item.brand,
      gstHsnCode: item.gstHsnCode,
      defaultWarehouse: item.defaultWarehouse,
      disabled: item.disabled,
      isStockItem: item.isStockItem,
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    setIsSaving(true)
    setError(null)

    try {
      if (editingId) {
        await updateFrappeItem(editingId, values)
      } else {
        await createFrappeItem(values)
      }

      resetForm()
      setDialogOpen(false)
      await loadItems()
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSyncProducts(itemIds: string[]) {
    if (itemIds.length === 0) {
      setError("Select one or more Frappe products before syncing.")
      return
    }

    setIsSyncing(true)
    setError(null)
    setSyncMessage(null)

    try {
      const response = await syncFrappeItemsToProducts({
        itemIds,
        duplicateMode,
      })

      setSelectedIds([])
      setConnectionState("connected")
      setSyncMessage(
        `Product sync completed: ${response.sync.summary.successCount} synced, ${response.sync.summary.skippedCount} skipped, ${response.sync.summary.failureCount} failed across ${response.sync.summary.requestedCount} Frappe products.`
      )
      await loadItems()
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSyncing(false)
    }
  }

  async function handlePullLive() {
    setIsSyncing(true)
    setError(null)
    setSyncMessage(null)

    try {
      const response = await pullFrappeItemsLive({ manualQuery })
      setItems(response.sync.items)
      setSelectedIds([])
      setConnectionState("connected")
      setLastSyncedAt(response.sync.syncedAt)
      setSyncMessage(
        `ERP pull completed: ${response.sync.pulledCount} new, ${response.sync.updatedCount} updated, ${response.sync.skippedCount} unchanged. Query: ${response.sync.query || "default"}. App records: ${response.sync.appRecordCount}.`
      )
      await loadItems()
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSyncing(false)
    }
  }

  async function handleSaveMapping() {
    if (!activeCompareItem || !mappingValues) {
      return
    }

    setIsMappingSaving(true)
    setError(null)

    try {
      const response = await updateFrappeItemMapping(activeCompareItem.id, mappingValues)
      setMappingResponse(response)
      setMappingValues(toMappingValues(response))
      setSyncMessage(`Saved mapping for ${activeCompareItem.itemCode}.`)
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsMappingSaving(false)
    }
  }

  if (isLoading) {
    return null
  }

  const syncedCount = items.filter((item) => item.isSyncedToProduct).length
  const selectedCount = selectedIds.length
  const itemGroupOptions = references ? getLeafOptions(references.itemGroups) : []
  const stockUomOptions = references ? getActiveOptions(references.stockUoms) : []
  const warehouseOptions = references ? getLeafOptions(references.warehouses) : []

  return (
    <div className="space-y-3" data-technical-name="section.frappe.items">
      {error ? <StateCard message={error} /> : null}

      <MasterList
        header={{
          pageTitle: (
            <span className="inline-flex items-center gap-2">
              Products
              <span
                className={`size-2.5 rounded-full ${
                  connectionState === "connected"
                    ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.14)]"
                    : "bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.14)]"
                }`}
                title={
                  connectionState === "connected"
                    ? "ERP connection is live"
                    : "ERP connection is not verified"
                }
                aria-label={
                  connectionState === "connected"
                    ? "ERP connection is live"
                    : "ERP connection is not verified"
                }
              />
            </span>
          ),
          pageDescription: `${totalRecords} records, ${syncedCount} linked to core products${lastSyncedAt ? `, last sync ${formatDateTime(lastSyncedAt)}` : ""}.`,
          technicalName: "section.frappe.items.master-list",
          actions: (
            <div className="flex flex-col items-end gap-1">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={duplicateMode}
                  onChange={(event) => setDuplicateMode(event.target.value as "overwrite" | "skip")}
                >
                  <option value="overwrite">Overwrite duplicates</option>
                  <option value="skip">Skip duplicates</option>
                </select>
                <Input
                  className="h-9 min-w-[260px]"
                  value={manualQuery}
                  onChange={(event) => setManualQuery(event.target.value)}
                  placeholder="ERP query, e.g. disabled=0&item_group=Laptop"
                />
                <Button
                  variant="outline"
                  className="h-9 gap-2 border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                  onClick={() => void loadItems()}
                  disabled={isLoading}
                >
                  <RefreshCwIcon className="size-4" />
                  Refresh
                </Button>
                {user.isSuperAdmin ? (
                  <>
                    <Button
                      variant="outline"
                      className="h-9 gap-2 border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                      onClick={() => void handlePullLive()}
                      disabled={isSyncing}
                    >
                      <RefreshCwIcon className="size-4" />
                      {isSyncing ? "Pulling..." : "Pull ERP"}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 gap-2 border-cyan-200 bg-cyan-50 text-cyan-900 hover:bg-cyan-100"
                      onClick={() => void handleSyncProducts(selectedIds.map(String))}
                      disabled={isSyncing || selectedCount === 0}
                    >
                      <SendIcon className="size-4" />
                      Sync {selectedCount > 0 ? `(${selectedCount})` : ""}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 gap-2 border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                      onClick={() => void handleSyncProducts(filteredItems.map((item) => item.id))}
                      disabled={isSyncing || filteredItems.length === 0}
                    >
                      <UploadCloudIcon className="size-4" />
                      {isSyncing ? "Syncing..." : "Sync All"}
                    </Button>
                    <Button
                      className="h-9 gap-2 bg-slate-950 text-white hover:bg-slate-800"
                      onClick={openCreateDialog}
                    >
                      <PackagePlusIcon className="size-4" />
                      Create Product
                    </Button>
                  </>
                ) : null}
              </div>
              {syncMessage ? (
                <p className="max-w-3xl text-right text-xs leading-5 text-muted-foreground" aria-live="polite">
                  {syncMessage}
                </p>
              ) : null}
            </div>
          ),
        }}
        search={{
          value: searchValue,
          onChange: setSearchValue,
          placeholder: "Search product code, name, group, brand, warehouse, or linked core product",
        }}
        table={{
          technicalName: "table.frappe.products",
          columns: [
            {
              id: "product",
              header: "Product",
              sortable: true,
              accessor: (item) => item.itemName,
              cell: (item) => (
                <button
                  type="button"
                  className="space-y-1 text-left"
                  onClick={() => setActiveCompareItemId(item.id)}
                >
                  <p className="font-medium leading-5 text-foreground hover:text-primary">
                    {item.itemName}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {item.itemCode}
                  </p>
                </button>
              ),
              className: "min-w-[260px]",
            },
            {
              id: "grouping",
              header: "Grouping",
              sortable: true,
              accessor: (item) => `${item.itemGroup} ${item.brand}`,
              cell: (item) => (
                <div className="space-y-1 text-sm">
                  <p className="text-foreground">{item.itemGroup || "No group"}</p>
                  <p className="text-xs text-muted-foreground">{item.brand || "No brand"}</p>
                </div>
              ),
            },
            {
              id: "status",
              header: "Status",
              sortable: true,
              accessor: (item) => !item.disabled,
              cell: (item) => (
                <div className="flex flex-wrap gap-2">
                  <Badge variant={item.disabled ? "outline" : "default"}>
                    {item.disabled ? "Disabled" : "Active"}
                  </Badge>
                  {item.isStockItem ? <Badge variant="outline">Stock</Badge> : null}
                  {item.hasVariants ? <Badge variant="secondary">Variants</Badge> : null}
                </div>
              ),
            },
            {
              id: "coreProduct",
              header: "Core Product",
              sortable: true,
              accessor: (item) => item.syncedProductName,
              cell: (item) =>
                item.isSyncedToProduct ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-foreground">{item.syncedProductName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.syncedProductSlug || item.syncedProductId}
                    </p>
                  </div>
                ) : (
                  <Badge variant="outline">Not linked</Badge>
                ),
            },
            {
              id: "warehouse",
              header: "Warehouse",
              sortable: true,
              accessor: (item) => item.defaultWarehouse,
              cell: (item) => (
                <span className="text-sm text-muted-foreground">{item.defaultWarehouse || "-"}</span>
              ),
              defaultVisible: false,
            },
            {
              id: "modified",
              header: "Modified",
              sortable: true,
              accessor: (item) => item.modifiedAt,
              cell: (item) => (
                <span className="text-sm text-muted-foreground">{formatDateTime(item.modifiedAt)}</span>
              ),
            },
            {
              id: "actions",
              header: "Actions",
              cell: (item) =>
                user.isSuperAdmin ? (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setActiveCompareItemId(item.id)}>
                      Map
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                      Edit
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">View only</span>
                ),
              className: "w-32 text-right",
              headerClassName: "w-32 text-right",
            },
          ],
          data: paginatedItems,
          emptyMessage: "No Frappe products found.",
          rowKey: (item) => item.id,
        }}
        rowSelection={{
          selectedRowIds: selectedIds,
          onSelectedRowIdsChange: setSelectedIds,
          selectionLabel: "Select Frappe products",
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Total Products: <span className="font-medium text-foreground">{totalRecords}</span>
              </span>
              <span>
                Linked: <span className="font-medium text-foreground">{syncedCount}</span>
              </span>
            </div>
          ),
        }}
        pagination={{
          currentPage: safeCurrentPage,
          pageSize,
          totalRecords,
          onPageChange: setCurrentPage,
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize)
            setCurrentPage(1)
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
      />

      {activeCompareItem && mappingValues ? (
        <div className="space-y-2" data-technical-name="section.frappe.items.compare">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Compare and map</p>
              <p className="text-xs text-muted-foreground">
                Left shows ERP data. Right controls how that item becomes a core product and what ecommerce badge it carries.
              </p>
            </div>
            {isMappingLoading ? <Badge variant="outline">Loading mapping</Badge> : null}
          </div>
          <ItemMappingComparePanel
            item={activeCompareItem}
            mappingResponse={mappingResponse}
            value={mappingValues}
            coreProducts={coreProducts}
            isSaving={isMappingSaving}
            isSyncing={isSyncing}
            onChange={setMappingValues}
            onSave={() => void handleSaveMapping()}
            onSync={() => void handleSyncProducts([activeCompareItem.id])}
          />
        </div>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={(nextOpen) => {
          setDialogOpen(nextOpen)
          if (!nextOpen) {
            resetForm()
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Create Product"}</DialogTitle>
            <DialogDescription>
              Super-admin only. Changes stay in the Frappe product snapshot and can be synced into core products.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {user.isSuperAdmin ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Product Code">
                    <Input
                      value={values.itemCode}
                      disabled={Boolean(editingId)}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, itemCode: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Product Name">
                    <Input
                      value={values.itemName}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, itemName: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Product Group">
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      value={values.itemGroup}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, itemGroup: event.target.value }))
                      }
                    >
                      <option value="">Select product group</option>
                      {itemGroupOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Stock UOM">
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      value={values.stockUom}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, stockUom: event.target.value }))
                      }
                    >
                      <option value="">Select UOM</option>
                      {stockUomOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Brand">
                    <Input
                      value={values.brand}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, brand: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="GST HSN Code">
                    <Input
                      value={values.gstHsnCode}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, gstHsnCode: event.target.value }))
                      }
                    />
                  </Field>
                  <Field
                    label="Default Warehouse"
                    hint={
                      references?.defaults.company
                        ? `Default company: ${references.defaults.company}`
                        : undefined
                    }
                  >
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      value={values.defaultWarehouse}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, defaultWarehouse: event.target.value }))
                      }
                    >
                      <option value="">No default warehouse</option>
                      {warehouseOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea
                    value={values.description}
                    className="min-h-36"
                    onChange={(event) =>
                      setValues((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                </Field>
                <div className="grid gap-3 border-t pt-4 text-sm md:grid-cols-2">
                  <label className="flex items-center gap-3">
                    <NativeCheckbox
                      checked={!values.disabled}
                      onChange={(checked) => setValues((current) => ({ ...current, disabled: !checked }))}
                    />
                    <span className="text-muted-foreground">Product is active</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <NativeCheckbox
                      checked={values.isStockItem}
                      onChange={(checked) =>
                        setValues((current) => ({ ...current, isStockItem: checked }))
                      }
                    />
                    <span className="text-muted-foreground">Product is a stock item</span>
                  </label>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Only the super-admin actor can create or update Frappe product snapshots.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSaving || !user.isSuperAdmin}
            >
              {isSaving ? "Saving..." : editingId ? "Save Product" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
