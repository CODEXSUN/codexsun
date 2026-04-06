import { Plus, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import type { MailboxTemplateListResponse } from "@cxapp/shared"

import { MasterList } from "@/components/blocks/master-list"
import { RecordActionMenu } from "@/components/blocks/record-action-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { ActivityStatusBadge } from "@/features/status/activity-status"

import { SectionShell, StateCard } from "../framework-users/user-shared"
import {
  deactivateFrameworkMailboxTemplate,
  listFrameworkMailboxTemplates,
  restoreFrameworkMailboxTemplate,
} from "./mail-api"

type StatusFilterValue = "all" | "active" | "inactive"

function buildStatusFilters(
  statusFilter: StatusFilterValue,
  onChange: (value: StatusFilterValue) => void
) {
  return {
    options: [
      {
        key: "all",
        label: "All templates",
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
        : [{ key: "status", label: "Status", value: statusFilter }],
    onRemoveFilter: () => onChange("all"),
    onClearAllFilters: () => onChange("all"),
  }
}

export function FrameworkMailTemplatesSection() {
  const navigate = useNavigate()
  const [items, setItems] = useState<MailboxTemplateListResponse["items"]>([])
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  useGlobalLoading(isLoading || isMutating)

  async function loadTemplates() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await listFrameworkMailboxTemplates(true)
      setItems(response.items)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load mail templates."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTemplates()
  }, [])

  async function handleToggleActive(templateId: string, isActive: boolean) {
    setIsMutating(true)
    setError(null)

    try {
      if (isActive) {
        await deactivateFrameworkMailboxTemplate(templateId)
      } else {
        await restoreFrameworkMailboxTemplate(templateId)
      }
      await loadTemplates()
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to update template status."
      )
    } finally {
      setIsMutating(false)
    }
  }

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return items.filter((item) => {
      if (statusFilter === "active" && !item.isActive) {
        return false
      }

      if (statusFilter === "inactive" && item.isActive) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [item.name, item.code, item.category, item.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    })
  }, [items, searchValue, statusFilter])

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  if (isLoading && items.length === 0) {
    return <StateCard message="Loading mail templates..." />
  }

  if (error && items.length === 0) {
    return <StateCard message={error} />
  }

  return (
    <SectionShell
      title="Mail Templates"
      description="Own reusable transactional email layouts for OTP, password reset, notifications, and custom outbound messages."
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/dashboard/mail-service">
              <Sparkles className="size-4" />
              Message history
            </Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard/mail-service/templates/new">
              <Plus className="size-4" />
              New template
            </Link>
          </Button>
        </>
      }
    >
      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <MasterList
        header={{
          pageTitle: "Template library",
          pageDescription: "Templates render HTML and text from placeholder data and are reusable anywhere the mail service is called.",
          addLabel: "New template",
          onAddClick: () => {
            void navigate("/dashboard/mail-service/templates/new")
          },
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search templates",
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
              id: "name",
              header: "Template",
              cell: (row) => (
                <div className="space-y-1">
                  <Link
                    to={`/dashboard/mail-service/templates/${encodeURIComponent(row.id)}/edit`}
                    className="font-medium text-foreground transition hover:underline"
                  >
                    {row.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{row.description ?? row.code}</p>
                </div>
              ),
              accessor: (row) => row.name,
              sortable: true,
            },
            {
              id: "code",
              header: "Code",
              cell: (row) => <span className="text-sm text-foreground">{row.code}</span>,
              accessor: (row) => row.code,
              sortable: true,
            },
            {
              id: "category",
              header: "Category",
              cell: (row) => <Badge variant="secondary">{row.category}</Badge>,
              accessor: (row) => row.category,
              sortable: true,
            },
            {
              id: "status",
              header: "Status",
              cell: (row) => (
                <div className="flex flex-wrap gap-2">
                  <ActivityStatusBadge active={row.isActive} />
                  {row.isSystem ? <Badge variant="outline">System</Badge> : null}
                </div>
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
                    itemLabel={row.name}
                    onEdit={() => {
                      void navigate(
                        `/dashboard/mail-service/templates/${encodeURIComponent(row.id)}/edit`
                      )
                    }}
                    onToggleActive={() => {
                      void handleToggleActive(row.id, row.isActive)
                    }}
                  />
                </div>
              ),
              className: "w-20 text-right",
            },
          ],
          data: paginatedItems,
          loading: isLoading,
          emptyMessage: "No mail templates found.",
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
    </SectionShell>
  )
}
