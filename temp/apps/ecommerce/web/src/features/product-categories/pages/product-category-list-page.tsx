import type { ProductSummary } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EditIcon, MoreHorizontalIcon, PowerIcon, ShirtIcon } from 'lucide-react'
import { CommonList } from '@/components/forms/CommonList'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ActiveStatusBadge, StatusBadge } from '@/components/ui/status-badge'
import {
  deactivateCommonModuleItem,
  HttpError,
  listCommonModuleItems,
  listProducts,
  restoreCommonModuleItem,
} from '@/shared/api/client'
import { showFailedActionToast, showStatusChangeToast } from '@/shared/notifications/toast'
import { toProductCategoryRecord, type ProductCategoryRecord } from '../lib/product-category'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load product categories.'
}

export function ProductCategoryListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ProductCategoryRecord[]>([])
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [topMenuFilter, setTopMenuFilter] = useState(false)
  const [catalogFilter, setCatalogFilter] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const [categoryItems, productItems] = await Promise.all([
          listCommonModuleItems('productCategories', true),
          listProducts(),
        ])

        if (cancelled) {
          return
        }

        setItems(categoryItems.map(toProductCategoryRecord))
        setProducts(productItems)
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
  }, [])

  const productCountByCategoryId = useMemo(() => {
    const counts = new Map<string, number>()
    for (const product of products) {
      if (!product.categoryId) continue
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1)
    }
    return counts
  }, [products])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return items.filter((item) => {
      const matchesSearch = normalizedSearch.length === 0 || [
        item.name,
        item.code,
        item.description,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch))

      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && item.isActive)
        || (statusFilter === 'inactive' && !item.isActive)

      return matchesSearch
        && matchesStatus
        && (!topMenuFilter || item.showInTopMenu)
        && (!catalogFilter || item.showInCatalogSection)
    })
  }, [catalogFilter, items, searchValue, statusFilter, topMenuFilter])

  async function handleToggleActive(item: ProductCategoryRecord) {
    try {
      if (item.isActive) {
        await deactivateCommonModuleItem('productCategories', item.id)
      } else {
        await restoreCommonModuleItem('productCategories', item.id)
      }

      setItems((current) => current.map((entry) => (
        entry.id === item.id ? { ...entry, isActive: !entry.isActive } : entry
      )))
      showStatusChangeToast({
        entityLabel: 'product category',
        recordName: item.name,
        referenceId: item.id,
        action: item.isActive ? 'deactivate' : 'restore',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'product category',
        action: item.isActive ? 'deactivate' : 'restore',
        detail: message,
      })
    }
  }

  return (
    <div className="space-y-4">
      {errorMessage ? <Card><CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent></Card> : null}

      <CommonList
        header={{
          pageTitle: 'Product Categories',
          pageDescription: 'Manage category identity, storefront placement flags, and display order for the navigation rail and category section.',
          addLabel: 'New Product Category',
          onAddClick: () => { void navigate('/admin/dashboard/product-categories/new') },
        }}
        search={{
          value: searchValue,
          onChange: setSearchValue,
          placeholder: 'Search product categories',
        }}
        filters={{
          buttonLabel: 'Category filters',
          options: [
            { key: 'all', label: 'All categories', isActive: statusFilter === 'all', onSelect: () => setStatusFilter('all'), onCheckedChange: () => setStatusFilter('all') },
            { key: 'active', label: 'Active only', isActive: statusFilter === 'active', onSelect: () => setStatusFilter('active'), onCheckedChange: (checked) => setStatusFilter(checked ? 'active' : 'all') },
            { key: 'inactive', label: 'Inactive only', isActive: statusFilter === 'inactive', onSelect: () => setStatusFilter('inactive'), onCheckedChange: (checked) => setStatusFilter(checked ? 'inactive' : 'all') },
            { key: 'top-menu', label: 'Storefront top menu', isActive: topMenuFilter, onSelect: () => setTopMenuFilter((current) => !current), onCheckedChange: setTopMenuFilter },
            { key: 'catalog', label: 'Storefront catalog section', isActive: catalogFilter, onSelect: () => setCatalogFilter((current) => !current), onCheckedChange: setCatalogFilter },
          ],
          activeFilters: [
            ...(statusFilter === 'all' ? [] : [{ key: 'status', label: 'Status', value: statusFilter === 'active' ? 'Active' : 'Inactive' }]),
            ...(topMenuFilter ? [{ key: 'top-menu', label: 'Storefront', value: 'Top menu' }] : []),
            ...(catalogFilter ? [{ key: 'catalog', label: 'Storefront', value: 'Catalog section' }] : []),
          ],
          onRemoveFilter: (key) => {
            if (key === 'status') setStatusFilter('all')
            if (key === 'top-menu') setTopMenuFilter(false)
            if (key === 'catalog') setCatalogFilter(false)
          },
          onClearAllFilters: () => {
            setStatusFilter('all')
            setTopMenuFilter(false)
            setCatalogFilter(false)
          },
        }}
        table={{
          columns: [
            {
              id: 'name',
              header: 'Category',
              sortable: true,
              accessor: (item) => item.name,
              className: 'min-w-0 max-w-[28rem]',
              cell: (item) => (
                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-muted/40">
                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" decoding="async" /> : <ShirtIcon className="size-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <Link to={`/admin/dashboard/product-categories/${item.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">Code: {item.code} · Position: {item.positionOrder}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{item.description ?? 'No description'}</p>
                  </div>
                </div>
              ),
            },
            {
              id: 'storefront',
              header: 'Storefront',
              cell: (item) => (
                <div className="flex flex-wrap gap-1.5">
                  {item.showInTopMenu ? <StatusBadge tone="publishing">Top Menu</StatusBadge> : null}
                  {item.showInCatalogSection ? <StatusBadge tone="featured">Catalog Section</StatusBadge> : null}
                  {!item.showInTopMenu && !item.showInCatalogSection ? <span className="text-sm text-muted-foreground">Hidden</span> : null}
                </div>
              ),
            },
            {
              id: 'products',
              header: 'Products',
              sortable: true,
              accessor: (item) => productCountByCategoryId.get(item.id) ?? 0,
              cell: (item) => (
                <div>
                  <p className="font-medium text-foreground">{productCountByCategoryId.get(item.id) ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Linked products</p>
                </div>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              sortable: true,
              accessor: (item) => item.isActive,
              cell: (item) => <ActiveStatusBadge isActive={item.isActive} />,
            },
            {
              id: 'actions',
              header: 'Actions',
              className: 'w-12 min-w-12 px-2 text-center',
              headerClassName: 'w-12 min-w-12 px-2 text-center',
              sticky: 'right',
              cell: (item) => (
                <div className="flex justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" size="icon-sm" variant="ghost">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild className="gap-2">
                        <Link to={`/admin/dashboard/product-categories/${item.id}/edit`}>
                          <EditIcon className="size-4" />
                          <span>Edit</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => void handleToggleActive(item)}>
                        <PowerIcon className="size-4" />
                        <span>{item.isActive ? 'Deactivate' : 'Restore'}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ),
            },
          ],
          data: filteredItems,
          loading,
          loadingMessage: 'Loading product categories...',
          emptyMessage: errorMessage ?? 'No product categories found.',
          rowKey: (item) => item.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>Total records: <span className="font-medium text-foreground">{filteredItems.length}</span></span>
              <span>Top menu: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.showInTopMenu).length}</span></span>
              <span>Catalog section: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.showInCatalogSection).length}</span></span>
            </div>
          ),
        }}
      />
    </div>
  )
}
