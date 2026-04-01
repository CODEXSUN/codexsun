import type { CommonModuleItem, Product } from '@shared/index'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EditIcon, ImageIcon, Trash2 } from 'lucide-react'
import { DetailSection, EntityDetailHeader, formatDetailValue } from '@/components/entity/entity-detail'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { deactivateProduct, getProduct, HttpError, listCommonModuleItems, restoreProduct } from '@/shared/api/client'
import { toLookupOption } from '@/shared/forms/common-lookup'
import { showFailedActionToast, showStatusChangeToast } from '@/shared/notifications/toast'

type ReferenceLabels = Record<string, string>

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load product.'
}

function toReferenceLabels(items: CommonModuleItem[]): ReferenceLabels {
  return items.reduce<ReferenceLabels>((labels, item) => {
    labels[String(item.id)] = toLookupOption(item).label
    return labels
  }, {})
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

export function ProductShowPage() {
  const navigate = useNavigate()
  const { productId } = useParams()
  const [item, setItem] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [referenceLabels, setReferenceLabels] = useState<ReferenceLabels>({})

  useEffect(() => {
    let cancelled = false

    async function loadProduct() {
      if (!productId) return
      setLoading(true)
      setErrorMessage(null)

      try {
        const [
          product,
          brandItems,
          categoryItems,
          productGroupItems,
          productTypeItems,
          unitItems,
          hsnItems,
          taxItems,
          styleItems,
        ] = await Promise.all([
          getProduct(productId),
          listCommonModuleItems('brands', false),
          listCommonModuleItems('productCategories', false),
          listCommonModuleItems('productGroups', false),
          listCommonModuleItems('productTypes', false),
          listCommonModuleItems('units', false),
          listCommonModuleItems('hsnCodes', false),
          listCommonModuleItems('taxes', false),
          listCommonModuleItems('styles', false),
        ])

        if (!cancelled) {
          setItem(product)
          setReferenceLabels({
            ...toReferenceLabels(brandItems),
            ...toReferenceLabels(categoryItems),
            ...toReferenceLabels(productGroupItems),
            ...toReferenceLabels(productTypeItems),
            ...toReferenceLabels(unitItems),
            ...toReferenceLabels(hsnItems),
            ...toReferenceLabels(taxItems),
            ...toReferenceLabels(styleItems),
          })
        }
      } catch (error) {
        if (!cancelled) setErrorMessage(toErrorMessage(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProduct()
    return () => {
      cancelled = true
    }
  }, [productId])

  function resolveReferenceLabel(value: string | null | undefined): string {
    if (!value) return formatDetailValue(value)
    return referenceLabels[value] ?? formatDetailValue(value)
  }

  async function handleDelete() {
    if (!item) return
    if (!window.confirm(`Delete ${item.name}? This uses the current soft-delete flow.`)) return

    setProcessing(true)
    setErrorMessage(null)

    try {
      await deactivateProduct(item.id)
      showStatusChangeToast({
        entityLabel: 'product',
        recordName: item.name,
        referenceId: item.id,
        action: 'deactivate',
      })
      void navigate('/admin/dashboard/products')
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'product',
        action: 'deactivate',
        detail: message,
      })
    } finally {
      setProcessing(false)
    }
  }

  async function handleDeactivate() {
    if (!item) return
    if (!window.confirm(`Deactivate ${item.name}?`)) return

    setProcessing(true)
    setErrorMessage(null)

    try {
      const inactive = await deactivateProduct(item.id)
      setItem(inactive)
      showStatusChangeToast({
        entityLabel: 'product',
        recordName: inactive.name,
        referenceId: inactive.id,
        action: 'deactivate',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'product',
        action: 'deactivate',
        detail: message,
      })
    } finally {
      setProcessing(false)
    }
  }

  async function handleRestore() {
    if (!item) return
    setProcessing(true)
    setErrorMessage(null)

    try {
      const restored = await restoreProduct(item.id)
      setItem(restored)
      showStatusChangeToast({
        entityLabel: 'product',
        recordName: restored.name,
        referenceId: restored.id,
        action: 'restore',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'product',
        action: 'restore',
        detail: message,
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Loading product...</CardContent>
      </Card>
    )
  }

  if (!item) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-destructive">{errorMessage ?? 'Product not found.'}</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <EntityDetailHeader
        backHref="/admin/dashboard/products"
        backLabel="Back to products"
        title={item.name}
        description="Review catalog identity, pricing, variants, stock structures, and publishing data."
        isActive={item.isActive}
        actions={(
          <>
            <Button variant="outline" asChild>
              <Link to={`/admin/dashboard/products/${item.id}/edit`}>
                <EditIcon className="size-4" />
                Edit
              </Link>
            </Button>
            {item.isActive ? (
              <>
                <Button variant="outline" onClick={() => void handleDeactivate()} disabled={processing}>
                  Deactivate
                </Button>
                <Button variant="destructive" onClick={() => void handleDelete()} disabled={processing}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => void handleRestore()} disabled={processing}>
                Restore
              </Button>
            )}
          </>
        )}
      />

      {errorMessage ? <Card><CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent></Card> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_300px]">
          <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
            <table className="w-full border-collapse">
              <tbody>
                <OverviewRow label="Slug" value={item.slug} />
                <OverviewRow label="SKU" value={item.sku} />
                <OverviewRow label="Brand" value={resolveReferenceLabel(item.brandId)} />
                <OverviewRow label="Category" value={resolveReferenceLabel(item.categoryId)} />
                <OverviewRow label="Product Group" value={resolveReferenceLabel(item.productGroupId)} />
                <OverviewRow label="Product Type" value={resolveReferenceLabel(item.productTypeId)} />
                <OverviewRow label="Unit" value={resolveReferenceLabel(item.unitId)} />
                <OverviewRow label="HSN Code" value={resolveReferenceLabel(item.hsnCodeId)} />
                <OverviewRow label="Style" value={resolveReferenceLabel(item.styleId)} />
                <OverviewRow label="Tax" value={resolveReferenceLabel(item.taxId)} />
                <OverviewRow label="Base Price" value={item.basePrice.toFixed(2)} />
                <OverviewRow label="Cost Price" value={item.costPrice.toFixed(2)} />
                <OverviewRow label="Short Description" value={formatDetailValue(item.shortDescription)} />
                <OverviewRow label="Description" value={formatDetailValue(item.description)} />
                <OverviewRow label="Variants Enabled" value={item.hasVariants ? 'Yes' : 'No'} />
                <OverviewRow label="Featured" value={item.isFeatured ? 'Yes' : 'No'} />
              </tbody>
            </table>
          </div>

          <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Primary Image</p>
            <div className="mt-3 overflow-hidden rounded-[1rem] border border-border/70 bg-muted/40">
              {item.primaryImageUrl ? (
                <img
                  src={item.primaryImageUrl}
                  alt={item.name}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <ImageIcon className="size-8" />
                    <p className="text-sm">No image available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>

      <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
        {item.variants.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No variants captured.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-muted/30">
              <tr className="border-b border-border/60">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Variant
                </th>
                <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  SKU
                </th>
                <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Price
                </th>
                <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Cost
                </th>
                <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Stock
                </th>
                <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Barcode
                </th>
              </tr>
            </thead>
            <tbody>
              {item.variants.map((variant) => (
                <tr key={variant.id} className="border-b border-border/60 last:border-b-0">
                  <td className="px-4 py-3 text-sm text-foreground">{variant.variantName}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{variant.sku}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{variant.price.toFixed(2)}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{variant.costPrice.toFixed(2)}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{variant.stockQuantity.toFixed(2)}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{formatDetailValue(variant.barcode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Commerce</CardTitle>
          <CardDescription>Commercial rows, SEO metadata, and publishing metadata.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
            <table className="w-full border-collapse">
              <tbody>
                <OverviewRow label="Price Rows" value={String(item.prices.length)} />
                <OverviewRow label="Discount Rows" value={String(item.discounts.length)} />
                <OverviewRow label="Offers" value={String(item.offers.length)} />
                <OverviewRow label="Images" value={String(item.images.length)} />
                <OverviewRow label="Tags" value={item.tags.map((tag) => tag.name).join(', ') || '-'} />
                <OverviewRow label="SEO Title" value={formatDetailValue(item.seo?.metaTitle)} />
                <OverviewRow label="SEO Description" value={formatDetailValue(item.seo?.metaDescription)} />
                <OverviewRow label="SEO Keywords" value={formatDetailValue(item.seo?.metaKeywords)} />
                <OverviewRow label="Reviews" value={String(item.reviews.length)} />
                <OverviewRow label="Updated" value={new Date(item.updatedAt).toLocaleString()} />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <DetailSection title="Inventory" description="Stock, attributes, and movement counts for operational review.">
        <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
          <table className="w-full border-collapse">
            <tbody>
              <OverviewRow label="Stock Items" value={String(item.stockItems.length)} />
              <OverviewRow label="Stock Movements" value={String(item.stockMovements.length)} />
              <OverviewRow label="Attributes" value={item.attributes.map((attribute) => attribute.name).join(', ') || '-'} />
              <OverviewRow label="Attribute Values" value={item.attributeValues.map((entry) => entry.value).join(', ') || '-'} />
            </tbody>
          </table>
        </div>
      </DetailSection>
    </div>
  )
}

