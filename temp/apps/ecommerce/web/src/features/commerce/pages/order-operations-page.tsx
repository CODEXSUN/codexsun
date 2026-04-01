import type { CommerceOrderSummary } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CommonList, type CommonListColumn, type CommonListFilterOption } from '@/components/forms/CommonList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { HttpError, listCommerceOrders } from '@/shared/api/client'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    const detail =
      error.context &&
      typeof error.context === 'object' &&
      'detail' in error.context &&
      typeof error.context.detail === 'string'
        ? error.context.detail
        : null

    return detail ? `${error.message} ${detail}` : error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to load order operations.'
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Not recorded'
  }

  return new Date(value).toLocaleString()
}

function eventLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function statusTone(value: string) {
  if (['delivered', 'delivery_confirmed', 'paid', 'issued'].includes(value)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }

  if (['cancelled'].includes(value)) {
    return 'border-rose-200 bg-rose-50 text-rose-800'
  }

  if (['pending_payment', 'draft', 'pending'].includes(value)) {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }

  return 'border-sky-200 bg-sky-50 text-sky-800'
}

export function OrderOperationsPage() {
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? null
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<CommerceOrderSummary[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'delivered' | 'attention'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filteredOrders = useMemo(() => {
    const search = searchValue.trim().toLowerCase()

    return orders.filter((item) => {
      const matchesSearch = !search
        || item.orderNumber.toLowerCase().includes(search)
        || item.customerName.toLowerCase().includes(search)
        || item.status.toLowerCase().includes(search)

      const matchesFilter = statusFilter === 'all'
        || (statusFilter === 'delivered' && ['delivered', 'delivery_confirmed'].includes(item.status))
        || (statusFilter === 'attention' && ['pending_payment', 'placed', 'preparing_delivery', 'packed', 'courier_assigned', 'picked_up', 'in_transit', 'out_for_delivery'].includes(item.status))
        || (statusFilter === 'active' && !['delivered', 'delivery_confirmed', 'cancelled'].includes(item.status))

      return matchesSearch && matchesFilter
    })
  }, [orders, searchValue, statusFilter])

  const totalRecords = filteredOrders.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedOrders = filteredOrders.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  useEffect(() => {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }

    let cancelled = false

    async function loadOrders() {
      const authToken = token
      if (!authToken) {
        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const items = await listCommerceOrders(authToken)
        if (!cancelled) {
          setOrders(items)
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

    void loadOrders()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  if (session?.user.actorType !== 'admin' && session?.user.actorType !== 'staff') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>This operations board is available only for internal fulfillment teams.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const filters: CommonListFilterOption[] = [
    { key: 'all', label: 'All orders', isActive: statusFilter === 'all', onSelect: () => { setStatusFilter('all'); setCurrentPage(1) } },
    { key: 'active', label: 'Active', isActive: statusFilter === 'active', onSelect: () => { setStatusFilter('active'); setCurrentPage(1) } },
    { key: 'delivered', label: 'Delivered', isActive: statusFilter === 'delivered', onSelect: () => { setStatusFilter('delivered'); setCurrentPage(1) } },
    { key: 'attention', label: 'Needs action', isActive: statusFilter === 'attention', onSelect: () => { setStatusFilter('attention'); setCurrentPage(1) } },
  ]

  const columns: CommonListColumn<CommerceOrderSummary>[] = [
    {
      id: 'serial',
      header: 'Sl.No',
      cell: (row) => ((safeCurrentPage - 1) * pageSize) + paginatedOrders.findIndex((entry) => entry.orderId === row.orderId) + 1,
      className: 'w-12 min-w-12 px-2 text-center',
      headerClassName: 'w-12 min-w-12 px-2 text-center',
      sticky: 'left',
    },
    {
      id: 'order',
      header: 'Order',
      sortable: true,
      accessor: (row) => row.orderNumber,
      cell: (row) => (
        <Link to={`/admin/dashboard/orders/${row.orderId}`} className="group block space-y-1 text-left">
          <div className="font-medium text-foreground transition-colors group-hover:text-primary">{row.orderNumber}</div>
          <div className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</div>
          <div className="pt-1 text-xs font-medium text-primary">Open order page</div>
        </Link>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      sortable: true,
      accessor: (row) => row.customerName,
      cell: (row) => <span className="text-sm text-foreground">{row.customerName}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      accessor: (row) => row.status,
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={statusTone(row.status)}>{eventLabel(row.status)}</Badge>
          <Badge variant="outline" className={statusTone(row.paymentStatus)}>{eventLabel(row.paymentStatus)}</Badge>
        </div>
      ),
    },
    {
      id: 'shipment',
      header: 'Shipment',
      sortable: true,
      accessor: (row) => row.shipmentStatus ?? '',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.shipmentStatus ? eventLabel(row.shipmentStatus) : 'Pending setup'}</span>,
    },
    {
      id: 'invoice',
      header: 'Invoice',
      sortable: true,
      accessor: (row) => row.invoiceStatus ?? '',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.invoiceStatus ? eventLabel(row.invoiceStatus) : 'Not issued'}</span>,
    },
    {
      id: 'total',
      header: 'Total',
      sortable: true,
      accessor: (row) => row.totalAmount,
      cell: (row) => <span className="font-medium text-foreground">{formatCurrency(row.totalAmount, row.currency)}</span>,
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
            <Link to={`/admin/dashboard/orders/${row.orderId}`}>
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
          pageTitle: 'Orders',
          pageDescription: 'Review storefront orders, workflow status, shipment readiness, invoice output, and accounting links.',
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: 'Search order, customer, or status',
        }}
        filters={{
          buttonLabel: 'Order filters',
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
          data: paginatedOrders,
          loading,
          loadingMessage: 'Loading order operations...',
          emptyMessage: 'No orders match the current filter.',
          rowKey: (row) => row.orderId,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>Total records: <span className="font-medium text-foreground">{totalRecords}</span></span>
              <span>Active records: <span className="font-medium text-foreground">{filteredOrders.filter((item) => !['delivered', 'delivery_confirmed', 'cancelled'].includes(item.status)).length}</span></span>
              <span>Delivered records: <span className="font-medium text-foreground">{filteredOrders.filter((item) => ['delivered', 'delivery_confirmed'].includes(item.status)).length}</span></span>
              <span>Order value: <span className="font-medium text-foreground">{formatCurrency(filteredOrders.reduce((sum, item) => sum + item.totalAmount, 0), 'INR')}</span></span>
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
