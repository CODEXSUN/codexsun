import { useEffect, useMemo, useState } from "react"
import { EditIcon, MoreHorizontalIcon, PowerIcon } from "lucide-react"

import type { CommonListActiveFilter, CommonListColumn } from "@/components/forms/CommonList"
import type { CommonUpsertFormValues } from "@/components/forms/CommonUpsertDialog"
import type { CommonMasterDefinition, CommonMasterFieldDefinition } from "@/components/forms/commonMasterTypes"
import { Button } from "@/components/ui/button"
import { ActiveStatusBadge } from "@/components/ui/status-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CommonMasterItem } from "@/types/common"
import { HttpError } from "@/shared/api/client"
import { showFailedActionToast, showSavedToast, showStatusChangeToast } from "@/shared/notifications/toast"

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Something went wrong while loading records."
}

function defaultInitialValues(fields: CommonMasterFieldDefinition[]) {
  const initialValues = fields.reduce<CommonUpsertFormValues>((accumulator, field) => {
    if (field.type === 'number' || field.parseAs === 'number') {
      accumulator[field.key] = 0
      return accumulator
    }

    accumulator[field.key] = ''
    return accumulator
  }, { isActive: true })

  return initialValues
}

function toFormValue(value: unknown): string | number | boolean {
  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return value
  }

  return ''
}

function getItemLabel(item: CommonMasterItem) {
  const labelKeys = ["name", "code", "title", "label", "displayName"] as const

  for (const key of labelKeys) {
    const value = item[key as keyof CommonMasterItem]
    if (typeof value === "string" && value.trim().length > 0) {
      return value
    }
  }

  return item.id.slice(-4).toUpperCase()
}

export function useCommonMasterState(definition: CommonMasterDefinition) {
  const [items, setItems] = useState<CommonMasterItem[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [editingItem, setEditingItem] = useState<CommonMasterItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [resolvedFields, setResolvedFields] = useState(definition.fields)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const [records, loadedFields] = await Promise.all([
          definition.api.list(),
          Promise.all(definition.fields.map(async (field) => {
            if (!field.loadOptions) {
              return field
            }

            return {
              ...field,
              options: await field.loadOptions(),
            }
          })),
        ])

        if (!isMounted) {
          return
        }

        setItems(records)
        setResolvedFields(loadedFields)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(toErrorMessage(error))
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [definition])

  const normalizedSearch = searchValue.trim().toLowerCase()

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = normalizedSearch.length === 0 || definition.columns.some((column) => {
        const value = column.accessor(item)
        return value !== null && value !== undefined
          ? String(value).toLowerCase().includes(normalizedSearch)
          : false
      })

      const matchesStatus = statusFilter === "all"
        || (statusFilter === "active" && item.isActive)
        || (statusFilter === "inactive" && !item.isActive)

      return matchesSearch && matchesStatus
    })
  }, [definition.columns, items, normalizedSearch, statusFilter])

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  const activeFilters: CommonListActiveFilter[] = statusFilter === "all"
    ? []
    : [{ key: "status", label: "Status", value: statusFilter === "active" ? "Active" : "Inactive" }]

  const initialValues: CommonUpsertFormValues = editingItem
    ? (definition.toFormValues?.(editingItem)
      ?? resolvedFields.reduce<CommonUpsertFormValues>((accumulator, field) => {
        const value = editingItem[field.key as keyof CommonMasterItem]
        accumulator[field.key] = toFormValue(value)
        return accumulator
      }, { isActive: editingItem.isActive }))
    : defaultInitialValues(resolvedFields)

  const openCreateDialog = () => {
    setDialogMode("create")
    setEditingItem(null)
    setDialogError(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (item: CommonMasterItem) => {
    setDialogMode("edit")
    setEditingItem(item)
    setDialogError(null)
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (item: CommonMasterItem) => {
    setErrorMessage(null)

    try {
      if (item.isActive) {
        await definition.api.delete(item.id)
      } else {
        await definition.api.restore(item.id)
      }

      setItems((current) => current.map((entry) => (
        entry.id === item.id
          ? { ...entry, isActive: !entry.isActive }
          : entry
      )))
      showStatusChangeToast({
        entityLabel: definition.entityLabel,
        recordName: getItemLabel(item),
        referenceId: item.id,
        action: item.isActive ? "deactivate" : "restore",
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: definition.entityLabel,
        action: item.isActive ? "deactivate" : "restore",
        detail: message,
      })
    }
  }

  const handleSubmit = async (values: CommonUpsertFormValues) => {
    setDialogError(null)
    setErrorMessage(null)

    try {
      const request = definition.toRequest(values)

      if (dialogMode === "edit" && editingItem) {
        const updated = await definition.api.update(editingItem.id, request)
        setItems((current) => current.map((entry) => entry.id === updated.id ? updated : entry))
        showSavedToast({
          entityLabel: definition.entityLabel,
          recordName: getItemLabel(updated),
          referenceId: updated.id,
          mode: "update",
        })
        return
      }

      const created = await definition.api.create(request)
      setItems((current) => [created, ...current])
      showSavedToast({
        entityLabel: definition.entityLabel,
        recordName: getItemLabel(created),
        referenceId: created.id,
        mode: "create",
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setDialogError(message)
      showFailedActionToast({
        entityLabel: definition.entityLabel,
        action: dialogMode === "edit" ? "update" : "save",
        detail: message,
      })
      throw error
    }
  }

  const columns: CommonListColumn<CommonMasterItem>[] = [
    {
      id: "serialNumber",
      header: "Sl.No",
      cell: (item) => ((safeCurrentPage - 1) * pageSize) + paginatedItems.findIndex((entry) => entry.id === item.id) + 1,
      className: "w-12 min-w-12 px-2 text-center text-foreground",
      headerClassName: "w-12 min-w-12 px-2 text-center",
      sticky: "left",
    },
    ...definition.columns.map((column) => ({
      id: column.id,
      header: column.header,
      sortable: true,
      accessor: column.accessor,
      cell: (item: CommonMasterItem) => column.cell
        ? column.cell(item)
        : <span className="text-foreground">{String(column.accessor(item) ?? "")}</span>,
      className: column.className,
      headerClassName: column.headerClassName,
      sticky: column.sticky,
    })),
    {
      id: "status",
      header: "Status",
      sortable: true,
      accessor: (item) => item.isActive,
      cell: (item) => (
        <ActiveStatusBadge isActive={item.isActive} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      className: "w-12 min-w-12 px-2 text-center",
      headerClassName: "w-12 min-w-12 px-2 text-center",
      sticky: "right",
      cell: (item) => (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="icon-sm" variant="ghost" className="rounded-md font-semibold">
                <MoreHorizontalIcon className="size-4 stroke-[2.5]" />
                <span className="sr-only">Open actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-0 w-auto whitespace-nowrap">
              <DropdownMenuItem onClick={() => openEditDialog(item)}>
                <EditIcon className="size-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleToggleActive(item)}>
                <PowerIcon className="size-4" />
                <span>{item.isActive ? "Deactivate" : "Restore"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return {
    addLabel: `New ${definition.entityLabel}`,
    resolvedFields,
    dialogError,
    openCreateDialog,
    search: {
      value: searchValue,
      onChange: (value: string) => {
        setSearchValue(value)
        setCurrentPage(1)
      },
      placeholder: definition.searchPlaceholder,
    },
    filters: {
      buttonLabel: `${definition.entityLabel} filters`,
      options: [
        { key: "all", label: "All records", isActive: statusFilter === "all", onSelect: () => setStatusFilter("all") },
        { key: "active", label: "Active only", isActive: statusFilter === "active", onSelect: () => setStatusFilter("active") },
        { key: "inactive", label: "Inactive only", isActive: statusFilter === "inactive", onSelect: () => setStatusFilter("inactive") },
      ],
      activeFilters,
      onRemoveFilter: () => setStatusFilter("all"),
      onClearAllFilters: () => {
        setStatusFilter("all")
        setCurrentPage(1)
      },
    },
    table: {
      columns,
      data: paginatedItems,
      loading,
      loadingMessage: `Loading ${definition.entityLabel.toLowerCase()} records...`,
      emptyMessage: errorMessage ?? `No ${definition.entityLabel.toLowerCase()} records found.`,
      rowKey: (item: CommonMasterItem) => item.id,
    },
    footerContent: (
      <div className="flex flex-wrap items-center gap-4">
        <span>
          Total records: <span className="font-medium text-foreground">{totalRecords}</span>
        </span>
        <span>
          Active records: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.isActive).length}</span>
        </span>
      </div>
    ),
    pagination: {
      currentPage: safeCurrentPage,
      pageSize,
      totalRecords,
      onPageChange: setCurrentPage,
      onPageSizeChange: (value: number) => {
        setPageSize(value)
        setCurrentPage(1)
      },
    },
    dialog: {
      open: isDialogOpen,
      mode: dialogMode,
      initialValues,
      onOpenChange: (open: boolean) => {
        setIsDialogOpen(open)
        if (!open) {
          setDialogError(null)
        }
      },
      onSubmit: handleSubmit,
    },
  }
}
