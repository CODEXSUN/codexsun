import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Trash2Icon } from "lucide-react"

import type { AuthUserListResponse } from "@cxapp/shared"

import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MasterList } from "@/components/blocks/master-list"
import { RecordActionMenu } from "@/components/blocks/record-action-menu"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { ActivityStatusBadge } from "@/features/status/activity-status"

import {
  deleteFrameworkUser,
  getFrameworkUser,
  listFrameworkUsers,
  updateFrameworkUser,
} from "./user-api"
import { SectionShell, StateCard } from "./user-shared"
import { useAuth } from "../../auth/auth-context"

type StatusFilterValue = "all" | "active" | "inactive"
const deleteUserConfirmationText = "DELETE USER"

function matchesStatusFilter(statusFilter: StatusFilterValue, isActive: boolean) {
  if (statusFilter === "all") {
    return true
  }

  return statusFilter === "active" ? isActive : !isActive
}

function buildStatusFilters(
  statusFilter: StatusFilterValue,
  onChange: (value: StatusFilterValue) => void
) {
  return {
    options: [
      {
        key: "all",
        label: "All records",
        isActive: statusFilter === "all",
        onSelect: () => onChange("all"),
      },
      {
        key: "active",
        label: "Active only",
        isActive: statusFilter === "active",
        onSelect: () => onChange("active"),
      },
      {
        key: "inactive",
        label: "Inactive only",
        isActive: statusFilter === "inactive",
        onSelect: () => onChange("inactive"),
      },
    ],
    activeFilters:
      statusFilter === "all"
        ? []
        : [
            {
              key: "status",
              label: "Status",
              value: statusFilter === "active" ? "Active only" : "Inactive only",
            },
          ],
    onRemoveFilter: () => onChange("all"),
    onClearAllFilters: () => onChange("all"),
  }
}

export function FrameworkUsersSection() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<AuthUserListResponse["items"]>([])
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [deleteDialogUser, setDeleteDialogUser] =
    useState<AuthUserListResponse["items"][number] | null>(null)
  const [deleteConfirmationValue, setDeleteConfirmationValue] = useState("")
  useGlobalLoading(isLoading || isMutating)

  async function loadUsers() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await listFrameworkUsers()
      setItems(response.items)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load users.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  async function handleStatusChange(userId: string, isActive: boolean) {
    setError(null)
    setIsMutating(true)

    try {
      const detail = await getFrameworkUser(userId)
      await updateFrameworkUser(userId, {
        email: detail.item.email,
        phoneNumber: detail.item.phoneNumber,
        displayName: detail.item.displayName,
        actorType: detail.item.actorType,
        avatarUrl: detail.item.avatarUrl,
        organizationName: detail.item.organizationName,
        roleKeys: detail.item.roles.map((role) => role.key),
        password: null,
        isActive,
        isSuperAdmin: detail.item.isSuperAdmin,
      })
      await loadUsers()
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Failed to update user status.")
    } finally {
      setIsMutating(false)
    }
  }

  async function handleDeleteUser() {
    if (!deleteDialogUser) {
      return
    }

    setError(null)
    setIsMutating(true)

    try {
      await deleteFrameworkUser(deleteDialogUser.id)
      setDeleteDialogUser(null)
      setDeleteConfirmationValue("")
      await loadUsers()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete user.")
    } finally {
      setIsMutating(false)
    }
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    if (!open && isMutating) {
      return
    }

    if (!open) {
      setDeleteDialogUser(null)
      setDeleteConfirmationValue("")
    }
  }

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return items.filter((item) => {
      if (!matchesStatusFilter(statusFilter, item.isActive)) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [
        item.displayName,
        item.email,
        item.actorType,
        item.organizationName ?? "",
        item.roles.map((role) => role.name).join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    })
  }, [items, searchValue, statusFilter])

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const canDeleteUsers = auth.user?.isSuperAdmin === true

  if (isLoading && items.length === 0) {
    return <StateCard message="Loading users..." />
  }

  if (error && items.length === 0) {
    return <StateCard message={error} />
  }

  return (
    <SectionShell
      title="Users"
      description="Manage authenticated users and access assignments across the application."
    >
      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <MasterList
        header={{
          pageTitle: "Users",
          pageDescription: "Create and control authenticated users for the shared application shell.",
          addLabel: "New User",
          onAddClick: () => {
            void navigate("/dashboard/settings/users/new")
          },
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search users",
        }}
        filters={buildStatusFilters(statusFilter, (value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        })}
        table={{
          columns: [
            {
              id: "index",
              header: "Sl.No",
              cell: (row) => (
                <span className="text-sm text-foreground">
                  {(currentPage - 1) * pageSize + paginatedItems.indexOf(row) + 1}
                </span>
              ),
              className: "w-20",
            },
            {
              id: "displayName",
              header: "User Name",
              cell: (row) => (
                <Link
                  to={`/dashboard/settings/users/${encodeURIComponent(row.id)}`}
                  className="font-medium text-foreground transition hover:underline"
                >
                  {row.displayName}
                </Link>
              ),
              accessor: (row) => row.displayName,
              sortable: true,
            },
            {
              id: "email",
              header: "Email",
              cell: (row) => <span className="text-sm text-foreground">{row.email}</span>,
              accessor: (row) => row.email,
              sortable: true,
            },
            {
              id: "actorType",
              header: "Actor Type",
              cell: (row) => (
                <Badge variant="outline" className="capitalize">
                  {row.actorType}
                </Badge>
              ),
              accessor: (row) => row.actorType,
              sortable: true,
            },
            {
              id: "roles",
              header: "Roles",
              cell: (row) => (
                <div className="flex flex-wrap gap-1.5">
                  {row.roles.map((role) => (
                    <Badge key={role.key} variant="secondary">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              ),
            },
            {
              id: "status",
              header: "Status",
              cell: (row) => (
                <ActivityStatusBadge active={row.isActive} />
              ),
              accessor: (row) => row.isActive,
              sortable: true,
            },
            {
              id: "actions",
              header: "Actions",
              cell: (row) => (
                <div className="flex justify-end">
                  <RecordActionMenu
                    active={row.isActive}
                    deleteLabel="Delete user"
                    disabled={isMutating}
                    itemLabel={row.displayName}
                    onEdit={() => {
                      void navigate(`/dashboard/settings/users/${encodeURIComponent(row.id)}/edit`)
                    }}
                    onDelete={
                      canDeleteUsers &&
                      !row.isSuperAdmin &&
                      auth.user?.id !== row.id
                        ? () => {
                            setDeleteDialogUser(row)
                            setDeleteConfirmationValue("")
                          }
                        : undefined
                    }
                    onToggleActive={() => {
                      void handleStatusChange(row.id, !row.isActive)
                    }}
                  />
                </div>
              ),
              className: "w-20 text-right",
            },
          ],
          data: paginatedItems,
          loading: isLoading,
          emptyMessage: "No users found.",
          rowKey: (row) => row.id,
        }}
        pagination={{
          currentPage,
          pageSize,
          totalRecords: filteredItems.length,
          onPageChange: setCurrentPage,
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize)
            setCurrentPage(1)
          },
        }}
      />

      <AlertDialog
        open={deleteDialogUser !== null}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Permanently delete user?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This permanently removes{" "}
                <span className="font-medium text-foreground">
                  {deleteDialogUser?.displayName ?? "this user"}
                </span>{" "}
                from the admin users list.
              </span>
              <span className="block">
                Type{" "}
                <span className="font-mono font-semibold text-foreground">
                  {deleteUserConfirmationText}
                </span>{" "}
                to confirm.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="user-delete-confirmation">Confirmation text</Label>
            <Input
              id="user-delete-confirmation"
              value={deleteConfirmationValue}
              onChange={(event) => {
                setDeleteConfirmationValue(event.target.value)
              }}
              placeholder={deleteUserConfirmationText}
              disabled={isMutating}
            />
          </div>
          <AlertDialogFooter className="border-destructive/15 bg-destructive/5">
            <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleDeleteUser()}
              disabled={
                isMutating ||
                deleteConfirmationValue.trim() !== deleteUserConfirmationText
              }
            >
              <Trash2Icon className="size-4" />
              {isMutating ? "Deleting..." : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionShell>
  )
}
