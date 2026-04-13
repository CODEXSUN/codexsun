import { useEffect, useMemo, useState } from "react"

import type {
  FrappeItem,
  FrappeItemProductMappingResponse,
  FrappeItemProductMappingUpsertPayload,
} from "@frappe/shared"
import type { ProductSummary } from "@core/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { Field, NativeCheckbox } from "./shared"

const mappingFieldOptions = [
  { value: "productName", label: "Product name" },
  { value: "productSlug", label: "Slug" },
  { value: "sku", label: "SKU" },
  { value: "categoryName", label: "Category" },
  { value: "productGroupName", label: "Product group" },
  { value: "brandName", label: "Brand" },
  { value: "hsnCodeId", label: "HSN code" },
  { value: "productTypeName", label: "Product type" },
  { value: "shortDescription", label: "Short description" },
  { value: "catalogBadge", label: "Catalog badge" },
  { value: "shippingNote", label: "Shipping note" },
  { value: "storefrontDepartment", label: "Storefront department" },
] as const

const tableFieldClassName =
  "h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

type MappingFieldKey = (typeof mappingFieldOptions)[number]["value"]
type FrappeFieldKey =
  | "itemName"
  | "itemCode"
  | "itemGroup"
  | "brand"
  | "gstHsnCode"
  | "description"
  | "defaultWarehouse"
  | "departmentGuess"
  | "productTypeGuess"
  | "catalogBadgeDefault"
  | "shippingNoteDefault"

type MappingRowDefinition = {
  id: string
  coreKey: string
  defaultFrappeField: FrappeFieldKey
  defaultMappingField: MappingFieldKey
}

type MappingRowSelection = {
  frappeField: FrappeFieldKey
  mappingField: MappingFieldKey
}

const mappingRowDefinitions: MappingRowDefinition[] = [
  {
    id: "name",
    coreKey: "name",
    defaultFrappeField: "itemName",
    defaultMappingField: "productName",
  },
  {
    id: "slug",
    coreKey: "slug",
    defaultFrappeField: "itemName",
    defaultMappingField: "productSlug",
  },
  {
    id: "sku",
    coreKey: "sku",
    defaultFrappeField: "itemCode",
    defaultMappingField: "sku",
  },
  {
    id: "category",
    coreKey: "categoryName",
    defaultFrappeField: "itemGroup",
    defaultMappingField: "categoryName",
  },
  {
    id: "productGroup",
    coreKey: "productGroupName",
    defaultFrappeField: "itemGroup",
    defaultMappingField: "productGroupName",
  },
  {
    id: "brand",
    coreKey: "brandName",
    defaultFrappeField: "brand",
    defaultMappingField: "brandName",
  },
  {
    id: "hsn",
    coreKey: "hsnCodeId",
    defaultFrappeField: "gstHsnCode",
    defaultMappingField: "hsnCodeId",
  },
  {
    id: "productType",
    coreKey: "productTypeName",
    defaultFrappeField: "productTypeGuess",
    defaultMappingField: "productTypeName",
  },
  {
    id: "department",
    coreKey: "storefrontDepartment",
    defaultFrappeField: "departmentGuess",
    defaultMappingField: "storefrontDepartment",
  },
  {
    id: "badge",
    coreKey: "catalogBadge",
    defaultFrappeField: "catalogBadgeDefault",
    defaultMappingField: "catalogBadge",
  },
  {
    id: "shortDescription",
    coreKey: "shortDescription",
    defaultFrappeField: "itemName",
    defaultMappingField: "shortDescription",
  },
  {
    id: "shippingNote",
    coreKey: "shippingNote",
    defaultFrappeField: "shippingNoteDefault",
    defaultMappingField: "shippingNote",
  },
]

const frappeFieldOptions: Array<{ value: FrappeFieldKey; label: string }> = [
  { value: "itemName", label: "Item name" },
  { value: "itemCode", label: "Item code" },
  { value: "itemGroup", label: "Item group" },
  { value: "brand", label: "Brand" },
  { value: "gstHsnCode", label: "HSN code" },
  { value: "description", label: "Description" },
  { value: "defaultWarehouse", label: "Warehouse" },
  { value: "departmentGuess", label: "Department guess" },
  { value: "productTypeGuess", label: "Product type guess" },
  { value: "catalogBadgeDefault", label: "Catalog badge default" },
  { value: "shippingNoteDefault", label: "Shipping note default" },
]

function defaultRowSelections() {
  return mappingRowDefinitions.reduce<Record<string, MappingRowSelection>>(
    (current, row) => ({
      ...current,
      [row.id]: {
        frappeField: row.defaultFrappeField,
        mappingField: row.defaultMappingField,
      },
    }),
    {}
  )
}

function toDepartmentGuess(itemGroup: string) {
  const normalized = itemGroup.trim().toLowerCase()

  if (normalized === "shirts") {
    return "men"
  }

  if (normalized === "accessories") {
    return "accessories"
  }

  return ""
}

function getFrappeFieldValue(item: FrappeItem, field: FrappeFieldKey) {
  switch (field) {
    case "itemName":
      return item.itemName
    case "itemCode":
      return item.itemCode
    case "itemGroup":
      return item.itemGroup
    case "brand":
      return item.brand
    case "gstHsnCode":
      return item.gstHsnCode
    case "description":
      return item.description
    case "defaultWarehouse":
      return item.defaultWarehouse
    case "departmentGuess":
      return toDepartmentGuess(item.itemGroup)
    case "productTypeGuess":
      return item.isStockItem ? "Finished Good" : "Service"
    case "catalogBadgeDefault":
      return "ERP Synced"
    case "shippingNoteDefault":
      return "Projected from Frappe item snapshot."
  }
}

function normalizeMappingValue(mappingField: MappingFieldKey, rawValue: string) {
  if (mappingField === "storefrontDepartment") {
    const normalized = rawValue.trim().toLowerCase()

    if (
      normalized === "women" ||
      normalized === "men" ||
      normalized === "kids" ||
      normalized === "accessories"
    ) {
      return normalized
    }

    return null
  }

  return rawValue
}

function getMappingFieldValue(
  value: FrappeItemProductMappingUpsertPayload,
  field: MappingFieldKey
) {
  const rawValue = value[field]

  if (typeof rawValue === "string") {
    return rawValue
  }

  return rawValue ?? ""
}

type Props = {
  item: FrappeItem
  mappingResponse: FrappeItemProductMappingResponse | null
  value: FrappeItemProductMappingUpsertPayload
  coreProducts: ProductSummary[]
  isSaving: boolean
  isSyncing: boolean
  onChange: (nextValue: FrappeItemProductMappingUpsertPayload) => void
  onSave: () => void
  onSync: () => void
}

export function ItemMappingComparePanel({
  item,
  mappingResponse,
  value,
  coreProducts,
  isSaving,
  isSyncing,
  onChange,
  onSave,
  onSync,
}: Props) {
  const draft = mappingResponse?.draft ?? null
  const [rowSelections, setRowSelections] = useState(defaultRowSelections)
  const [rowActions, setRowActions] = useState<Record<string, string>>({})
  const [rowDefaultValues, setRowDefaultValues] = useState<Record<string, string>>({})

  useEffect(() => {
    setRowSelections(defaultRowSelections())
    setRowActions({})
    setRowDefaultValues({})
  }, [item.id])

  const rowPreview = useMemo(
    () =>
      mappingRowDefinitions.reduce<Record<string, string>>((current, row) => {
        const selected = rowSelections[row.id]
        const sourceValue = selected
          ? getFrappeFieldValue(item, selected.frappeField)
          : ""
        const mappedValue = selected
          ? getMappingFieldValue(value, selected.mappingField)
          : ""

        return {
          ...current,
          [row.id]: `${String(sourceValue || "-")} -> ${String(mappedValue || "-")}`,
        }
      }, {}),
    [item, rowSelections, value]
  )

  function applyRowAction(rowId: string, action: string) {
    setRowActions((current) => ({
      ...current,
      [rowId]: action,
    }))

    if (!action) {
      return
    }

    const selected = rowSelections[rowId]
    if (!selected) {
      return
    }

    if (action === "keep") {
      setRowActions((current) => ({ ...current, [rowId]: "" }))
      return
    }

    if (action === "copy") {
      const sourceValue = getFrappeFieldValue(item, selected.frappeField)
      onChange({
        ...value,
        [selected.mappingField]: normalizeMappingValue(
          selected.mappingField,
          sourceValue
        ),
      })
      setRowActions((current) => ({ ...current, [rowId]: "" }))
      return
    }

    if (action === "default") {
      const defaultValue = rowDefaultValues[rowId] ?? ""
      onChange({
        ...value,
        [selected.mappingField]: normalizeMappingValue(
          selected.mappingField,
          defaultValue
        ),
      })
      setRowActions((current) => ({ ...current, [rowId]: "" }))
      return
    }

    if (action === "clear") {
      onChange({
        ...value,
        [selected.mappingField]:
          selected.mappingField === "storefrontDepartment" ? null : "",
      })
      setRowActions((current) => ({ ...current, [rowId]: "" }))
    }
  }

  return (
    <Card data-technical-name="card.frappe.items.mapping-table">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Core Product Mapping Table</CardTitle>
            <p className="text-sm text-muted-foreground">
              Left is the core database key. Choose the Frappe source field, the product mapping
              target field, and the action to apply.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={item.disabled ? "outline" : "default"}>
              {item.disabled ? "Disabled" : "Active"}
            </Badge>
            {mappingResponse?.targetProduct ? (
              <Badge variant="secondary">
                Target: {mappingResponse.targetProduct.name}
              </Badge>
            ) : (
              <Badge variant="outline">Create new product</Badge>
            )}
            {draft?.catalogBadge ? (
              <Badge className="rounded-full px-3">{draft.catalogBadge}</Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Target core product">
            <select
              className={tableFieldClassName}
              value={value.targetProductId}
              onChange={(event) =>
                onChange({ ...value, targetProductId: event.target.value })
              }
            >
              <option value="">Create or match by code</option>
              {coreProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.code})
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Operator notes"
            hint="Keep free-form instructions outside the field mapping table."
          >
            <Textarea
              rows={2}
              value={value.notes}
              onChange={(event) => onChange({ ...value, notes: event.target.value })}
            />
          </Field>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full border-collapse text-sm" data-technical-name="table.frappe.item-mapping">
            <thead className="bg-muted/40">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-semibold text-foreground">Core key</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground">Frappe</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground">Product mapping</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground">Default value</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {mappingRowDefinitions.map((row) => {
                const selected = rowSelections[row.id]

                return (
                  <tr key={row.id} className="border-b border-border/70 align-top last:border-b-0">
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        <p className="font-mono text-xs text-foreground">{row.coreKey}</p>
                        <p className="text-xs text-muted-foreground">{rowPreview[row.id]}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        className={`${tableFieldClassName} min-w-[180px]`}
                        value={selected.frappeField}
                        onChange={(event) =>
                          setRowSelections((current) => ({
                            ...current,
                            [row.id]: {
                              ...current[row.id],
                              frappeField: event.target.value as FrappeFieldKey,
                            },
                          }))
                        }
                      >
                        {frappeFieldOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        className={`${tableFieldClassName} min-w-[180px]`}
                        value={selected.mappingField}
                        onChange={(event) =>
                          setRowSelections((current) => ({
                            ...current,
                            [row.id]: {
                              ...current[row.id],
                              mappingField: event.target.value as MappingFieldKey,
                            },
                          }))
                        }
                      >
                        {mappingFieldOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        className="min-w-[180px]"
                        value={rowDefaultValues[row.id] ?? ""}
                        onChange={(event) =>
                          setRowDefaultValues((current) => ({
                            ...current,
                            [row.id]: event.target.value,
                          }))
                        }
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        className={`${tableFieldClassName} min-w-[160px]`}
                        value={rowActions[row.id] ?? ""}
                        onChange={(event) => applyRowAction(row.id, event.target.value)}
                      >
                        <option value="">Choose action</option>
                        <option value="copy">Copy Frappe value</option>
                        <option value="default">Apply default value</option>
                        <option value="keep">Keep current mapping</option>
                        <option value="clear">Clear mapping value</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Product name">
            <Input
              value={value.productName}
              onChange={(event) =>
                onChange({ ...value, productName: event.target.value })
              }
            />
          </Field>
          <Field label="Slug">
            <Input
              value={value.productSlug}
              onChange={(event) =>
                onChange({ ...value, productSlug: event.target.value })
              }
            />
          </Field>
          <Field label="Short description">
            <Textarea
              rows={3}
              value={value.shortDescription}
              onChange={(event) =>
                onChange({ ...value, shortDescription: event.target.value })
              }
            />
          </Field>
          <Field label="Shipping note">
            <Textarea
              rows={3}
              value={value.shippingNote}
              onChange={(event) =>
                onChange({ ...value, shippingNote: event.target.value })
              }
            />
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <NativeCheckbox
              checked={value.isActive}
              onChange={(checked) => onChange({ ...value, isActive: checked })}
            />
            Active
          </label>
          <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <NativeCheckbox
              checked={value.isFeatured}
              onChange={(checked) => onChange({ ...value, isFeatured: checked })}
            />
            Featured
          </label>
          <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <NativeCheckbox
              checked={value.isNewArrival}
              onChange={(checked) => onChange({ ...value, isNewArrival: checked })}
            />
            New arrival
          </label>
          <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <NativeCheckbox
              checked={value.isBestSeller}
              onChange={(checked) => onChange({ ...value, isBestSeller: checked })}
            />
            Best seller
          </label>
          <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <NativeCheckbox
              checked={value.isFeaturedLabel}
              onChange={(checked) => onChange({ ...value, isFeaturedLabel: checked })}
            />
            Featured label
          </label>
        </div>

        {draft ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Resolved draft preview
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Name
                </p>
                <p className="text-sm text-foreground">{draft.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Slug
                </p>
                <p className="text-sm text-foreground">{draft.slug}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  SKU
                </p>
                <p className="text-sm text-foreground">{draft.sku}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Badge
                </p>
                <p className="text-sm text-foreground">{draft.catalogBadge ?? "-"}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            className="h-9"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Mapping"}
          </Button>
          <Button className="h-9" onClick={onSync} disabled={isSyncing}>
            {isSyncing ? "Syncing..." : "Sync to Core Product"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
