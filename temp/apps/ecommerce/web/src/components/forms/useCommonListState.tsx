import { useMemo, useState } from "react"
import { EditIcon, MoreHorizontalIcon, PowerIcon } from "lucide-react"

import type { CommonListActiveFilter, CommonListColumn } from "@/components/forms/CommonList"
import type {
  CommonUpsertFieldDefinition,
  CommonUpsertFormValues,
} from "@/components/forms/CommonUpsertDialog"
import { Button } from "@/components/ui/button"
import { ActiveStatusBadge } from "@/components/ui/status-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type CommonListRecord = {
  id: number
  isActive: boolean
} & Record<string, string | number | boolean>

type UseCommonListStateOptions<TItem extends CommonListRecord> = {
  entityLabel: string
  fields: CommonUpsertFieldDefinition[]
  initialItems: TItem[]
  searchPlaceholder: string
}

export function useCommonListState<TItem extends CommonListRecord>({
  entityLabel,
  fields,
  initialItems,
  searchPlaceholder,
}: UseCommonListStateOptions<TItem>) {
  const [items, setItems] = useState<TItem[]>(initialItems)
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [editingItem, setEditingItem] = useState<TItem | null>(null)

  const normalizedSearch = searchValue.trim().toLowerCase()

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = normalizedSearch.length === 0 || fields.some((field) => {
        const value = item[field.key]
        return typeof value === "string" || typeof value === "number"
          ? String(value).toLowerCase().includes(normalizedSearch)
          : false
      })

      const matchesStatus = statusFilter === "all"
        || (statusFilter === "active" && item.isActive)
        || (statusFilter === "inactive" && !item.isActive)

      return matchesSearch && matchesStatus
    })
  }, [fields, items, normalizedSearch, statusFilter])

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  const activeFilters: CommonListActiveFilter[] = statusFilter === "all"
    ? []
    : [{ key: "status", label: "Status", value: statusFilter === "active" ? "Active" : "Inactive" }]

  const openCreateDialog = () => {
    setDialogMode("create")
    setEditingItem(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (item: TItem) => {
    setDialogMode("edit")
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  const handleToggleActive = (item: TItem) => {
    setItems((current) => current.map((entry) => (
      entry.id === item.id ? { ...entry, isActive: !entry.isActive } : entry
    )))
  }

  const handleSubmit = (values: CommonUpsertFormValues) => {
    if (dialogMode === "edit" && editingItem) {
      setItems((current) => current.map((entry) => (
        entry.id === editingItem.id
          ? { ...entry, ...values }
          : entry
      )))
      return
    }

    const nextId = currentMaxId(items) + 1
    setItems((current) => [
      { id: nextId, ...values } as TItem,
      ...current,
    ])
  }

  const initialValues: CommonUpsertFormValues = editingItem
    ? editingItem
    : { isActive: true, ...Object.fromEntries(fields.map((field) => [field.key, field.type === "number" ? 0 : ""])) }

  const columns: CommonListColumn<TItem>[] = [
    {
      id: "serialNumber",
      header: "Sl.No",
      cell: (item) => ((safeCurrentPage - 1) * pageSize) + paginatedItems.findIndex((entry) => entry.id === item.id) + 1,
      className: "w-12 min-w-12 px-2 text-center text-foreground",
      headerClassName: "w-12 min-w-12 px-2 text-center",
      sticky: "left",
    },
    ...fields.map((field) => ({
      id: field.key,
      header: field.label,
      sortable: true,
      accessor: (item: TItem) => item[field.key],
      cell: (item: TItem) => <span className="text-foreground">{String(item[field.key] ?? "")}</span>,
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
              <DropdownMenuItem onClick={() => handleToggleActive(item)}>
                <PowerIcon className="size-4" />
                <span>{item.isActive ? "Deactivate" : "Activate"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return {
    addLabel: `New ${entityLabel}`,
    openCreateDialog,
    search: {
      value: searchValue,
      onChange: (value: string) => {
        setSearchValue(value)
        setCurrentPage(1)
      },
      placeholder: searchPlaceholder,
    },
    filters: {
      buttonLabel: `${entityLabel} filters`,
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
      emptyMessage: `No ${entityLabel.toLowerCase()} records found.`,
      rowKey: (item: TItem) => item.id,
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
      onOpenChange: setIsDialogOpen,
      onSubmit: handleSubmit,
    },
  }
}

function currentMaxId<TItem extends CommonListRecord>(items: TItem[]) {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0)
}
