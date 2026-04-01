import type { ProductSummary } from '@shared/index'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EditIcon, ImageIcon, Trash2 } from 'lucide-react'
import { AnimatedTabs, type AnimatedContentTab } from '@/components/ui/animated-tabs'
import { ActiveStatusBadge, StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EntityDetailHeader, formatDetailValue } from '@/components/entity/entity-detail'
import {
  deactivateCommonModuleItem,
  getCommonModuleItem,
  HttpError,
  listProducts,
  restoreCommonModuleItem,
} from '@/shared/api/client'
import { showFailedActionToast, showStatusChangeToast } from '@/shared/notifications/toast'
import { toProductCategoryRecord, type ProductCategoryRecord } from '../lib/product-category'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load product category.'
}

function OverviewRow({ label, value }: { label: string; value: string | ReactNode }) {
  return (
    <tr className="border-b border-border/60 last:border-b-0">
      <th className="w-[188px] border-r border-border/70 px-3 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </th>
      <td className="px-4 py-3 text-sm text-foreground">{value}</td>
    </tr>
  )
}

export function ProductCategoryShowPage() {
  const navigate = useNavigate()
  const { categoryId } = useParams()
  const [item, setItem] = useState<ProductCategoryRecord | null>(null)
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!categoryId) return
    const resolvedCategoryId = categoryId

    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const [record, productItems] = await Promise.all([
          getCommonModuleItem('productCategories', resolvedCategoryId),
          listProducts(),
        ])

        if (cancelled) return

        setItem(toProductCategoryRecord(record))
        setProducts(productItems.filter((product) => product.categoryId === resolvedCategoryId))
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

    void load()
    return () => {
      cancelled = true
    }
  }, [categoryId])

  async function handleDeactivate() {
    if (!item || !window.confirm(`Deactivate ${item.name}?`)) return

    setProcessing(true)
    setErrorMessage(null)

    try {
      await deactivateCommonModuleItem('productCategories', item.id)
      setItem((current) => (current ? { ...current, isActive: false } : current))
      showStatusChangeToast({
        entityLabel: 'product category',
        recordName: item.name,
        referenceId: item.id,
        action: 'deactivate',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'product category',
        action: 'deactivate',
        detail: message,
      })
    } finally {
      setProcessing(false)
    }
  }

  async function handleDelete() {
    if (!item || !window.confirm(`Delete ${item.name}? This uses the current soft-delete flow.`)) return

    setProcessing(true)
    setErrorMessage(null)

    try {
      await deactivateCommonModuleItem('productCategories', item.id)
      showStatusChangeToast({
        entityLabel: 'product category',
        recordName: item.name,
        referenceId: item.id,
        action: 'deactivate',
      })
      void navigate('/admin/dashboard/product-categories')
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'product category',
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
      await restoreCommonModuleItem('productCategories', item.id)
      setItem((current) => (current ? { ...current, isActive: true } : current))
      showStatusChangeToast({
        entityLabel: 'product category',
        recordName: item.name,
        referenceId: item.id,
        action: 'restore',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'product category',
        action: 'restore',
        detail: message,
      })
    } finally {
      setProcessing(false)
    }
  }

  const activeProducts = useMemo(() => products.filter((product) => product.isActive), [products])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Loading product category...</CardContent>
      </Card>
    )
  }

  if (!item) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-destructive">{errorMessage ?? 'Product category not found.'}</CardContent>
      </Card>
    )
  }

  const overviewTab: AnimatedContentTab = {
    label: 'Overview',
    value: 'overview',
    content: (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_320px]">
        <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
          <table className="w-full border-collapse">
            <tbody>
              <OverviewRow label="Code" value={item.code} />
              <OverviewRow label="Name" value={item.name} />
              <OverviewRow label="Description" value={formatDetailValue(item.description)} />
              <OverviewRow label="Position Order" value={String(item.positionOrder)} />
              <OverviewRow label="Status" value={<ActiveStatusBadge isActive={item.isActive} />} />
              <OverviewRow label="Created" value={new Date(item.createdAt).toLocaleString()} />
              <OverviewRow label="Updated" value={new Date(item.updatedAt).toLocaleString()} />
            </tbody>
          </table>
        </div>
        <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Category Image</p>
          <div className="mt-3 overflow-hidden rounded-[1rem] border border-border/70 bg-muted/40">
            {item.image ? (
              <img src={item.image} alt={item.name} className="aspect-square w-full object-cover" />
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
    ),
  }

  const storefrontTab: AnimatedContentTab = {
    label: 'Storefront',
    value: 'storefront',
    content: (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
          <table className="w-full border-collapse">
            <tbody>
              <OverviewRow label="Top Menu" value={item.showInTopMenu ? 'Visible' : 'Hidden'} />
              <OverviewRow label="Catalog Section" value={item.showInCatalogSection ? 'Visible' : 'Hidden'} />
              <OverviewRow label="Placement" value={`Position ${item.positionOrder}`} />
            </tbody>
          </table>
        </div>
        <Card className="shadow-none">
          <CardContent className="flex h-full flex-col justify-center gap-3 p-5">
            <div className="flex flex-wrap gap-2">
              {item.showInTopMenu ? <StatusBadge tone="publishing">Top Menu</StatusBadge> : null}
              {item.showInCatalogSection ? <StatusBadge tone="featured">Catalog Section</StatusBadge> : null}
              {!item.showInTopMenu && !item.showInCatalogSection ? <StatusBadge tone="inactive">Hidden</StatusBadge> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              This category stays available for product assignments even if you hide it from one or both storefront placements.
            </p>
          </CardContent>
        </Card>
      </div>
    ),
  }

  const productsTab: AnimatedContentTab = {
    label: 'Products',
    value: 'products',
    content: (
      <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
        {products.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No products are linked to this category yet.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-muted/30">
              <tr className="border-b border-border/60">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Product</th>
                <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">SKU</th>
                <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Pricing</th>
                <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border/60 last:border-b-0">
                  <td className="px-4 py-3 text-sm">
                    <Link to={`/admin/dashboard/products/${product.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                      {product.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.productGroupName ?? 'No group'} · {product.productTypeName ?? 'No type'}
                    </p>
                  </td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{product.sku}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">
                    {product.basePrice.toFixed(2)}
                    <p className="text-xs text-muted-foreground">Cost {product.costPrice.toFixed(2)}</p>
                  </td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm">
                    <ActiveStatusBadge isActive={product.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    ),
  }

  return (
    <div className="space-y-6">
      <EntityDetailHeader
        backHref="/admin/dashboard/product-categories"
        backLabel="Back to product categories"
        title={item.name}
        description="Review category identity, storefront placement flags, and the linked product list."
        isActive={item.isActive}
        actions={(
          <>
            <Button variant="outline" asChild>
              <Link to={`/admin/dashboard/product-categories/${item.id}/edit`}>
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

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4 text-sm text-muted-foreground">Total linked products: <span className="font-medium text-foreground">{products.length}</span></CardContent></Card>
        <Card><CardContent className="p-4 text-sm text-muted-foreground">Active linked products: <span className="font-medium text-foreground">{activeProducts.length}</span></CardContent></Card>
        <Card><CardContent className="p-4 text-sm text-muted-foreground">Storefront position: <span className="font-medium text-foreground">{item.positionOrder}</span></CardContent></Card>
      </div>

      <AnimatedTabs defaultTabValue="overview" tabs={[overviewTab, storefrontTab, productsTab]} />
    </div>
  )
}
