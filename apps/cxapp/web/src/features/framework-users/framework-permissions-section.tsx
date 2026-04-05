import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import type { AuthPermissionListResponse } from "@cxapp/shared"

import { Badge } from "@/components/ui/badge"
import { MasterList } from "@/components/blocks/master-list"
import { RecordActionMenu } from "@/components/blocks/record-action-menu"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { ActivityStatusBadge } from "@/features/status/activity-status"

import {
  getFrameworkPermission,
  listFrameworkPermissions,
  updateFrameworkPermission,
} from "./user-api"
import { SectionShell, StateCard, toTitleCase } from "./user-shared"

type StatusFilterValue = "all" | "active" | "inactive"

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
      { key: "all", label: "All records", isActive: statusFilter === "all", onSelect: () => onChange("all") },
      { key: "active", label: "Active only", isActive: statusFilter === "active", onSelect: () => onChange("active") },
      { key: "inactive", label: "Inactive only", isActive: statusFilter === "inactive", onSelect: () => onChange("inactive") },
    ],
    activeFilters:
      statusFilter === "all"
        ? []
        : [{ key: "status", label: "Status", value: statusFilter === "active" ? "Active only" : "Inactive only" }],
    onRemoveFilter: () => onChange("all"),
    onClearAllFilters: () => onChange("all"),
  }
}

export function FrameworkPermissionsSection() {
  const navigate = useNavigate()
  const [items, setItems] = useState<AuthPermissionListResponse["items"]>([])
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  useGlobalLoading(isLoading || isMutating)

  async function loadPermissions() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await listFrameworkPermissions()
      setItems(response.items)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load permissions.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPermissions()
  }, [])

  async function handleStatusChange(permissionId: string, isActive: boolean) {
    setError(null)
    setIsMutating(true)

    try {
      const detail = await getFrameworkPermission(permissionId)
      await updateFrameworkPermission(permissionId, {
        key: detail.item.key,
        name: detail.item.name,
        summary: detail.item.summary,
        scopeType: detail.item.scopeType,
        appId: detail.item.appId,
        resourceKey: detail.item.resourceKey,
        actionKey: detail.item.actionKey,
        route: detail.item.route,
        isActive,
      })
      await loadPermissions()
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Failed to update permission.")
    } finally {
      setIsMutating(false)
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
        item.name,
        item.key,
        item.scopeType,
        item.appId ?? "",
        item.resourceKey,
        item.actionKey,
        item.route ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    })
  }, [items, searchValue, statusFilter])

  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  if (isLoading && items.length === 0) {
    return <StateCard message="Loading permissions..." />
  }

  if (error && items.length === 0) {
    return <StateCard message={error} />
  }

  return (
    <SectionShell
      title="Permission Manager"
      description="Manage permission definitions for desk, workspace, module, page, report, and module definition control."
    >
      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <MasterList
        header={{
          pageTitle: "Permissions",
          pageDescription: "Define permission keys and scope metadata used by roles and access control.",
          addLabel: "New Permission",
          onAddClick: () => {
            void navigate("/dashboard/settings/permissions/new")
          },
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search permissions",
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
              cell: (row) => <span className="text-sm text-foreground">{(currentPage - 1) * pageSize + paginatedItems.indexOf(row) + 1}</span>,
              className: "w-20",
            },
            {
              id: "name",
              header: "Permission",
              cell: (row) => (
                <button
                  type="button"
                  className="font-medium text-foreground transition hover:underline"
                  onClick={() => void navigate(`/dashboard/settings/permissions/${encodeURIComponent(row.key)}/edit`)}
                >
                  {row.name}
                </button>
              ),
              accessor: (row) => row.name,
              sortable: true,
            },
            {
              id: "scopeType",
              header: "Scope",
              cell: (row) => <Badge variant="outline">{toTitleCase(row.scopeType)}</Badge>,
              accessor: (row) => row.scopeType,
              sortable: true,
            },
            {
              id: "resourceKey",
              header: "Resource",
              cell: (row) => (
                <div className="space-y-0.5">
                  <p className="text-sm text-foreground">{row.resourceKey}</p>
                  <p className="text-xs text-muted-foreground">{row.actionKey}</p>
                </div>
              ),
            },
            {
              id: "appId",
              header: "App",
              cell: (row) => <span className="text-sm text-foreground">{row.appId ?? "-"}</span>,
              accessor: (row) => row.appId ?? "",
              sortable: true,
            },
            {
              id: "status",
              header: "Status",
              cell: (row) => <ActivityStatusBadge active={row.isActive} />,
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
                    itemLabel={row.name}
                    onEdit={() => {
                      void navigate(`/dashboard/settings/permissions/${encodeURIComponent(row.key)}/edit`)
                    }}
                    onToggleActive={() => {
                      void handleStatusChange(row.key, !row.isActive)
                    }}
                  />
                </div>
              ),
              className: "w-20 text-right",
            },
          ],
          data: paginatedItems,
          loading: isLoading,
          emptyMessage: "No permissions found.",
          rowKey: (row) => row.key,
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
    </SectionShell>
  )
}
