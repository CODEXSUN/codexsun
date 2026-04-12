import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2Icon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  Trash2Icon,
  WifiIcon,
} from "lucide-react"

import type {
  FrappeTodo,
  FrappeTodoPriority,
  FrappeTodoSyncStatus,
  FrappeTodoStatus,
  FrappeTodoUpsertPayload,
} from "@frappe/shared"
import { MasterList } from "@/components/blocks/master-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useDashboardShell } from "@/features/dashboard/dashboard-shell"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { SearchableLookupField } from "@/features/forms/searchable-lookup-field"

import {
  createFrappeTodo,
  deleteFrappeTodos,
  listFrappeTodos,
  syncFrappeTodosLive,
  updateFrappeTodo,
  verifyFrappeTodosSync,
} from "../api/frappe-api"
import { getConnectionStatus } from "../services/frappe"
import {
  createDefaultTodoValues,
  Field,
  StateCard,
  formatDateTime,
  toErrorMessage,
} from "./shared"

const todoStatusOptions: FrappeTodoStatus[] = ["Open", "Closed", "Cancelled"]
const todoPriorityOptions: FrappeTodoPriority[] = ["High", "Medium", "Low"]
const todoSyncStatusCopy: Record<
  FrappeTodoSyncStatus | "unknown",
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  synced: { label: "Synced", variant: "default" },
  not_synced: { label: "Not synced", variant: "destructive" },
  changed: { label: "Changed", variant: "secondary" },
  unknown: { label: "Verify", variant: "outline" },
}

export function FrappeTodosSection() {
  const { user } = useDashboardShell()
  const [items, setItems] = useState<FrappeTodo[]>([])
  const [userOptions, setUserOptions] = useState<
    Array<{ label: string; value: string; disabled?: boolean }>
  >([])
  const [searchValue, setSearchValue] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<FrappeTodoUpsertPayload>(
    createDefaultTodoValues()
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTodoIds, setSelectedTodoIds] = useState<Array<string | number>>([])
  const [syncStatusById, setSyncStatusById] = useState<
    Partial<Record<string, FrappeTodoSyncStatus>>
  >({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [lastSyncedAt, setLastSyncedAt] = useState("")
  const [connectionState, setConnectionState] = useState<"connected" | "failed">("failed")
  const [error, setError] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLiveSyncing, setIsLiveSyncing] = useState(false)
  const [isDeletingSelected, setIsDeletingSelected] = useState(false)
  const [isVerifyingSync, setIsVerifyingSync] = useState(false)
  useGlobalLoading(isLoading || isLiveSyncing || isDeletingSelected || isVerifyingSync)

  async function loadTodos() {
    setIsLoading(true)
    setError(null)

    try {
      const [response, connectionStatus] = await Promise.all([
        listFrappeTodos(),
        getConnectionStatus().catch(() => null),
      ])
      setItems(response.todos.items)
      setSyncStatusById({})
      setConnectionState(
        connectionStatus?.state === "connected" ? "connected" : "failed"
      )
      setUserOptions(
        response.todos.references.users
          .filter((item) => !item.disabled)
          .map((item) => ({
            label: item.label,
            value: item.id,
          }))
      )
      setLastSyncedAt(response.todos.syncedAt)
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTodos()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchValue])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    if (!normalizedSearch) {
      return items
    }

    return items.filter((item) =>
      [
        item.description,
        item.allocatedTo,
        item.allocatedToFullName,
        item.owner,
        item.referenceType,
        item.referenceName,
        item.role,
        item.assignedBy,
        item.sender,
        item.id,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    )
  }, [items, searchValue])

  const totalRecords = filteredItems.length
  const safeCurrentPage = Math.min(
    currentPage,
    Math.max(1, Math.ceil(totalRecords / pageSize))
  )
  const paginatedItems = filteredItems.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )

  function resetForm() {
    setEditingId(null)
    setValues(createDefaultTodoValues())
  }

  function openCreateDialog() {
    resetForm()
    setDialogOpen(true)
  }

  function startEdit(item: FrappeTodo) {
    setEditingId(item.id)
    setValues({
      description: item.description,
      status: item.status,
      priority: item.priority,
      color: item.color,
      dueDate: item.dueDate,
      allocatedTo: item.allocatedTo,
      assignedBy: item.assignedBy,
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    setIsSaving(true)
    setError(null)

    try {
      if (editingId) {
        await updateFrappeTodo(editingId, values)
      } else {
        await createFrappeTodo(values)
      }

      resetForm()
      setDialogOpen(false)
      await loadTodos()
      setSyncStatusById({})
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLiveSync() {
    setIsLiveSyncing(true)
    setError(null)
    setSyncMessage(null)

    try {
      const response = await syncFrappeTodosLive({
        direction: "bidirectional",
        todoIds: [],
      })

      setItems(response.sync.items)
      setSyncStatusById({})
      setConnectionState("connected")
      setLastSyncedAt(response.sync.syncedAt)
      setSyncMessage(
        `Live sync completed: ${response.sync.pushedCount} pushed, ${response.sync.pulledCount} pulled, ${response.sync.failedCount} failed. Frappe records: ${response.sync.frappeRecordCount}; app records: ${response.sync.appRecordCount}; difference: ${response.sync.recordCountDifference}.`
      )
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsLiveSyncing(false)
    }
  }

  async function handlePushSelected() {
    const todoIds = selectedTodoIds.map(String)

    if (todoIds.length === 0) {
      setError("Select at least one ToDo to push.")
      return
    }

    setIsLiveSyncing(true)
    setError(null)
    setSyncMessage(null)

    try {
      const response = await syncFrappeTodosLive({
        direction: "push",
        todoIds,
      })

      setItems(response.sync.items)
      setSyncStatusById({})
      setConnectionState("connected")
      setSelectedTodoIds([])
      setLastSyncedAt(response.sync.syncedAt)
      setSyncMessage(
        `Selected push completed: ${response.sync.pushedCount} pushed, ${response.sync.failedCount} failed. Frappe records: ${response.sync.frappeRecordCount}; app records: ${response.sync.appRecordCount}.`
      )
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsLiveSyncing(false)
    }
  }

  async function handleDeleteSelected() {
    const todoIds = selectedTodoIds.map(String)

    if (todoIds.length === 0) {
      setError("Select at least one ToDo to delete.")
      return
    }

    setIsDeletingSelected(true)
    setError(null)
    setSyncMessage(null)

    try {
      const response = await deleteFrappeTodos({ todoIds })
      setItems(response.items)
      setSyncStatusById({})
      setSelectedTodoIds([])
      setSyncMessage(
        `Deleted ${response.deletedCount} local ToDo snapshot${response.deletedCount === 1 ? "" : "s"}.`
      )
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsDeletingSelected(false)
    }
  }

  async function handleVerifySync() {
    setIsVerifyingSync(true)
    setError(null)
    setSyncMessage(null)

    try {
      const response = await verifyFrappeTodosSync()
      setConnectionState("connected")
      setSyncStatusById(
        Object.fromEntries(
          response.verification.items.map((item) => [item.todoId, item.status])
        )
      )
      setSyncMessage(
        `Verify completed: ${response.verification.syncedCount} synced, ${response.verification.notSyncedCount} not synced, ${response.verification.changedCount} changed across ${response.verification.checkedCount} app records.`
      )
      setLastSyncedAt(response.verification.verifiedAt)
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsVerifyingSync(false)
    }
  }

  if (isLoading) {
    return null
  }

  const openCount = items.filter((item) => item.status === "Open").length
  const selectedCount = selectedTodoIds.length

  return (
    <div
      className="space-y-3"
      data-technical-name="section.frappe.todos"
    >
      {error ? <StateCard message={error} /> : null}

      <MasterList
        header={{
          pageTitle: (
            <span className="inline-flex items-center gap-2">
              ToDos
              <span
                className={`size-2.5 rounded-full ${
                  connectionState === "connected"
                    ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.14)]"
                    : "bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.14)]"
                }`}
                title={
                  connectionState === "connected"
                    ? "ERP connection is live"
                    : "ERP connection is not verified"
                }
                aria-label={
                  connectionState === "connected"
                    ? "ERP connection is live"
                    : "ERP connection is not verified"
                }
              />
            </span>
          ),
          pageDescription:
            `${totalRecords} records, ${openCount} open${lastSyncedAt ? `, last sync ${formatDateTime(lastSyncedAt)}` : ""}.`,
          technicalName: "section.frappe.todos.master-list",
          actions: (
            <div className="flex flex-col items-end gap-1">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  className="h-9 gap-2 border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                  onClick={() => void loadTodos()}
                  disabled={isLoading}
                >
                  <RefreshCwIcon className="size-4" />
                  Refresh
                </Button>
                {user.isSuperAdmin ? (
                  <>
                    <Button
                      variant="outline"
                      className="h-9 gap-2 border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                      onClick={() => void handlePushSelected()}
                      disabled={isLiveSyncing || selectedCount === 0}
                    >
                      <SendIcon className="size-4" />
                      Push {selectedCount > 0 ? `(${selectedCount})` : ""}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 gap-2 border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                      onClick={() => void handleLiveSync()}
                      disabled={isLiveSyncing}
                    >
                      <WifiIcon className="size-4" />
                      {isLiveSyncing ? "Syncing..." : "Live Sync"}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 gap-2 border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100"
                      onClick={() => void handleVerifySync()}
                      disabled={isVerifyingSync}
                    >
                      <CheckCircle2Icon className="size-4" />
                      {isVerifyingSync ? "Verifying..." : "Verify"}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 gap-2 border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100"
                      onClick={() => void handleDeleteSelected()}
                      disabled={isDeletingSelected || selectedCount === 0}
                    >
                      <Trash2Icon className="size-4" />
                      Delete {selectedCount > 0 ? `(${selectedCount})` : ""}
                    </Button>
                    <Button
                      className="h-9 gap-2 bg-slate-950 text-white hover:bg-slate-800"
                      onClick={openCreateDialog}
                    >
                      <PlusIcon className="size-4" />
                      Create ToDo
                    </Button>
                  </>
                ) : null}
              </div>
              {syncMessage ? (
                <p
                  className="max-w-3xl text-right text-xs leading-5 text-muted-foreground"
                  aria-live="polite"
                >
                  {syncMessage}
                </p>
              ) : null}
            </div>
          ),
        }}
        search={{
          value: searchValue,
          onChange: setSearchValue,
          placeholder: "Search ToDo, reference, role, owner, assignee, or ERP id",
        }}
        table={{
          technicalName: "table.frappe.todos",
          columns: [
            {
              id: "todo",
              header: "ToDo",
              sortable: true,
              accessor: (item) => item.description,
              cell: (item) => (
                <div className="space-y-1">
                  <p className="font-medium leading-5 text-foreground">
                    {item.description}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {item.id}
                  </p>
                </div>
              ),
              className: "min-w-[280px]",
            },
            {
              id: "status",
              header: "Status",
              sortable: true,
              accessor: (item) => item.status,
              cell: (item) => (
                <Badge variant={item.status === "Closed" ? "default" : "outline"}>
                  {item.status}
                </Badge>
              ),
            },
            {
              id: "priority",
              header: "Priority",
              sortable: true,
              accessor: (item) => item.priority,
              cell: (item) => (
                <Badge
                  variant={item.priority === "High" ? "destructive" : "secondary"}
                >
                  {item.priority}
                </Badge>
              ),
            },
            {
              id: "syncStatus",
              header: "Sync",
              sortable: true,
              accessor: (item) => syncStatusById[item.id] ?? "unknown",
              cell: (item) => {
                const syncStatus = syncStatusById[item.id] ?? "unknown"
                const copy = todoSyncStatusCopy[syncStatus]

                return (
                  <Badge variant={copy.variant}>
                    {copy.label}
                  </Badge>
                )
              },
            },
            {
              id: "color",
              header: "Color",
              accessor: (item) => item.color,
              cell: (item) =>
                item.color ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full border border-border"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.color}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                ),
              defaultVisible: false,
            },
            {
              id: "assigned",
              header: "Assigned",
              sortable: true,
              accessor: (item) =>
                `${item.allocatedTo} ${item.assignedBy} ${item.owner}`,
              cell: (item) => (
                <div className="space-y-1 text-sm">
                  <p className="text-foreground">
                    {item.allocatedToFullName || item.allocatedTo || "Unassigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.allocatedToFullName && item.allocatedTo
                      ? item.allocatedTo
                      : "No allocated user id"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Assigned by: {item.assignedByFullName || item.assignedBy || "None"}
                  </p>
                </div>
              ),
            },
            {
              id: "reference",
              header: "Reference",
              sortable: true,
              accessor: (item) => `${item.referenceType} ${item.referenceName}`,
              cell: (item) => (
                <div className="space-y-1 text-sm">
                  <p className="text-foreground">
                    {item.referenceType || "No reference type"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.referenceName || "No reference name"}
                  </p>
                </div>
              ),
              defaultVisible: false,
            },
            {
              id: "role",
              header: "Role",
              sortable: true,
              accessor: (item) => item.role,
              cell: (item) => (
                <span className="text-sm text-muted-foreground">
                  {item.role || "-"}
                </span>
              ),
              defaultVisible: false,
            },
            {
              id: "assignmentRule",
              header: "Assignment Rule",
              sortable: true,
              accessor: (item) => item.assignmentRule,
              cell: (item) => (
                <span className="text-sm text-muted-foreground">
                  {item.assignmentRule || "-"}
                </span>
              ),
              defaultVisible: false,
            },
            {
              id: "modified",
              header: "Modified",
              sortable: true,
              accessor: (item) => item.modifiedAt,
              cell: (item) => (
                <span className="text-sm text-muted-foreground">
                  {formatDateTime(item.modifiedAt)}
                </span>
              ),
            },
            {
              id: "actions",
              header: "Actions",
              cell: (item) =>
                user.isSuperAdmin ? (
                  <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                    Edit
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">View only</span>
                ),
              className: "w-24 text-right",
              headerClassName: "w-24 text-right",
            },
          ],
          data: paginatedItems,
          emptyMessage: "No Frappe ToDos found.",
          rowKey: (item) => item.id,
        }}
        rowSelection={{
          selectedRowIds: selectedTodoIds,
          onSelectedRowIdsChange: setSelectedTodoIds,
          selectionLabel: "Select Frappe ToDos",
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Total ToDos:{" "}
                <span className="font-medium text-foreground">{totalRecords}</span>
              </span>
              <span>
                Open:{" "}
                <span className="font-medium text-foreground">{openCount}</span>
              </span>
            </div>
          ),
        }}
        pagination={{
          currentPage: safeCurrentPage,
          pageSize,
          totalRecords,
          onPageChange: setCurrentPage,
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize)
            setCurrentPage(1)
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(nextOpen) => {
          setDialogOpen(nextOpen)
          if (!nextOpen) {
            resetForm()
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit ToDo" : "Create ToDo"}</DialogTitle>
            <DialogDescription>
              Super-admin only. Changes stay in the Frappe connector snapshot and
              are pushed to ERPNext by live sync.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {user.isSuperAdmin ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Status">
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      value={values.status}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          status: event.target.value as FrappeTodoStatus,
                        }))
                      }
                    >
                      {todoStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Color">
                    <Input
                      value={values.color}
                      placeholder="#22c55e"
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          color: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Priority">
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      value={values.priority}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          priority: event.target.value as FrappeTodoPriority,
                        }))
                      }
                    >
                      {todoPriorityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Due Date">
                    <Input
                      type="date"
                      value={values.dueDate}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          dueDate: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Allocated To">
                    <SearchableLookupField
                      value={values.allocatedTo}
                      onValueChange={(nextValue) =>
                        setValues((current) => ({
                          ...current,
                          allocatedTo: nextValue,
                        }))
                      }
                      options={userOptions}
                      placeholder="Select allocated user"
                      searchPlaceholder="Search ERPNext users"
                      allowEmptyOption
                      emptyOptionLabel="Unassigned"
                      noResultsMessage="No ERPNext users found."
                    />
                  </Field>
                </div>
                <Field label="Description" hint="ERPNext ToDo uses a required Text Editor field.">
                  <Textarea
                    value={values.description}
                    className="min-h-44"
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </Field>
                <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
                  <Field label="Assigned By">
                    <SearchableLookupField
                      value={values.assignedBy}
                      onValueChange={(nextValue) =>
                        setValues((current) => ({
                          ...current,
                          assignedBy: nextValue,
                        }))
                      }
                      options={userOptions}
                      placeholder="Select assigning user"
                      searchPlaceholder="Search ERPNext users"
                      allowEmptyOption
                      emptyOptionLabel="No assigned by"
                      noResultsMessage="No ERPNext users found."
                    />
                  </Field>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Only the super-admin actor can create or update ToDo snapshots.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSaving || !user.isSuperAdmin}
            >
              {isSaving ? "Saving..." : editingId ? "Save ToDo" : "Create ToDo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
