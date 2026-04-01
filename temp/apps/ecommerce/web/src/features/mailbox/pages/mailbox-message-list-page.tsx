import type { MailboxMessageSummary } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EditIcon, MoreHorizontalIcon, SendIcon } from 'lucide-react'
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
import { HttpError, listMailboxMessages } from '@/shared/api/client'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load mailbox messages.'
}

export function MailboxMessageListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<MailboxMessageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'queued' | 'sent' | 'failed'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage(null)
      try {
        const messages = await listMailboxMessages()
        if (!cancelled) {
          setItems(messages)
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
      const matchesSearch = normalizedSearch.length === 0 || [
        item.subject,
        item.recipientSummary,
        item.templateCode,
        item.referenceType,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch))

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [items, searchValue, statusFilter])

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2 px-3">
        <Button variant="outline" asChild>
          <Link to="/admin/dashboard/mailbox/templates">
            <EditIcon className="size-4" />
            Templates
          </Link>
        </Button>
      </div>

      {errorMessage ? <Card><CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent></Card> : null}

      <CommonList
        header={{
          pageTitle: 'Mailbox',
          pageDescription: 'Review sent system mail, provider results, and manual compose activity from one outgoing mailbox ledger.',
          addLabel: 'Compose email',
          onAddClick: () => {
            void navigate('/admin/dashboard/mailbox/compose')
          },
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: 'Search messages',
        }}
        filters={{
          buttonLabel: 'Mailbox filters',
          options: [
            {
              key: 'all',
              label: 'All messages',
              isActive: statusFilter === 'all',
              onSelect: () => {
                setStatusFilter('all')
                setCurrentPage(1)
              },
              onCheckedChange: () => {
                setStatusFilter('all')
                setCurrentPage(1)
              },
            },
            ...(['queued', 'sent', 'failed'] as const).map((status) => ({
              key: status,
              label: status.charAt(0).toUpperCase() + status.slice(1),
              isActive: statusFilter === status,
              onSelect: () => {
                setStatusFilter(status)
                setCurrentPage(1)
              },
              onCheckedChange: (checked: boolean) => {
                setStatusFilter(checked ? status : 'all')
                setCurrentPage(1)
              },
            })),
          ],
          activeFilters: statusFilter === 'all' ? [] : [{ key: 'status', label: 'Status', value: statusFilter }],
          onRemoveFilter: () => {
            setStatusFilter('all')
            setCurrentPage(1)
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
              cell: (item) => ((safeCurrentPage - 1) * pageSize) + paginatedItems.findIndex((entry) => entry.id === item.id) + 1,
              className: 'w-14 min-w-14 px-2 text-center',
              headerClassName: 'w-14 min-w-14 px-2 text-center',
              sticky: 'left',
            },
            {
              id: 'subject',
              header: 'Message',
              sortable: true,
              accessor: (item) => item.subject,
              cell: (item) => (
                <div>
                  <Link to={`/admin/dashboard/mailbox/messages/${item.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                    {item.subject}
                  </Link>
                  <p className="text-sm text-muted-foreground">{item.templateCode ?? item.referenceType ?? 'Direct compose'}</p>
                </div>
              ),
            },
            {
              id: 'recipients',
              header: 'Recipients',
              accessor: (item) => item.recipientSummary,
              cell: (item) => (
                <div>
                  <p>{item.recipientSummary}</p>
                  <p className="text-sm text-muted-foreground">{item.recipientCount} recipients</p>
                </div>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              accessor: (item) => item.status,
              cell: (item) => (
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={item.status === 'sent' ? 'default' : 'secondary'}
                    className={item.status === 'failed' ? 'bg-destructive/10 text-destructive' : undefined}
                  >
                    {item.status}
                  </Badge>
                  {item.provider ? <Badge variant="outline">{item.provider}</Badge> : null}
                </div>
              ),
            },
            {
              id: 'sentAt',
              header: 'Last update',
              sortable: true,
              accessor: (item) => item.sentAt ?? item.failedAt ?? item.createdAt,
              cell: (item) => (
                <div>
                  <p>{new Date(item.sentAt ?? item.failedAt ?? item.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{item.providerMessageId ?? 'No provider id'}</p>
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
                        <Link to={`/admin/dashboard/mailbox/messages/${item.id}`}>
                          <SendIcon className="size-4" />
                          <span>Open</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ),
            },
          ],
          data: paginatedItems,
          loading,
          loadingMessage: 'Loading mailbox messages...',
          emptyMessage: errorMessage ?? 'No mailbox messages found.',
          rowKey: (item) => item.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>Total records: <span className="font-medium text-foreground">{totalRecords}</span></span>
              <span>Sent: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.status === 'sent').length}</span></span>
              <span>Failed: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.status === 'failed').length}</span></span>
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

