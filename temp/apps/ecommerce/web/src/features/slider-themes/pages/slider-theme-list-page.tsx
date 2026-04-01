import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EditIcon, MoreHorizontalIcon, PowerIcon } from 'lucide-react'
import { CommonList } from '@/components/forms/CommonList'
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
  resolveSliderThemeStyles,
  toSliderThemeRecord,
  type SliderThemeRecord,
} from '@/features/store/lib/slider-theme'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load slider themes.'
}

export function SliderThemeListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<SliderThemeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const records = await listCommonModuleItems('sliderThemes', true)
        if (!cancelled) {
          setItems(
            records
              .map(toSliderThemeRecord)
              .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)),
          )
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
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [item.name, item.code, item.addToCartLabel, item.viewDetailsLabel]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch))
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.isActive) ||
        (statusFilter === 'inactive' && !item.isActive)

      return matchesSearch && matchesStatus
    })
  }, [items, searchValue, statusFilter])

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  async function handleToggleActive(item: SliderThemeRecord) {
    setErrorMessage(null)

    try {
      if (item.isActive) {
        await deactivateCommonModuleItem('sliderThemes', item.id)
      } else {
        await restoreCommonModuleItem('sliderThemes', item.id)
      }

      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, isActive: !entry.isActive } : entry)),
      )
      showStatusChangeToast({
        entityLabel: 'slider theme',
        recordName: item.name,
        referenceId: item.id,
        action: item.isActive ? 'deactivate' : 'restore',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'slider theme',
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
          pageTitle: 'Slider Themes',
          pageDescription: 'Manage hero-slider gradients, CTA labels, button contrast, navigation tone, and adaptive text color from a dedicated master list.',
          addLabel: 'New Slider Theme',
          onAddClick: () => {
            void navigate('/admin/dashboard/slider-themes/new')
          },
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: 'Search slider themes',
        }}
        filters={{
          buttonLabel: 'Theme filters',
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
          ],
          activeFilters:
            statusFilter === 'all'
              ? []
              : [{ key: 'status', label: 'Status', value: statusFilter === 'active' ? 'Active' : 'Inactive' }],
          onRemoveFilter: () => {
            setStatusFilter('all')
          },
          onClearAllFilters: () => {
            setStatusFilter('all')
            setCurrentPage(1)
          },
        }}
        table={{
          columns: [
            {
              id: 'serial',
              header: 'Sl.No',
              cell: (item) =>
                (safeCurrentPage - 1) * pageSize + paginatedItems.findIndex((entry) => entry.id === item.id) + 1,
              className: 'w-12 min-w-12 px-2 text-center',
              headerClassName: 'w-12 min-w-12 px-2 text-center',
              sticky: 'left',
            },
            {
              id: 'name',
              header: 'Theme',
              sortable: true,
              accessor: (item) => item.name,
              cell: (item) => (
                <div>
                  <Link
                    to={`/admin/dashboard/slider-themes/${item.id}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="font-mono text-xs text-muted-foreground">{item.code}</p>
                </div>
              ),
            },
            {
              id: 'gradient',
              header: 'Gradient',
              cell: (item) => (
                <div className="space-y-2">
                  <div
                    className="h-10 w-36 rounded-full border border-border/60"
                    style={{ background: resolveSliderThemeStyles(item).background }}
                  />
                  <div className="flex flex-wrap gap-1 font-mono text-[11px] text-muted-foreground">
                    <span>{item.backgroundFrom}</span>
                    <span>{item.backgroundVia}</span>
                    <span>{item.backgroundTo}</span>
                  </div>
                </div>
              ),
            },
            {
              id: 'cta',
              header: 'CTA Labels',
              cell: (item) => (
                <div className="space-y-1 text-sm">
                  <p className="text-foreground">{item.addToCartLabel ?? 'Add to cart'}</p>
                  <p className="text-muted-foreground">{item.viewDetailsLabel ?? 'View details'}</p>
                </div>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              defaultVisible: false,
              cell: (item) => (
                <div className="flex items-center gap-2">
                  <ActiveStatusBadge isActive={item.isActive} />
                  <span className="text-xs text-muted-foreground">Order {item.sortOrder}</span>
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
                        <Link to={`/admin/dashboard/slider-themes/${item.id}`}>
                          <span>Open</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/dashboard/slider-themes/${item.id}/edit`}>
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
          loadingMessage: 'Loading slider themes...',
          emptyMessage: errorMessage ?? 'No slider themes found.',
          rowKey: (item) => item.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Total records: <span className="font-medium text-foreground">{totalRecords}</span>
              </span>
              <span>
                Active records:{' '}
                <span className="font-medium text-foreground">
                  {filteredItems.filter((item) => item.isActive).length}
                </span>
              </span>
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
