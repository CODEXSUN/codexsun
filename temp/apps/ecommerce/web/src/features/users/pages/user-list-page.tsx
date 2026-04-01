import type { ActorType, AuthUser } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EditIcon, MoreHorizontalIcon, PowerIcon } from 'lucide-react'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
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
import { deactivateUser, HttpError, listUsers, restoreUser } from '@/shared/api/client'
import { showFailedActionToast, showStatusChangeToast } from '@/shared/notifications/toast'

const actorTypeLabelMap: Record<ActorType, string> = {
  admin: 'Admin',
  staff: 'Staff',
  customer: 'Customer',
  vendor: 'Vendor',
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Failed to load users.'
}

export function UserListPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? null
  const currentUserId = session?.user.id ?? null
  const canManageSuperAdmins = Boolean(session?.user.isSuperAdmin)
  const canManageUsers = Boolean(
    session?.user.isSuperAdmin || session?.user.permissions.some((permission) => permission.key === 'users:manage'),
  )
  const [items, setItems] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [actorTypeFilter, setActorTypeFilter] = useState<'all' | ActorType>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    if (!canManageUsers || typeof accessToken !== 'string') {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      const token = accessToken
      if (!token) {
        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const users = await listUsers(token)
        if (!cancelled) {
          setItems(users)
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
  }, [accessToken, canManageUsers])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return items.filter((item) => {
      const matchesSearch = normalizedSearch.length === 0
        || [
          item.displayName,
          item.email,
          item.phoneNumber,
          item.organizationName,
          ...item.roles.map((role) => role.name),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch))

      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && item.isActive)
        || (statusFilter === 'inactive' && !item.isActive)

      const matchesActorType = actorTypeFilter === 'all' || item.actorType === actorTypeFilter

      return matchesSearch && matchesStatus && matchesActorType
    })
  }, [actorTypeFilter, items, searchValue, statusFilter])

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)
  const canEditTarget = (item: AuthUser) => canManageSuperAdmins || !item.isSuperAdmin

  async function handleToggleActive(item: AuthUser) {
    if (typeof accessToken !== 'string') {
      return
    }

    setErrorMessage(null)

    try {
      const updatedUser = item.isActive
        ? await deactivateUser(accessToken, item.id)
        : await restoreUser(accessToken, item.id)

      setItems((current) => current.map((entry) => (entry.id === updatedUser.id ? updatedUser : entry)))
      showStatusChangeToast({
        entityLabel: 'user',
        recordName: item.displayName,
        referenceId: item.id,
        action: item.isActive ? 'deactivate' : 'restore',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'user',
        action: item.isActive ? 'deactivate' : 'restore',
        detail: message,
      })
    }
  }

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          User management is available only to accounts with the `users:manage` permission.
        </CardContent>
      </Card>
    )
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
          pageTitle: 'Users',
          pageDescription: 'Manage admin, staff, customer, and vendor identities, role defaults, and account status.',
          addLabel: 'New User',
          onAddClick: () => {
            void navigate('/admin/dashboard/users/new')
          },
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: 'Search users',
        }}
        filters={{
          buttonLabel: 'User filters',
          options: [
            {
              key: 'all',
              label: 'All users',
              isActive: statusFilter === 'all',
              onSelect: () => {
                setStatusFilter('all')
                setCurrentPage(1)
              },
            },
            {
              key: 'active',
              label: 'Active only',
              isActive: statusFilter === 'active',
              onSelect: () => {
                setStatusFilter('active')
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
            },
            ...(['admin', 'staff', 'customer', 'vendor'] as const).map((actorType) => ({
              key: actorType,
              label: actorTypeLabelMap[actorType],
              isActive: actorTypeFilter === actorType,
              onSelect: () => {
                setActorTypeFilter((current) => (current === actorType ? 'all' : actorType))
                setCurrentPage(1)
              },
            })),
          ],
          activeFilters: [
            ...(statusFilter === 'all'
              ? []
              : [{ key: 'status', label: 'Status', value: statusFilter === 'active' ? 'Active' : 'Inactive' }]),
            ...(actorTypeFilter === 'all'
              ? []
              : [{ key: 'actorType', label: 'Actor Type', value: actorTypeLabelMap[actorTypeFilter] }]),
          ],
          onRemoveFilter: (key) => {
            if (key === 'status') {
              setStatusFilter('all')
            }

            if (key === 'actorType') {
              setActorTypeFilter('all')
            }
          },
          onClearAllFilters: () => {
            setStatusFilter('all')
            setActorTypeFilter('all')
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
              id: 'user',
              header: 'User',
              sortable: true,
              accessor: (item) => item.displayName,
              className: 'min-w-0 max-w-[22rem]',
              cell: (item) => (
                <div className="min-w-0">
                  {canEditTarget(item) ? (
                    <Link to={`/admin/dashboard/users/${item.id}/edit`} className="font-medium text-foreground underline-offset-4 hover:underline">
                      {item.displayName}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{item.displayName}</span>
                  )}
                  <p className="truncate text-sm text-muted-foreground">{item.email}</p>
                </div>
              ),
            },
            {
              id: 'actorType',
              header: 'Actor Type',
              accessor: (item) => item.actorType,
              cell: (item) => (
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge tone="publishing">{actorTypeLabelMap[item.actorType]}</StatusBadge>
                  {item.isSuperAdmin && canManageSuperAdmins ? <StatusBadge tone="featured">Super admin</StatusBadge> : null}
                </div>
              ),
            },
            {
              id: 'contact',
              header: 'Contact',
              accessor: (item) => item.phoneNumber ?? item.organizationName ?? '',
              cell: (item) => (
                <div>
                  <p>{item.phoneNumber ?? 'No phone number'}</p>
                  <p className="text-sm text-muted-foreground">{item.organizationName ?? 'No organization'}</p>
                </div>
              ),
            },
            {
              id: 'access',
              header: 'Access',
              accessor: (item) => item.roles.map((role) => role.name).join(', '),
              cell: (item) => (
                <div>
                  <p>{item.roles.map((role) => role.name).join(', ') || 'No roles'}</p>
                  <p className="text-sm text-muted-foreground">{item.permissions.length} permission(s)</p>
                </div>
              ),
            },
            {
              id: 'status',
              header: 'Status',
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
                      {canEditTarget(item) ? (
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/dashboard/users/${item.id}/edit`}>
                            <EditIcon className="size-4" />
                            <span>Edit</span>
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled>
                          <EditIcon className="size-4" />
                          <span>Super admin only</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => void handleToggleActive(item)}
                        disabled={item.id === currentUserId || !canEditTarget(item)}
                      >
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
          loadingMessage: 'Loading users...',
          emptyMessage: errorMessage ?? 'No users found.',
          rowKey: (item) => item.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>Total records: <span className="font-medium text-foreground">{totalRecords}</span></span>
              <span>Active records: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.isActive).length}</span></span>
              <span>Admin records: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.actorType === 'admin').length}</span></span>
              <span>Customer records: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.actorType === 'customer').length}</span></span>
            </div>
          ),
        }}
        pagination={{
          currentPage: safeCurrentPage,
          pageSize,
          totalRecords,
          pageSizeOptions: [10, 25, 50, 100, 200],
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
