import type { MailboxTemplateSummary } from '@shared/index'
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
import { ActiveStatusBadge, StatusBadge } from '@/components/ui/status-badge'
import {
  deactivateMailboxTemplate,
  HttpError,
  listMailboxTemplates,
  restoreMailboxTemplate,
} from '@/shared/api/client'
import { showFailedActionToast, showStatusChangeToast } from '@/shared/notifications/toast'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load mailbox templates.'
}

export function MailboxTemplateListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<MailboxTemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [systemOnly, setSystemOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage(null)
      try {
        const templates = await listMailboxTemplates(true)
        if (!cancelled) {
          setItems(templates)
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
      const matchesSearch = normalizedSearch.length === 0 || [item.name, item.code, item.category, item.description].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch))
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && item.isActive) || (statusFilter === 'inactive' && !item.isActive)
      const matchesSystem = !systemOnly || item.isSystem
      return matchesSearch && matchesStatus && matchesSystem
    })
  }, [items, searchValue, statusFilter, systemOnly])

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  async function handleToggleActive(item: MailboxTemplateSummary) {
    setErrorMessage(null)
    try {
      const updated = item.isActive ? await deactivateMailboxTemplate(item.id) : await restoreMailboxTemplate(item.id)
      setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry))
      showStatusChangeToast({
        entityLabel: 'mail template',
        recordName: item.name,
        referenceId: item.id,
        action: item.isActive ? 'deactivate' : 'restore',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'mail template',
        action: item.isActive ? 'deactivate' : 'restore',
        detail: message,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2 px-3">
        <Button variant="outline" asChild>
          <Link to="/admin/dashboard/mailbox/messages">Back to mailbox</Link>
        </Button>
      </div>

      {errorMessage ? <Card><CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent></Card> : null}

      <CommonList
        header={{
          pageTitle: 'Mail Templates',
          pageDescription: 'Manage reusable transactional and manual compose templates used by OTP and other outgoing mail flows.',
          addLabel: 'New template',
          onAddClick: () => {
            void navigate('/admin/dashboard/mailbox/templates/new')
          },
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: 'Search templates',
        }}
        filters={{
          buttonLabel: 'Template filters',
          options: [
            {
              key: 'all',
              label: 'All templates',
              isActive: statusFilter === 'all',
              onSelect: () => { setStatusFilter('all'); setCurrentPage(1) },
              onCheckedChange: () => { setStatusFilter('all'); setCurrentPage(1) },
            },
            {
              key: 'active',
              label: 'Active only',
              isActive: statusFilter === 'active',
              onSelect: () => { setStatusFilter('active'); setCurrentPage(1) },
              onCheckedChange: (checked: boolean) => { setStatusFilter(checked ? 'active' : 'all'); setCurrentPage(1) },
            },
            {
              key: 'inactive',
              label: 'Inactive only',
              isActive: statusFilter === 'inactive',
              onSelect: () => { setStatusFilter('inactive'); setCurrentPage(1) },
              onCheckedChange: (checked: boolean) => { setStatusFilter(checked ? 'inactive' : 'all'); setCurrentPage(1) },
            },
            {
              key: 'systemOnly',
              label: 'System templates',
              isActive: systemOnly,
              onSelect: () => { setSystemOnly((current) => !current); setCurrentPage(1) },
              onCheckedChange: (checked: boolean) => { setSystemOnly(checked); setCurrentPage(1) },
            },
          ],
          activeFilters: [
            ...(statusFilter === 'all' ? [] : [{ key: 'status', label: 'Status', value: statusFilter }]),
            ...(systemOnly ? [{ key: 'systemOnly', label: 'Type', value: 'System' }] : []),
          ],
          onRemoveFilter: (key) => {
            if (key === 'status') setStatusFilter('all')
            if (key === 'systemOnly') setSystemOnly(false)
            setCurrentPage(1)
          },
          onClearAllFilters: () => {
            setStatusFilter('all')
            setSystemOnly(false)
            setCurrentPage(1)
          },
        }}
        table={{
          columns: [
            { id: 'serial', header: 'Sl.No', cell: (item) => ((safeCurrentPage - 1) * pageSize) + paginatedItems.findIndex((entry) => entry.id === item.id) + 1, className: 'w-14 min-w-14 px-2 text-center', headerClassName: 'w-14 min-w-14 px-2 text-center', sticky: 'left' },
            {
              id: 'name',
              header: 'Template',
              sortable: true,
              accessor: (item) => item.name,
              cell: (item) => (
                <div>
                  <Link to={`/admin/dashboard/mailbox/templates/${item.id}/edit`} className="font-medium text-foreground underline-offset-4 hover:underline">
                    {item.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{item.description ?? item.code}</p>
                </div>
              ),
            },
            { id: 'code', header: 'Code', sortable: true, accessor: (item) => item.code, cell: (item) => item.code },
            { id: 'category', header: 'Category', sortable: true, accessor: (item) => item.category, cell: (item) => item.category },
            {
              id: 'status',
              header: 'Status',
              accessor: (item) => item.isActive,
              cell: (item) => (
                <div className="flex flex-wrap gap-2">
                  <ActiveStatusBadge isActive={item.isActive} />
                  {item.isSystem ? <StatusBadge tone="system">System</StatusBadge> : <StatusBadge tone="manual">Manual</StatusBadge>}
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
                        <Link to={`/admin/dashboard/mailbox/templates/${item.id}/edit`}>
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
          loadingMessage: 'Loading mailbox templates...',
          emptyMessage: errorMessage ?? 'No mailbox templates found.',
          rowKey: (item) => item.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>Total records: <span className="font-medium text-foreground">{totalRecords}</span></span>
              <span>Active: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.isActive).length}</span></span>
              <span>System: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.isSystem).length}</span></span>
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

