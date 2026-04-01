import type {
  FrappeTodo,
  FrappeTodoPriority,
  FrappeTodoStatus,
  FrappeTodoUpsertPayload,
} from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EditIcon, MoreHorizontalIcon, PowerIcon, RefreshCcw } from 'lucide-react'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { CommonList } from '@/components/forms/CommonList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import {
  createFieldErrors,
  inputErrorClassName,
  isBlank,
  setFieldError,
  summarizeFieldErrors,
  type FieldErrors,
  warningCardClassName,
} from '@/shared/forms/validation'
import {
  createFrappeTodo,
  HttpError,
  listFrappeTodos,
  updateFrappeTodo,
} from '@/shared/api/client'
import { showErrorToast, showSuccessToast, showValidationToast } from '@/shared/notifications/toast'

const statusOptions: FrappeTodoStatus[] = ['Open', 'Closed', 'Cancelled']
const priorityOptions: FrappeTodoPriority[] = ['Low', 'Medium', 'High']
const AUTO_REFRESH_MS = 15_000

function createDefaultValues(): FrappeTodoUpsertPayload {
  return {
    description: '',
    status: 'Open',
    priority: 'Medium',
    dueDate: '',
    allocatedTo: '',
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to load Frappe ToDo records.'
}

function validateTodo(values: FrappeTodoUpsertPayload) {
  const errors = createFieldErrors()

  if (isBlank(values.description)) {
    setFieldError(errors, 'description', 'Description is required.')
  }

  return errors
}

function stripHtml(value: string) {
  const trimmedValue = value.trim()
  if (!trimmedValue.includes('<')) {
    return trimmedValue
  }

  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    const parser = new window.DOMParser()
    const document = parser.parseFromString(trimmedValue, 'text/html')
    return document.body.textContent?.replace(/\s+/g, ' ').trim() ?? trimmedValue
  }

  return trimmedValue
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeTodoItem(item: FrappeTodo): FrappeTodo {
  return {
    ...item,
    description: stripHtml(item.description),
  }
}

function formatDateTime(value: string) {
  if (!value) {
    return 'Not updated'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}

function getStatusTone(status: FrappeTodoStatus) {
  if (status === 'Closed') {
    return 'active'
  }

  if (status === 'Cancelled') {
    return 'inactive'
  }

  return 'publishing'
}

function getPriorityTone(priority: FrappeTodoPriority) {
  if (priority === 'High') {
    return 'promo'
  }

  if (priority === 'Medium') {
    return 'featured'
  }

  return 'manual'
}

export function FrappeTodoPage() {
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? null
  const isSuperAdmin = Boolean(session?.user.isSuperAdmin)
  const [items, setItems] = useState<FrappeTodo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(createFieldErrors())
  const [values, setValues] = useState<FrappeTodoUpsertPayload>(createDefaultValues())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | FrappeTodoStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | FrappeTodoPriority>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('')

  async function loadTodosWithToken(token: string, options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoading(true)
    }

    try {
      const response = await listFrappeTodos(token)
      setItems(response.items.map(normalizeTodoItem))
      setLastSyncedAt(response.syncedAt)
      setErrorMessage(null)
      return true
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
      return false
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (typeof accessToken !== 'string') {
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadInitial() {
      const token = accessToken
      if (!token || cancelled) {
        return
      }

      await loadTodosWithToken(token)
    }

    void loadInitial()

    const intervalId = isSuperAdmin
      ? window.setInterval(() => {
          const token = accessToken
          if (!token || cancelled) {
            return
          }

          void loadTodosWithToken(token, { silent: true })
        }, AUTO_REFRESH_MS)
      : null

    return () => {
      cancelled = true
      if (intervalId != null) {
        window.clearInterval(intervalId)
      }
    }
  }, [accessToken, isSuperAdmin])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return items.filter((item) => {
      const matchesSearch = normalizedSearch.length === 0
        || [item.id, item.description, item.allocatedTo, item.owner]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch))

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [items, priorityFilter, searchValue, statusFilter])

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  function resetDialogState() {
    setDialogOpen(false)
    setEditingId(null)
    setValues(createDefaultValues())
    setFieldErrors(createFieldErrors())
  }

  function openCreateDialog() {
    setEditingId(null)
    setValues(createDefaultValues())
    setFieldErrors(createFieldErrors())
    setDialogOpen(true)
  }

  function startEdit(item: FrappeTodo) {
    setEditingId(item.id)
    setValues({
      description: item.description,
      status: item.status,
      priority: item.priority,
      dueDate: item.dueDate,
      allocatedTo: item.allocatedTo,
    })
    setFieldErrors(createFieldErrors())
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!isSuperAdmin || typeof accessToken !== 'string') {
      return
    }

    const nextFieldErrors = validateTodo(values)
    setFieldErrors(nextFieldErrors)

    if (Object.keys(nextFieldErrors).length > 0) {
      setErrorMessage('Validation failed.')
      showValidationToast('frappe todo')
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      if (editingId) {
        await updateFrappeTodo(accessToken, editingId, values)
        showSuccessToast({
          title: 'Frappe ToDo updated',
          description: `ToDo ${editingId} was updated in ERPNext.`,
        })
      } else {
        const createdTodo = await createFrappeTodo(accessToken, values)
        showSuccessToast({
          title: 'Frappe ToDo created',
          description: `ToDo ${createdTodo.id} was created in ERPNext.`,
        })
      }

      resetDialogState()
      await loadTodosWithToken(accessToken, { silent: true })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: editingId ? 'Unable to update Frappe ToDo' : 'Unable to create Frappe ToDo',
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleManualSync() {
    if (!isSuperAdmin || typeof accessToken !== 'string') {
      return
    }

    setSyncing(true)
    try {
      const success = await loadTodosWithToken(accessToken)
      if (success) {
        showSuccessToast({
          title: 'Frappe ToDos synced',
          description: 'The latest ToDo records were pulled from ERPNext.',
        })
      }
    } finally {
      setSyncing(false)
    }
  }

  async function handleQuickStatusChange(item: FrappeTodo) {
    if (!isSuperAdmin || typeof accessToken !== 'string') {
      return
    }

    const nextStatus: FrappeTodoStatus = item.status === 'Closed' ? 'Open' : 'Closed'

    try {
      await updateFrappeTodo(accessToken, item.id, {
        description: item.description,
        status: nextStatus,
        priority: item.priority,
        dueDate: item.dueDate,
        allocatedTo: item.allocatedTo,
      })

      setItems((current) => current.map((entry) => (
        entry.id === item.id
          ? {
              ...entry,
              status: nextStatus,
              modifiedAt: new Date().toISOString(),
            }
          : entry
      )))
      setLastSyncedAt(new Date().toISOString())

      showSuccessToast({
        title: 'Frappe ToDo updated',
        description: `ToDo ${item.id} moved to ${nextStatus}.`,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to update Frappe ToDo',
        description: message,
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="border-b border-border/60 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge>Frappe</Badge>
              <div>
                <CardTitle className="text-3xl">ERPNext ToDo sync</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
                  Live ToDo records from ERPNext with list-first management. Create and edit records from a popup, then keep the list refreshed every 15 seconds.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{isSuperAdmin ? 'Auto refresh 15s' : 'Read only'}</Badge>
              <Badge variant="outline">{lastSyncedAt ? `Last sync ${formatDateTime(lastSyncedAt)}` : 'Waiting for first sync'}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-md">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>Total: <span className="font-medium text-foreground">{items.length}</span></span>
            <span>Open: <span className="font-medium text-foreground">{items.filter((item) => item.status === 'Open').length}</span></span>
            <span>Closed: <span className="font-medium text-foreground">{items.filter((item) => item.status === 'Closed').length}</span></span>
            <span>High priority: <span className="font-medium text-foreground">{items.filter((item) => item.priority === 'High').length}</span></span>
          </div>
          {isSuperAdmin ? (
            <Button type="button" variant="outline" onClick={() => void handleManualSync()} disabled={syncing || saving}>
              <RefreshCcw className="size-4" />
              {syncing ? 'Syncing...' : 'Sync now'}
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">Sync and edits are available only to super-admin users.</span>
          )}
        </CardContent>
      </Card>

      {errorMessage ? (
        <Card className={`${warningCardClassName} rounded-md`}>
          <CardContent className="rounded-md p-4 text-sm">
            <p className="font-medium">{errorMessage}</p>
            {Object.keys(fieldErrors).length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {summarizeFieldErrors(fieldErrors).map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-muted-foreground">
              Check the ERPNext connection in <Link to="/admin/dashboard/frappe/connection" className="font-medium text-foreground underline underline-offset-4">Frappe Connection</Link> if this is a configuration problem.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <CommonList
        header={{
          pageTitle: 'Frappe ToDo',
          pageDescription: 'Manage ERPNext ToDo records from a common-list style screen with popup create and edit.',
          addLabel: isSuperAdmin ? 'New ToDo' : undefined,
          onAddClick: isSuperAdmin ? openCreateDialog : undefined,
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: 'Search Frappe ToDos',
        }}
        filters={{
          buttonLabel: 'ToDo filters',
          options: [
            {
              key: 'all-status',
              label: 'All statuses',
              isActive: statusFilter === 'all',
              onSelect: () => {
                setStatusFilter('all')
                setCurrentPage(1)
              },
            },
            ...statusOptions.map((status) => ({
              key: status,
              label: status,
              isActive: statusFilter === status,
              onSelect: () => {
                setStatusFilter((current) => (current === status ? 'all' : status))
                setCurrentPage(1)
              },
            })),
            ...priorityOptions.map((priority) => ({
              key: `priority-${priority}`,
              label: `${priority} priority`,
              isActive: priorityFilter === priority,
              onSelect: () => {
                setPriorityFilter((current) => (current === priority ? 'all' : priority))
                setCurrentPage(1)
              },
            })),
          ],
          activeFilters: [
            ...(statusFilter === 'all' ? [] : [{ key: 'status', label: 'Status', value: statusFilter }]),
            ...(priorityFilter === 'all' ? [] : [{ key: 'priority', label: 'Priority', value: priorityFilter }]),
          ],
          onRemoveFilter: (key) => {
            if (key === 'status') {
              setStatusFilter('all')
            }

            if (key === 'priority') {
              setPriorityFilter('all')
            }
          },
          onClearAllFilters: () => {
            setStatusFilter('all')
            setPriorityFilter('all')
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
              id: 'description',
              header: 'ToDo',
              sortable: true,
              accessor: (item) => item.description,
              className: 'min-w-0 max-w-[24rem]',
              cell: (item) => (
                <div className="min-w-0 max-w-[24rem]">
                  <p className="font-medium text-foreground">{stripHtml(item.description) || 'Untitled ToDo'}</p>
                  <p className="truncate text-sm text-muted-foreground">{item.id}</p>
                </div>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              accessor: (item) => item.status,
              cell: (item) => <StatusBadge tone={getStatusTone(item.status)}>{item.status}</StatusBadge>,
            },
            {
              id: 'priority',
              header: 'Priority',
              accessor: (item) => item.priority,
              cell: (item) => <StatusBadge tone={getPriorityTone(item.priority)}>{item.priority}</StatusBadge>,
            },
            {
              id: 'dueDate',
              header: 'Due Date',
              accessor: (item) => item.dueDate,
              cell: (item) => <span>{item.dueDate || 'No due date'}</span>,
            },
            {
              id: 'allocatedTo',
              header: 'Allocated To',
              accessor: (item) => item.allocatedTo,
              cell: (item) => (
                <div>
                  <p>{item.allocatedTo || 'Unassigned'}</p>
                  <p className="text-sm text-muted-foreground">{item.owner || 'No owner'}</p>
                </div>
              ),
            },
            {
              id: 'modifiedAt',
              header: 'Modified',
              sortable: true,
              accessor: (item) => item.modifiedAt,
              cell: (item) => <span>{formatDateTime(item.modifiedAt)}</span>,
            },
            ...(isSuperAdmin ? [{
              id: 'actions',
              header: 'Actions',
              className: 'w-12 min-w-12 px-2 text-center',
              headerClassName: 'w-12 min-w-12 px-2 text-center',
              sticky: 'right' as const,
              cell: (item: FrappeTodo) => (
                <div className="flex justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" size="icon-sm" variant="ghost">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => startEdit(item)}>
                        <EditIcon className="size-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => void handleQuickStatusChange(item)}>
                        <PowerIcon className="size-4" />
                        <span>{item.status === 'Closed' ? 'Reopen' : 'Close'}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ),
            }] : []),
          ],
          data: paginatedItems,
          loading,
          loadingMessage: 'Loading Frappe ToDos...',
          emptyMessage: errorMessage ?? 'No Frappe ToDos found.',
          rowKey: (item) => item.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>Total records: <span className="font-medium text-foreground">{totalRecords}</span></span>
              <span>Open: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.status === 'Open').length}</span></span>
              <span>Closed: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.status === 'Closed').length}</span></span>
              <span>High priority: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.priority === 'High').length}</span></span>
            </div>
          ),
        }}
        pagination={{
          currentPage: safeCurrentPage,
          pageSize,
          totalRecords,
          pageSizeOptions: [10, 25, 50, 100],
          onPageChange: setCurrentPage,
          onPageSizeChange: (value) => {
            setPageSize(value)
            setCurrentPage(1)
          },
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open && !saving) {
          resetDialogState()
          return
        }

        setDialogOpen(open)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Frappe ToDo' : 'Create Frappe ToDo'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? `Update ERPNext document ${editingId} from the popup form.`
                : 'Create a new ERPNext ToDo directly from this list screen.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="frappe-todo-description" className={fieldErrors.description ? 'text-destructive' : undefined}>
                Description
              </Label>
                <Textarea
                  id="frappe-todo-description"
                  className={inputErrorClassName(Boolean(fieldErrors.description))}
                  value={values.description}
                  onChange={(event) => {
                    setValues((current) => ({ ...current, description: event.target.value }))
                    setFieldErrors((current) => {
                      const nextErrors = { ...current }
                      delete nextErrors.description
                      return nextErrors
                    })
                  }}
                  placeholder="Follow up on dispatch confirmation"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="frappe-todo-status">Status</Label>
                <select
                  id="frappe-todo-status"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={values.status}
                  onChange={(event) => setValues((current) => ({ ...current, status: event.target.value as FrappeTodoStatus }))}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="frappe-todo-priority">Priority</Label>
                <select
                  id="frappe-todo-priority"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={values.priority}
                  onChange={(event) => setValues((current) => ({ ...current, priority: event.target.value as FrappeTodoPriority }))}
                >
                  {priorityOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="frappe-todo-date">Due Date</Label>
                <Input
                  id="frappe-todo-date"
                  type="date"
                  value={values.dueDate}
                  onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="frappe-todo-allocated-to">Allocated To</Label>
                <Input
                  id="frappe-todo-allocated-to"
                  type="email"
                  value={values.allocatedTo}
                  onChange={(event) => setValues((current) => ({ ...current, allocatedTo: event.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetDialogState} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save ToDo' : 'Create ToDo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
