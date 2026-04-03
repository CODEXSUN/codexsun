import { useEffect, useMemo, useState } from "react"

import type {
  FrappeTodo,
  FrappeTodoPriority,
  FrappeTodoStatus,
  FrappeTodoUpsertPayload,
} from "@frappe/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useDashboardShell } from "@/features/dashboard/dashboard-shell"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import {
  createFrappeTodo,
  listFrappeTodos,
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
const todoPriorityOptions: FrappeTodoPriority[] = ["Low", "Medium", "High"]

export function FrappeTodosSection() {
  const { user } = useDashboardShell()
  const [items, setItems] = useState<FrappeTodo[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<FrappeTodoUpsertPayload>(
    createDefaultTodoValues()
  )
  const [lastSyncedAt, setLastSyncedAt] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  useGlobalLoading(isLoading)

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

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    if (!normalizedSearch) {
      return items
    }

    return items.filter((item) =>
      [item.description, item.allocatedTo, item.owner, item.id]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    )
  }, [items, searchValue])

  function resetForm() {
    setEditingId(null)
    setValues(createDefaultTodoValues())
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
      await loadTodos()
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSaving(false)
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
        <>
          <Button variant="outline" onClick={() => void loadTodos()}>
            Refresh
          </Button>
          {user.isSuperAdmin ? (
            <Button variant="outline" onClick={resetForm}>
              New ToDo
            </Button>
          ) : null}
        </>
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

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Snapshot List</CardTitle>
            <CardDescription>Search and review local ToDo snapshots.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search description, owner, or assignee"
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ToDo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Modified</TableHead>
                  {user.isSuperAdmin ? <TableHead>Action</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{item.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === "Closed" ? "default" : "outline"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.priority}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        <p>{item.allocatedTo || "Unassigned"}</p>
                        <p>{item.owner || "No owner"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(item.modifiedAt)}
                    </TableCell>
                    {user.isSuperAdmin ? (
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                          Edit
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit ToDo" : "Create ToDo"}</CardTitle>
            <CardDescription>
              Super-admin only. Updates stay inside the app-owned Frappe snapshot flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {user.isSuperAdmin ? (
              <>
                <Field label="Description">
                  <Textarea
                    value={values.description}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </Field>
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
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={resetForm} disabled={isSaving}>
                    Reset
                  </Button>
                  <Button onClick={() => void handleSubmit()} disabled={isSaving}>
                    {isSaving ? "Saving..." : editingId ? "Save ToDo" : "Create ToDo"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Only the super-admin actor can create or update ToDo snapshots.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}
