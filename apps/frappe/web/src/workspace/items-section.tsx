import { useEffect, useMemo, useState } from "react"

import type { FrappeItem, FrappeItemManager, FrappeItemProductSyncLog, FrappeItemUpsertPayload } from "@frappe/shared"
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
import { Textarea } from "@/components/ui/textarea"
import { useDashboardShell } from "@/features/dashboard/dashboard-shell"

import {
  createFrappeItem,
  listFrappeItems,
  listFrappeItemSyncLogs,
  syncFrappeItemsToProducts,
  updateFrappeItem,
} from "../api/frappe-api"
import {
  createDefaultItemValues,
  Field,
  MetricCard,
  NativeCheckbox,
  SectionShell,
  StateCard,
  formatDateTime,
  getActiveOptions,
  getLeafOptions,
  toErrorMessage,
} from "./shared"

export function FrappeItemsSection() {
  const { user } = useDashboardShell()
  const [items, setItems] = useState<FrappeItem[]>([])
  const [references, setReferences] =
    useState<FrappeItemManager["references"] | null>(null)
  const [logs, setLogs] = useState<FrappeItemProductSyncLog[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [duplicateMode, setDuplicateMode] = useState<"overwrite" | "skip">(
    "overwrite"
  )
  const [values, setValues] = useState<FrappeItemUpsertPayload>(
    createDefaultItemValues(null)
  )
  const [lastSyncedAt, setLastSyncedAt] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  async function loadItemsAndLogs() {
    setIsLoading(true)
    setError(null)

    try {
      const [itemResponse, logResponse] = await Promise.all([
        listFrappeItems(),
        listFrappeItemSyncLogs(),
      ])

      setItems(itemResponse.manager.items)
      setReferences(itemResponse.manager.references)
      setLogs(logResponse.manager.items)
      setLastSyncedAt(itemResponse.manager.syncedAt)
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadItemsAndLogs()
  }, [])

  useEffect(() => {
    if (!editingId) {
      setValues(createDefaultItemValues(references))
    }
  }, [editingId, references])

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
        item.syncedProductName,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    )
  }, [items, searchValue])

  function resetForm() {
    setEditingId(null)
    setValues(createDefaultItemValues(references))
  }

  function toggleSelected(itemId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? [...new Set([...current, itemId])]
        : current.filter((value) => value !== itemId)
    )
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
      await loadItemsAndLogs()
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSyncSelected() {
    if (selectedIds.length === 0) {
      setError("Select one or more Frappe items before syncing.")
      return
    }

    setIsSyncing(true)
    setError(null)

    try {
      await syncFrappeItemsToProducts({
        itemIds: selectedIds,
        duplicateMode,
      })
      setSelectedIds([])
      await loadItemsAndLogs()
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return <StateCard message="Loading Frappe item manager." />
  }

  const syncedCount = items.filter((item) => item.isSyncedToProduct).length
  const variantCount = items.filter((item) => item.hasVariants).length
  const itemGroupOptions = references ? getLeafOptions(references.itemGroups) : []
  const stockUomOptions = references ? getActiveOptions(references.stockUoms) : []
  const warehouseOptions = references ? getLeafOptions(references.warehouses) : []

  return (
    <SectionShell
      title="Item Manager"
      description="Review Frappe item snapshots, maintain local edits, and sync selected records into ecommerce product ownership."
      actions={(
        <>
          <Button variant="outline" onClick={() => void loadItemsAndLogs()}>
            Refresh
          </Button>
          {user.isSuperAdmin ? (
            <>
              <Button variant="outline" onClick={resetForm}>
                New Item
              </Button>
              <Button onClick={() => void handleSyncSelected()} disabled={isSyncing}>
                {isSyncing ? "Syncing..." : "Sync selected"}
              </Button>
            </>
          ) : null}
        </>
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Items"
          value={items.length}
          hint="Frappe item snapshots stored in the app-owned database."
        />
        <MetricCard
          label="Synced"
          value={syncedCount}
          hint="Items already linked to ecommerce product records."
        />
        <MetricCard
          label="Variants"
          value={variantCount}
          hint="Items marked as variant-capable in the connector snapshot."
        />
        <MetricCard
          label="Logs"
          value={logs.length}
          hint={`Latest item sync refresh: ${lastSyncedAt ? formatDateTime(lastSyncedAt) : "Pending"}.`}
        />
      </div>

      {error ? <StateCard message={error} /> : null}

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Item Snapshots</CardTitle>
            <CardDescription>
              Search, inspect, and select Frappe items for ecommerce synchronization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search item code, name, group, brand, or linked product"
              />
              <select
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={duplicateMode}
                onChange={(event) =>
                  setDuplicateMode(event.target.value as "overwrite" | "skip")
                }
              >
                <option value="overwrite">Overwrite duplicates</option>
                <option value="skip">Skip duplicates</option>
              </select>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">Selected {selectedIds.length}</Badge>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  {user.isSuperAdmin ? <TableHead>Select</TableHead> : null}
                  <TableHead>Item</TableHead>
                  <TableHead>Grouping</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Product Link</TableHead>
                  <TableHead>Modified</TableHead>
                  {user.isSuperAdmin ? <TableHead>Action</TableHead> : null}
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
                        <p className="font-medium text-foreground">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">{item.itemCode}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <p>{item.itemGroup || "No group"}</p>
                      <p>{item.brand || "No brand"}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={item.disabled ? "outline" : "default"}>
                          {item.disabled ? "Disabled" : "Active"}
                        </Badge>
                        {item.hasVariants ? <Badge variant="outline">Variants</Badge> : null}
                        {item.isStockItem ? <Badge variant="outline">Stock</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.isSyncedToProduct ? (
                        <div>
                          <p className="font-medium text-foreground">
                            {item.syncedProductName}
                          </p>
                          <p>{item.syncedProductSlug || item.syncedProductId}</p>
                        </div>
                      ) : (
                        "Not linked"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(item.modifiedAt)}
                    </TableCell>
                    {user.isSuperAdmin ? (
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                          Edit
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Item" : "Create Item"}</CardTitle>
            <CardDescription>
              Super-admin only. Item changes stay inside the Frappe app before they are projected into ecommerce.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {user.isSuperAdmin ? (
              <>
                <Field label="Item Code">
                  <Input
                    value={values.itemCode}
                    disabled={Boolean(editingId)}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, itemCode: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Item Name">
                  <Input
                    value={values.itemName}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, itemName: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Item Group">
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    value={values.itemGroup}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, itemGroup: event.target.value }))
                    }
                  >
                    <option value="">Select item group</option>
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
                <Field label="Default Warehouse" hint={references?.defaults.company ? `Default company: ${references.defaults.company}` : undefined}>
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
                <Field label="Description">
                  <Textarea
                    value={values.description}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                </Field>
                <div className="grid gap-3 text-sm">
                  <label className="flex items-center gap-3">
                    <NativeCheckbox
                      checked={!values.disabled}
                      onChange={(checked) =>
                        setValues((current) => ({ ...current, disabled: !checked }))
                      }
                    />
                    <span className="text-muted-foreground">Item is active</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <NativeCheckbox
                      checked={values.isStockItem}
                      onChange={(checked) =>
                        setValues((current) => ({ ...current, isStockItem: checked }))
                      }
                    />
                    <span className="text-muted-foreground">Item is a stock item</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={resetForm} disabled={isSaving}>
                    Reset
                  </Button>
                  <Button onClick={() => void handleSubmit()} disabled={isSaving}>
                    {isSaving ? "Saving..." : editingId ? "Save Item" : "Create Item"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Only the super-admin actor can create or update item snapshots.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Logs</CardTitle>
          <CardDescription>
            Latest item-to-product projection runs owned by the Frappe connector.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {logs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-border/70 bg-card/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">{formatDateTime(log.syncedAt)}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{log.duplicateMode}</Badge>
                  <Badge variant="outline">Success {log.successCount}</Badge>
                  <Badge variant="outline">Skipped {log.skippedCount}</Badge>
                  <Badge variant="outline">Failed {log.failureCount}</Badge>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{log.summary}</p>
            </div>
          ))}
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sync runs recorded yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </SectionShell>
  )
}
