import { useEffect, useState } from "react"
import {
  ExternalLinkIcon,
  PencilLineIcon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import type { RemoteGitUpdateResponse } from "../../../../../framework/shared/remote-server-control"
import type {
  RemoteServerDashboard,
  RemoteServerTarget,
} from "../../../../../framework/shared/remote-server-status"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

import { RecordActionMenu } from "@/components/blocks/record-action-menu"
import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import {
  RemoteServerEditorDialog,
  type RemoteServerEditorFormState,
} from "./remote-server-dialogs"

const liveServersShellTechnicalName = "shell.framework.live-servers"

function createEmptyForm(): RemoteServerEditorFormState {
  return {
    name: "",
    baseUrl: "",
    description: "",
    monitorSecret: "",
  }
}

function TechnicalNameBadgeRow({ names }: { names: string[] }) {
  const uniqueNames = Array.from(new Set(names.filter((name) => name.trim().length > 0)))

  if (uniqueNames.length === 0) {
    return null
  }

  return (
    <div className="absolute right-0 top-0 z-[70] flex max-w-[calc(100%-1rem)] flex-wrap justify-end gap-2">
      {uniqueNames.map((name) => (
        <TechnicalNameBadge key={name} name={name} />
      ))}
    </div>
  )
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    ...init,
    headers: accessToken
      ? {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
          ...(init?.headers ?? {}),
        }
      : {
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
  })

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`
    )
  }

  return payload as T
}

function getStatusTone(status: RemoteServerDashboard["items"][number]["status"]) {
  switch (status) {
    case "live":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "pending_secret":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "unauthorized":
      return "bg-orange-50 text-orange-700 border-orange-200"
    case "invalid_response":
      return "bg-rose-50 text-rose-700 border-rose-200"
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200"
  }
}

function getStatusLabel(status: RemoteServerDashboard["items"][number]["status"]) {
  switch (status) {
    case "live":
      return "Live"
    case "pending_secret":
      return "Needs Secret"
    case "unauthorized":
      return "Mismatch"
    case "invalid_response":
      return "Invalid"
    default:
      return "Down"
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not confirmed"
  }

  return new Date(value).toLocaleString()
}

export function FrameworkLiveServersSection() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<RemoteServerDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingServer, setEditingServer] = useState<RemoteServerTarget | null>(null)
  const [form, setForm] = useState<RemoteServerEditorFormState>(createEmptyForm())
  useGlobalLoading(isLoading || isRefreshing || isSaving || isDeletingId != null)

  function resetForm() {
    setForm(createEmptyForm())
  }

  function openCreateDialog() {
    resetForm()
    setEditingServer(null)
    setIsCreateDialogOpen(true)
  }

  function openEditDialog(target: RemoteServerTarget) {
    setEditingServer(target)
    setForm({
      name: target.name,
      baseUrl: target.baseUrl,
      description: target.description ?? "",
      monitorSecret: "",
    })
    setIsEditDialogOpen(true)
  }

  async function loadDashboard(mode: "load" | "refresh" = "load") {
    if (mode === "load") {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }

    setError(null)

    try {
      const response = await requestJson<RemoteServerDashboard>(
        "/internal/v1/framework/remote-servers"
      )
      setDashboard(response)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load remote servers.")
    } finally {
      if (mode === "load") {
        setIsLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  async function handleCreateServer() {
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await requestJson<{ item: { id: string } }>(
        "/internal/v1/framework/remote-servers",
        {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            baseUrl: form.baseUrl,
            description: form.description,
            monitorSecret: form.monitorSecret,
          }),
        }
      )
      setMessage(`Server ${form.name.trim()} was added.`)
      setIsCreateDialogOpen(false)
      resetForm()
      await loadDashboard("refresh")
      void navigate(`/dashboard/live-servers/${encodeURIComponent(response.item.id)}`)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to add server.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdateServer() {
    if (!editingServer) {
      return
    }

    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      await requestJson<{ item: RemoteServerTarget }>(
        `/internal/v1/framework/remote-server?id=${encodeURIComponent(editingServer.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name,
            baseUrl: form.baseUrl,
            description: form.description,
            monitorSecret: form.monitorSecret,
          }),
        }
      )
      setMessage(
        form.monitorSecret.trim()
          ? `Server ${form.name.trim()} was updated and its saved monitor secret was replaced.`
          : `Server ${form.name.trim()} was updated.`
      )
      setIsEditDialogOpen(false)
      setEditingServer(null)
      resetForm()
      await loadDashboard("refresh")
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to update server.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteServer(targetId: string) {
    setIsDeletingId(targetId)
    setError(null)
    setMessage(null)

    try {
      await requestJson<{ deleted: boolean }>(
        `/internal/v1/framework/remote-server?id=${encodeURIComponent(targetId)}`,
        {
          method: "DELETE",
        }
      )
      setMessage("Server target deleted.")
      await loadDashboard("refresh")
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to delete server.")
    } finally {
      setIsDeletingId(null)
    }
  }

  async function handleGitUpdate(
    targetId: string,
    targetName: string,
    overrideDirty = false
  ) {
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await requestJson<RemoteGitUpdateResponse>(
        `/internal/v1/framework/remote-server/git-update?id=${encodeURIComponent(targetId)}`,
        {
          method: "POST",
          body: JSON.stringify({
            overrideDirty,
          }),
        }
      )

      setMessage(
        `${targetName}: ${response.update.message}${response.mode === "override_dirty_update" ? " Dirty drift was discarded before update." : ""}`
      )
      await loadDashboard("refresh")
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to run git update.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !dashboard) {
    return null
  }

  return (
    <div className="space-y-5" data-technical-name={liveServersShellTechnicalName}>
      <div className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm">
        <TechnicalNameBadgeRow names={[liveServersShellTechnicalName]} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Framework Operations
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              Live Servers
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              Monitor multiple hosted servers from one dashboard. Each server keeps its own pasted
              remote monitor secret, confirmation state, and detail page.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="h-10 gap-2"
              onClick={() => void loadDashboard("refresh")}
              disabled={isRefreshing || isSaving}
            >
              <RefreshCwIcon className="size-4" />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              className="h-10 gap-2 bg-slate-950 text-white hover:bg-slate-800"
              onClick={() => openCreateDialog()}
              disabled={isSaving}
            >
              <PlusIcon className="size-4" />
              Add Server
            </Button>
          </div>
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Servers", value: dashboard.summary.total, tone: "text-foreground" },
          { label: "Live", value: dashboard.summary.live, tone: "text-emerald-700" },
          {
            label: "Needs Secret",
            value: dashboard.summary.pendingSecret,
            tone: "text-amber-700",
          },
          {
            label: "Attention",
            value:
              dashboard.summary.unauthorized +
              dashboard.summary.unreachable +
              dashboard.summary.invalidResponse,
            tone: "text-rose-700",
          },
        ].map((item) => (
          <Card key={item.label} className="border-border/70 bg-card/80">
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className={`text-2xl ${item.tone}`}>{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card
        className="relative border-border/70 bg-card/90"
        data-technical-name="block.framework.live-servers.table"
      >
        <TechnicalNameBadgeRow names={["block.framework.live-servers.table"]} />
        <CardHeader>
          <CardTitle>Server List</CardTitle>
          <CardDescription>
            The list stays compact. Open a server to inspect live config, database, update state, and confirmation details.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-3 py-3 font-medium">Server</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Confirmed</th>
                <th className="px-3 py-3 font-medium">Checked</th>
                <th className="px-3 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.items.map((item) => (
                <tr
                  key={item.target.id}
                  className="border-b border-border/50 align-top last:border-b-0"
                >
                  <td className="px-3 py-4">
                    <div className="space-y-1">
                      <button
                        type="button"
                        className="text-left font-medium text-foreground hover:text-accent"
                        onClick={() =>
                          void navigate(
                            `/dashboard/live-servers/${encodeURIComponent(item.target.id)}`
                          )
                        }
                      >
                        {item.target.name}
                      </button>
                      <div className="text-xs text-muted-foreground">{item.target.baseUrl}</div>
                      {item.target.description ? (
                        <p className="text-xs text-muted-foreground">{item.target.description}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="space-y-2">
                      <Badge variant="outline" className={getStatusTone(item.status)}>
                        {getStatusLabel(item.status)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {item.target.hasMonitorSecret ? "Secret saved" : "No secret saved"}
                      </p>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-xs text-muted-foreground">
                    {formatDateTime(item.target.confirmedAt)}
                  </td>
                  <td className="px-3 py-4 text-xs text-muted-foreground">
                    <div>{formatDateTime(item.checkedAt)}</div>
                    <div>{item.latencyMs == null ? "No latency" : `${item.latencyMs} ms`}</div>
                  </td>
                  <td className="px-3 py-4">
                    <RecordActionMenu
                      itemLabel={item.target.name}
                      customItems={[
                        {
                          key: "show",
                          label: "Show",
                          onSelect: () =>
                            void navigate(
                              `/dashboard/live-servers/${encodeURIComponent(item.target.id)}`
                            ),
                        },
                        {
                          key: "edit",
                          label: "Edit Server",
                          icon: <PencilLineIcon className="size-4" />,
                          onSelect: () => openEditDialog(item.target),
                        },
                        {
                          key: "git-update",
                          label: "Git Update",
                          icon: <RefreshCwIcon className="size-4" />,
                          onSelect: () =>
                            void handleGitUpdate(item.target.id, item.target.name, false),
                        },
                        {
                          key: "git-update-override",
                          label: "Override Dirty Update",
                          icon: <RefreshCwIcon className="size-4" />,
                          onSelect: () =>
                            void handleGitUpdate(item.target.id, item.target.name, true),
                        },
                        {
                          key: "open",
                          label: "Open Server",
                          icon: <ExternalLinkIcon className="size-4" />,
                          onSelect: () => {
                            window.open(item.target.baseUrl, "_blank", "noopener,noreferrer")
                          },
                        },
                      ]}
                      onDelete={() => void handleDeleteServer(item.target.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <RemoteServerEditorDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
        isSaving={isSaving}
        form={form}
        onFormChange={setForm}
        onSubmit={handleCreateServer}
      />
      <RemoteServerEditorDialog
        open={isEditDialogOpen}
        onOpenChange={(open: boolean) => {
          setIsEditDialogOpen(open)
          if (!open) {
            setEditingServer(null)
            resetForm()
          }
        }}
        mode="edit"
        isSaving={isSaving}
        form={form}
        onFormChange={setForm}
        onSubmit={handleUpdateServer}
      />
    </div>
  )
}
