import type { CustomerHelpdeskSummary } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CommonList, type CommonListColumn, type CommonListFilterOption } from '@/components/forms/CommonList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { HttpError, listCustomerHelpdeskCustomers } from '@/shared/api/client'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(value: string | null) {
  if (!value) {
    return 'No tracked order yet'
  }

  return new Date(value).toLocaleString()
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to load the customer helpdesk list.'
}

export function CustomerHelpdeskPage() {
  const { session } = useAuth()
  const token = session?.accessToken ?? null
  const [items, setItems] = useState<CustomerHelpdeskSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'attention'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    const search = searchValue.trim().toLowerCase()

    return items.filter((item) => {
      const matchesSearch = !search
        || item.displayName.toLowerCase().includes(search)
        || item.email.toLowerCase().includes(search)
        || (item.phoneNumber ?? '').toLowerCase().includes(search)
        || (item.lastOrderNumber ?? '').toLowerCase().includes(search)

      const matchesFilter = statusFilter === 'all'
        || (statusFilter === 'active' && item.isActive)
        || (statusFilter === 'disabled' && !item.isActive)
        || (statusFilter === 'attention' && item.issueCount > 0)

      return matchesSearch && matchesFilter
    })
  }, [items, searchValue, statusFilter])

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  useEffect(() => {
    const accessToken = token
    if (!accessToken || (session?.user.actorType !== 'admin' && session?.user.actorType !== 'staff')) {
      return
    }

    let cancelled = false

    async function loadList() {
      const authToken = accessToken
      if (!authToken) {
        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const nextItems = await listCustomerHelpdeskCustomers(authToken)
        if (!cancelled) {
          setItems(nextItems)
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

    void loadList()

    return () => {
      cancelled = true
    }
  }, [session?.user.actorType, token])

  if (session?.user.actorType !== 'admin' && session?.user.actorType !== 'staff') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer helpdesk</CardTitle>
          <CardDescription>This workspace is available only to internal support and operations users.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const filters: CommonListFilterOption[] = [
    { key: 'all', label: 'All customers', isActive: statusFilter === 'all', onSelect: () => { setStatusFilter('all'); setCurrentPage(1) } },
    { key: 'active', label: 'Active', isActive: statusFilter === 'active', onSelect: () => { setStatusFilter('active'); setCurrentPage(1) } },
    { key: 'disabled', label: 'Disabled', isActive: statusFilter === 'disabled', onSelect: () => { setStatusFilter('disabled'); setCurrentPage(1) } },
    { key: 'attention', label: 'Needs attention', isActive: statusFilter === 'attention', onSelect: () => { setStatusFilter('attention'); setCurrentPage(1) } },
  ]

  const columns: CommonListColumn<CustomerHelpdeskSummary>[] = [
    {
      id: 'serial',
      header: 'Sl.No',
      cell: (row) => ((safeCurrentPage - 1) * pageSize) + paginatedItems.findIndex((entry) => entry.id === row.id) + 1,
      className: 'w-12 min-w-12 px-2 text-center',
      headerClassName: 'w-12 min-w-12 px-2 text-center',
      sticky: 'left',
    },
    {
      id: 'customer',
      header: 'Customer',
      sortable: true,
      accessor: (row) => row.displayName,
      cell: (row) => (
        <Link to={`/admin/dashboard/customers/${row.id}`} className="group block space-y-1 text-left">
          <div className="font-medium text-foreground transition-colors group-hover:text-primary">{row.displayName}</div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
          <div className="pt-1 text-xs font-medium text-primary">Open customer page</div>
        </Link>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      accessor: (row) => row.isActive,
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{row.isActive ? 'active' : 'disabled'}</Badge>
          {row.issueCount > 0 ? <Badge variant="outline">{row.issueCount} issues</Badge> : null}
        </div>
      ),
    },
    {
      id: 'phone',
      header: 'Mobile',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.phoneNumber ?? 'Not available'}</span>,
    },
    {
      id: 'orders',
      header: 'Orders',
      sortable: true,
      accessor: (row) => row.orderCount,
      cell: (row) => (
        <div className="space-y-1">
          <div className="font-medium text-foreground">{row.orderCount}</div>
          <div className="text-xs text-muted-foreground">{formatCurrency(row.totalSpent)}</div>
        </div>
      ),
    },
    {
      id: 'last-order',
      header: 'Latest order',
      sortable: true,
      accessor: (row) => row.lastOrderAt ?? '',
      cell: (row) => (
        <div className="space-y-1">
          <div className="font-medium text-foreground">{row.lastOrderNumber ?? 'No order yet'}</div>
          <div className="text-xs text-muted-foreground">{formatDate(row.lastOrderAt)}</div>
        </div>
      ),
    },
    {
      id: 'open',
      header: '',
      className: 'w-20 min-w-20 px-2 text-center',
      headerClassName: 'w-20 min-w-20 px-2 text-center',
      sticky: 'right',
      cell: (row) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/admin/dashboard/customers/${row.id}`}>
              Open
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <CommonList
        header={{
          pageTitle: 'Customers',
          pageDescription: 'Review customer support records, recovery context, order links, and verification details.',
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: 'Search customer, email, phone, or latest order',
        }}
        filters={{
          buttonLabel: 'Customer filters',
          options: filters,
          activeFilters: statusFilter === 'all' ? [] : [{ key: 'status', label: 'Status', value: statusFilter }],
          onClearAllFilters: () => {
            setStatusFilter('all')
            setCurrentPage(1)
          },
          onRemoveFilter: () => {
            setStatusFilter('all')
            setCurrentPage(1)
          },
        }}
        table={{
          columns,
          data: paginatedItems,
          loading,
          loadingMessage: 'Loading customer helpdesk records...',
          emptyMessage: 'No customers match the current helpdesk search.',
          rowKey: (row) => row.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>Total records: <span className="font-medium text-foreground">{totalRecords}</span></span>
              <span>Active records: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.isActive).length}</span></span>
              <span>Needs attention: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.issueCount > 0).length}</span></span>
              <span>Orders linked: <span className="font-medium text-foreground">{filteredItems.reduce((total, item) => total + item.orderCount, 0)}</span></span>
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
