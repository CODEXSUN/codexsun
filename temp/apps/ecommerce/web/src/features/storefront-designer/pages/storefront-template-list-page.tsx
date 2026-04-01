import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EditIcon, MoreHorizontalIcon, PowerIcon } from 'lucide-react'
import { CommonList } from '@/components/forms/CommonList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ActiveStatusBadge } from '@/components/ui/status-badge'
import {
  deactivateCommonModuleItem,
  HttpError,
  listCommonModuleItems,
  restoreCommonModuleItem,
} from '@/shared/api/client'
import { showFailedActionToast, showStatusChangeToast } from '@/shared/notifications/toast'
import {
  formatStorefrontTemplateTheme,
  getStorefrontTemplateSlotMeta,
  toStorefrontTemplateRecord,
  type StorefrontTemplateRecord,
} from '../lib/storefront-template'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load storefront design templates.'
}

export function StorefrontTemplateListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<StorefrontTemplateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [kindFilter, setKindFilter] = useState<'all' | 'home' | 'trust'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const records = await listCommonModuleItems('storefrontTemplates', true)
        if (!cancelled) {
          setItems(records.map(toStorefrontTemplateRecord).sort((left, right) => left.sort_order - right.sort_order))
        }
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

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return items.filter((item) => {
      const slotMeta = getStorefrontTemplateSlotMeta(item.code)
      const matchesSearch =
        normalizedSearch.length === 0
        || [
          item.name,
          item.code,
          item.title,
          item.description,
          item.badge_text,
          item.cta_primary_label,
          item.cta_secondary_label,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch))
      const matchesStatus =
        statusFilter === 'all'
        || (statusFilter === 'active' && item.isActive)
        || (statusFilter === 'inactive' && !item.isActive)
      const matchesKind =
        kindFilter === 'all'
        || (kindFilter === 'home' && slotMeta.kind === 'Home section')
        || (kindFilter === 'trust' && slotMeta.kind === 'Trust note')

      return matchesSearch && matchesStatus && matchesKind
    })
  }, [items, kindFilter, searchValue, statusFilter])

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  async function handleToggleActive(item: StorefrontTemplateRecord) {
    setErrorMessage(null)

    try {
      if (item.isActive) {
        await deactivateCommonModuleItem('storefrontTemplates', item.id)
      } else {
        await restoreCommonModuleItem('storefrontTemplates', item.id)
      }

      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, isActive: !entry.isActive } : entry)),
      )
      showStatusChangeToast({
        entityLabel: 'storefront template',
        recordName: item.name,
        referenceId: item.id,
        action: item.isActive ? 'deactivate' : 'restore',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'storefront template',
        action: item.isActive ? 'deactivate' : 'restore',
        detail: message,
      })
    }
  }

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <CommonList
        header={{
          pageTitle: 'Storefront Design Templates',
          pageDescription: 'Curate storefront home-page sections, trust notes, and CTA copy with dedicated records instead of hardcoded content.',
          addLabel: 'New Template',
          onAddClick: () => {
            void navigate('/admin/dashboard/storefront-designer/new')
          },
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: 'Search storefront templates',
        }}
        filters={{
          buttonLabel: 'Template filters',
          options: [
            {
              key: 'active',
              label: 'Active only',
              isActive: statusFilter === 'active',
              onSelect: () => {
                setStatusFilter('active')
                setCurrentPage(1)
              },
              onCheckedChange: (checked) => {
                setStatusFilter(checked ? 'active' : 'all')
                setCurrentPage(1)
              },
            },
            {
              key: 'inactive',
              label: 'Inactive only',
              isActive: statusFilter === 'inactive',
              onSelect: () => {
                setStatusFilter('inactive')
                setCurrentPage(1)
              },
              onCheckedChange: (checked) => {
                setStatusFilter(checked ? 'inactive' : 'all')
                setCurrentPage(1)
              },
            },
            {
              key: 'home',
              label: 'Home sections',
              isActive: kindFilter === 'home',
              onSelect: () => {
                setKindFilter('home')
                setCurrentPage(1)
              },
              onCheckedChange: (checked) => {
                setKindFilter(checked ? 'home' : 'all')
                setCurrentPage(1)
              },
            },
            {
              key: 'trust',
              label: 'Trust notes',
              isActive: kindFilter === 'trust',
              onSelect: () => {
                setKindFilter('trust')
                setCurrentPage(1)
              },
              onCheckedChange: (checked) => {
                setKindFilter(checked ? 'trust' : 'all')
                setCurrentPage(1)
              },
            },
          ],
          activeFilters: [
            ...(statusFilter === 'all'
              ? []
              : [{ key: 'status', label: 'Status', value: statusFilter === 'active' ? 'Active' : 'Inactive' }]),
            ...(kindFilter === 'all'
              ? []
              : [{ key: 'kind', label: 'Section', value: kindFilter === 'home' ? 'Home section' : 'Trust note' }]),
          ],
          onRemoveFilter: (key) => {
            if (key === 'status') {
              setStatusFilter('all')
            }
            if (key === 'kind') {
              setKindFilter('all')
            }
          },
          onClearAllFilters: () => {
            setStatusFilter('all')
            setKindFilter('all')
            setCurrentPage(1)
          },
        }}
        table={{
          columns: [
            {
              id: 'serial',
              header: 'Sl.No',
              cell: (item) => ((safeCurrentPage - 1) * pageSize) + paginatedItems.findIndex((entry) => entry.id === item.id) + 1,
              className: 'w-12 min-w-12 px-2 text-center',
              headerClassName: 'w-12 min-w-12 px-2 text-center',
              sticky: 'left',
            },
            {
              id: 'name',
              header: 'Template',
              sortable: true,
              accessor: (item) => item.name,
              cell: (item) => {
                const slotMeta = getStorefrontTemplateSlotMeta(item.code)
                return (
                  <div>
                    <Link
                      to={`/admin/dashboard/storefront-designer/${item.id}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{slotMeta.label}</p>
                  </div>
                )
              },
            },
            {
              id: 'code',
              header: 'Code',
              sortable: true,
              accessor: (item) => item.code,
              cell: (item) => <span className="font-mono text-xs text-foreground">{item.code}</span>,
            },
            {
              id: 'copy',
              header: 'Section Copy',
              accessor: (item) => item.title,
              cell: (item) => (
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.description ?? 'No description configured.'}</p>
                </div>
              ),
            },
            {
              id: 'theme',
              header: 'Theme',
              accessor: (item) => item.theme_key ?? '',
              defaultVisible: false,
              cell: (item) => (
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{formatStorefrontTemplateTheme(item.theme_key)}</Badge>
                  <Badge variant="secondary">{getStorefrontTemplateSlotMeta(item.code).kind}</Badge>
                </div>
              ),
            },
            {
              id: 'actions-copy',
              header: 'CTA',
              defaultVisible: false,
              cell: (item) =>
                item.cta_primary_label || item.cta_secondary_label ? (
                  <div className="space-y-1 text-sm">
                    {item.cta_primary_label ? <p className="text-foreground">{item.cta_primary_label}</p> : null}
                    {item.cta_secondary_label ? <p className="text-muted-foreground">{item.cta_secondary_label}</p> : null}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No CTA</span>
                ),
            },
            {
              id: 'status',
              header: 'Status',
              accessor: (item) => item.isActive,
              defaultVisible: false,
              cell: (item) => (
                <div className="flex items-center gap-2">
                  <ActiveStatusBadge isActive={item.isActive} />
                  <span className="text-xs text-muted-foreground">Order {item.sort_order}</span>
                </div>
              ),
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
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/dashboard/storefront-designer/${item.id}`}>
                          <span>Open</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/dashboard/storefront-designer/${item.id}/edit`}>
                          <EditIcon className="size-4" />
                          <span>Edit</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void handleToggleActive(item)}>
                        <PowerIcon className="size-4" />
                        <span>{item.isActive ? 'Deactivate' : 'Restore'}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ),
            },
          ],
          data: paginatedItems,
          loading,
          loadingMessage: 'Loading storefront design templates...',
          emptyMessage: errorMessage ?? 'No storefront design templates found.',
          rowKey: (item) => item.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>Total records: <span className="font-medium text-foreground">{totalRecords}</span></span>
              <span>Active records: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.isActive).length}</span></span>
              <span>Trust notes: <span className="font-medium text-foreground">{filteredItems.filter((item) => getStorefrontTemplateSlotMeta(item.code).kind === 'Trust note').length}</span></span>
            </div>
          ),
        }}
        pagination={{
          currentPage: safeCurrentPage,
          pageSize,
          totalRecords,
          onPageChange: setCurrentPage,
          onPageSizeChange: (value) => {
            setPageSize(value)
            setCurrentPage(1)
          },
        }}
      />
    </div>
  )
}

