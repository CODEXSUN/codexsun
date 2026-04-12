import { useEffect, useMemo, useState } from "react"

import type {
  FrappeTodo,
  FrappeTodoPriority,
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

import {
  createFrappeTodo,
  listFrappeTodos,
  syncFrappeTodosLive,
  updateFrappeTodo,
} from "../api/frappe-api"
import {
  createDefaultTodoValues,
  Field,
  MetricCard,
  SectionShell,
  StateCard,
  formatDateTime,
  toErrorMessage,
} from "./shared"

const todoStatusOptions: FrappeTodoStatus[] = ["Open", "Closed", "Cancelled"]
const todoPriorityOptions: FrappeTodoPriority[] = ["High", "Medium", "Low"]

export function FrappeTodosSection() {
  const { user } = useDashboardShell()
  const [items, setItems] = useState<FrappeTodo[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<FrappeTodoUpsertPayload>(
    createDefaultTodoValues()
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [lastSyncedAt, setLastSyncedAt] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLiveSyncing, setIsLiveSyncing] = useState(false)
  useGlobalLoading(isLoading || isLiveSyncing)

  async function loadTodos() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await listFrappeTodos()
      setItems(response.todos.items)
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
      referenceType: item.referenceType,
      referenceName: item.referenceName,
      role: item.role,
      assignedBy: item.assignedBy,
      sender: item.sender,
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
      })

      setItems(response.sync.items)
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

  if (isLoading) {
    return null
  }

  const openCount = items.filter((item) => item.status === "Open").length
  const highPriorityCount = items.filter((item) => item.priority === "High").length

  return (
    <SectionShell
      title="Frappe ToDo"
      description="Manage app-owned ToDo snapshots that operators can stage before or after ERPNext synchronization."
      actions={(
        <Button variant="outline" onClick={() => void loadTodos()}>
          Refresh
        </Button>
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Records"
          value={items.length}
          hint="Current ToDo snapshots owned by the Frappe app."
        />
        <MetricCard
          label="Open"
          value={openCount}
          hint="Outstanding operator actions still in progress."
        />
        <MetricCard
          label="High Priority"
          value={highPriorityCount}
          hint="Items that need immediate operational follow-up."
        />
        <MetricCard
          label="Last Sync"
          value={lastSyncedAt ? formatDateTime(lastSyncedAt) : "Pending"}
          hint="Most recent snapshot refresh time."
        />
      </div>

      {error ? <StateCard message={error} /> : null}
      {syncMessage ? <StateCard message={syncMessage} /> : null}

      <MasterList
        header={{
          pageTitle: "ToDo Snapshots",
          pageDescription:
            "Review ERPNext ToDo records and local connector snapshots from one operational list.",
          technicalName: "section.frappe.todos.master-list",
          actions: user.isSuperAdmin ? (
            <Button
              variant="outline"
              onClick={() => void handleLiveSync()}
              disabled={isLiveSyncing}
            >
              {isLiveSyncing ? "Syncing..." : "Live Sync"}
            </Button>
          ) : null,
          addLabel: user.isSuperAdmin ? "Create ToDo" : undefined,
          onAddClick: user.isSuperAdmin ? openCreateDialog : undefined,
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
                    {item.allocatedTo || "Unassigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    By: {item.assignedByFullName || item.assignedBy || "None"}
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
                    <Input
                      value={values.allocatedTo}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          allocatedTo: event.target.value,
                        }))
                      }
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
                  <Field label="Reference Type">
                    <Input
                      value={values.referenceType}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          referenceType: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Role">
                    <Input
                      value={values.role}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          role: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Reference Name">
                    <Input
                      value={values.referenceName}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          referenceName: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Assigned By">
                    <Input
                      value={values.assignedBy}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          assignedBy: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Sender">
                    <Input
                      value={values.sender}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          sender: event.target.value,
                        }))
                      }
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
    </SectionShell>
  )
}
