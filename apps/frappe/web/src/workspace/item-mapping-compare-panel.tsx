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

import { Field, NativeCheckbox, formatDateTime } from "./shared"

const storefrontDepartmentOptions = [
  { value: "", label: "No department" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "kids", label: "Kids" },
  { value: "accessories", label: "Accessories" },
]

function MappingText({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">{value || "-"}</p>
    </div>
  )
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

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <Card data-technical-name="card.frappe.items.compare-source">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base">Frappe Item</CardTitle>
              <p className="text-sm text-muted-foreground">
                Source snapshot from ERPNext before projection.
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Badge variant={item.disabled ? "outline" : "default"}>
                {item.disabled ? "Disabled" : "Active"}
              </Badge>
              {item.isSyncedToProduct ? (
                <Badge variant="secondary">Linked</Badge>
              ) : (
                <Badge variant="outline">Not linked</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <MappingText label="Item name" value={item.itemName} />
          <MappingText label="Item code" value={item.itemCode} />
          <MappingText label="Item group" value={item.itemGroup} />
          <MappingText label="Brand" value={item.brand} />
          <MappingText label="HSN" value={item.gstHsnCode} />
          <MappingText label="Warehouse" value={item.defaultWarehouse} />
          <div className="md:col-span-2">
            <MappingText label="Description" value={item.description} />
          </div>
          <MappingText label="Last modified" value={formatDateTime(item.modifiedAt)} />
          <MappingText
            label="Current core link"
            value={item.syncedProductName || item.syncedProductSlug || "No linked product"}
          />
        </CardContent>
      </Card>

      <Card data-technical-name="card.frappe.items.compare-target">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Core Product Mapping</CardTitle>
              <p className="text-sm text-muted-foreground">
                Save overrides here, then sync the selected item into core product.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Target core product">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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
            <Field label="Storefront department">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={value.storefrontDepartment ?? ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    storefrontDepartment: event.target.value || null,
                  })
                }
              >
                {storefrontDepartmentOptions.map((option) => (
                  <option key={option.value || "none"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
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
            <Field label="SKU">
              <Input
                value={value.sku}
                onChange={(event) => onChange({ ...value, sku: event.target.value })}
              />
            </Field>
            <Field label="Catalog badge">
              <Input
                value={value.catalogBadge}
                onChange={(event) =>
                  onChange({ ...value, catalogBadge: event.target.value })
                }
              />
            </Field>
            <Field label="Category">
              <Input
                value={value.categoryName}
                onChange={(event) =>
                  onChange({ ...value, categoryName: event.target.value })
                }
              />
            </Field>
            <Field label="Product group">
              <Input
                value={value.productGroupName}
                onChange={(event) =>
                  onChange({ ...value, productGroupName: event.target.value })
                }
              />
            </Field>
            <Field label="Brand">
              <Input
                value={value.brandName}
                onChange={(event) =>
                  onChange({ ...value, brandName: event.target.value })
                }
              />
            </Field>
            <Field label="HSN code">
              <Input
                value={value.hsnCodeId}
                onChange={(event) =>
                  onChange({ ...value, hsnCodeId: event.target.value })
                }
              />
            </Field>
            <Field label="Product type">
              <Input
                value={value.productTypeName}
                onChange={(event) =>
                  onChange({ ...value, productTypeName: event.target.value })
                }
              />
            </Field>
            <Field label="Tags" hint="Comma-separated tags added to the synced core product.">
              <Input
                value={value.tagNames.join(", ")}
                onChange={(event) =>
                  onChange({
                    ...value,
                    tagNames: event.target.value
                      .split(",")
                      .map((entry) => entry.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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

          <Field label="Operator notes">
            <Textarea
              rows={2}
              value={value.notes}
              onChange={(event) => onChange({ ...value, notes: event.target.value })}
            />
          </Field>

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
                <MappingText label="Name" value={draft.name} />
                <MappingText label="Slug" value={draft.slug} />
                <MappingText label="SKU" value={draft.sku} />
                <MappingText label="Badge" value={draft.catalogBadge ?? "-"} />
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
    </div>
  )
}
