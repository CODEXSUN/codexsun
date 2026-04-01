import type { ContactSummary } from '@shared/index'
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
import { deactivateContact, HttpError, listContacts, restoreContact } from '@/shared/api/client'
import { showFailedActionToast, showStatusChangeToast } from '@/shared/notifications/toast'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load contacts.'
}

export function ContactListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ContactSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all'|'active'|'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setErrorMessage(null)
      try {
        const contacts = await listContacts()
        if (!cancelled) setItems(contacts)
      } catch (error) {
        if (!cancelled) setErrorMessage(toErrorMessage(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()
    return items.filter((item) => {
      const matchesSearch = normalizedSearch.length === 0 || [
        item.name, item.legalName, item.pan, item.gstin, item.primaryEmail, item.primaryPhone,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch))
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && item.isActive) || (statusFilter === 'inactive' && !item.isActive)
      return matchesSearch && matchesStatus
    })
  }, [items, searchValue, statusFilter])

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  async function handleToggleActive(item: ContactSummary) {
    setErrorMessage(null)
    try {
      if (item.isActive) await deactivateContact(item.id)
      else await restoreContact(item.id)
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isActive: !entry.isActive } : entry))
      showStatusChangeToast({
        entityLabel: 'contact',
        recordName: item.name,
        referenceId: item.id,
        action: item.isActive ? 'deactivate' : 'restore',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'contact',
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
          pageTitle: 'Contacts',
          pageDescription: 'Manage vendors, suppliers, customers, and other business contacts.',
          addLabel: 'New Contact',
          onAddClick: () => {
            void navigate('/admin/dashboard/contacts/new')
          },
        }}
        search={{ value: searchValue, onChange: (value) => { setSearchValue(value); setCurrentPage(1) }, placeholder: 'Search contacts' }}
        filters={{
          buttonLabel: 'Contact filters',
          options: [
            { key: 'all', label: 'All contacts', isActive: statusFilter === 'all', onSelect: () => setStatusFilter('all') },
            { key: 'active', label: 'Active only', isActive: statusFilter === 'active', onSelect: () => setStatusFilter('active') },
            { key: 'inactive', label: 'Inactive only', isActive: statusFilter === 'inactive', onSelect: () => setStatusFilter('inactive') },
          ],
          activeFilters: statusFilter === 'all' ? [] : [{ key: 'status', label: 'Status', value: statusFilter === 'active' ? 'Active' : 'Inactive' }],
          onRemoveFilter: () => setStatusFilter('all'),
          onClearAllFilters: () => { setStatusFilter('all'); setCurrentPage(1) },
        }}
        table={{
          columns: [
            { id: 'serial', header: 'Sl.No', cell: (item) => ((safeCurrentPage - 1) * pageSize) + paginatedItems.findIndex((entry) => entry.id === item.id) + 1, className: 'w-12 min-w-12 px-2 text-center', headerClassName: 'w-12 min-w-12 px-2 text-center', sticky: 'left' },
            { id: 'name', header: 'Contact', sortable: true, accessor: (item) => item.name, cell: (item) => <div><Link to={`/admin/dashboard/contacts/${item.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">{item.name}</Link><p className="text-sm text-muted-foreground">{item.legalName ?? 'No legal name'}</p></div> },
            { id: 'tax', header: 'Tax', accessor: (item) => item.gstin ?? item.pan, cell: (item) => <div><p>{item.gstin ?? 'No GSTIN'}</p><p className="text-sm text-muted-foreground">{item.pan ?? 'No PAN'}</p></div> },
            { id: 'financial', header: 'Balance', accessor: (item) => item.openingBalance, cell: (item) => <div><p>{item.openingBalance.toFixed(2)}</p><p className="text-sm text-muted-foreground">{item.balanceType ?? 'Not set'}</p></div> },
            { id: 'contact', header: 'Primary Contact', accessor: (item) => item.primaryEmail ?? item.primaryPhone, cell: (item) => <div><p>{item.primaryEmail ?? 'No email'}</p><p className="text-sm text-muted-foreground">{item.primaryPhone ?? 'No phone'}</p></div> },
            { id: 'status', header: 'Status', accessor: (item) => item.isActive, cell: (item) => <ActiveStatusBadge isActive={item.isActive} /> },
            {
              id: 'actions', header: 'Actions', className: 'w-12 min-w-12 px-2 text-center', headerClassName: 'w-12 min-w-12 px-2 text-center', sticky: 'right',
              cell: (item) => (
                <div className="flex justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button type="button" size="icon-sm" variant="ghost"><MoreHorizontalIcon className="size-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild><Link to={`/admin/dashboard/contacts/${item.id}/edit`}><EditIcon className="size-4" /><span>Edit</span></Link></DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void handleToggleActive(item)}><PowerIcon className="size-4" /><span>{item.isActive ? 'Deactivate' : 'Restore'}</span></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ),
            },
          ],
          data: paginatedItems,
          loading,
          loadingMessage: 'Loading contacts...',
          emptyMessage: errorMessage ?? 'No contacts found.',
          rowKey: (item) => item.id,
        }}
        footer={{ content: <div className="flex flex-wrap items-center gap-4"><span>Total records: <span className="font-medium text-foreground">{totalRecords}</span></span><span>Active records: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.isActive).length}</span></span></div> }}
        pagination={{ currentPage: safeCurrentPage, pageSize, totalRecords, onPageChange: setCurrentPage, onPageSizeChange: (value) => { setPageSize(value); setCurrentPage(1) } }}
      />
    </div>
  )
}

