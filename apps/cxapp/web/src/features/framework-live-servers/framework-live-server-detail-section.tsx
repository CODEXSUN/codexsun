import { useEffect, useState } from "react"
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  PencilLineIcon,
  RefreshCwIcon,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import type { RemoteGitUpdateResponse } from "../../../../../framework/shared/remote-server-control"
import type {
  RemoteServerStatusItem,
  RemoteServerTarget,
} from "../../../../../framework/shared/remote-server-status"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import {
  RemoteServerEditorDialog,
  type RemoteServerEditorFormState,
} from "./remote-server-dialogs"

function createEmptyForm(): RemoteServerEditorFormState {
  return {
    name: "",
    baseUrl: "",
    description: "",
    monitorSecret: "",
  }
}

type RemoteServerDetailResponse = {
  item: RemoteServerTarget
  status: RemoteServerStatusItem
}

const liveServerDetailTechnicalName = "shell.framework.live-server-detail"

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

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not available"
  }

  return new Date(value).toLocaleString()
}

function getGitStatusLabel(value: "clean" | "dirty" | null | undefined) {
  if (value === "clean") {
    return "Clean"
  }

  if (value === "dirty") {
    return "Dirty"
  }

  return "Not available"
}

function getStatusTone(status: RemoteServerStatusItem["status"]) {
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

function getStatusLabel(status: RemoteServerStatusItem["status"]) {
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

export function FrameworkLiveServerDetailSection({ serverId }: { serverId: string }) {
  const navigate = useNavigate()
  const [detail, setDetail] = useState<RemoteServerDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [form, setForm] = useState<RemoteServerEditorFormState>(createEmptyForm())
  useGlobalLoading(isLoading || isRefreshing || isSaving)

  async function loadDetail(mode: "load" | "refresh" = "load") {
    if (mode === "load") {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }

    setError(null)

    try {
      const response = await requestJson<RemoteServerDetailResponse>(
        `/internal/v1/framework/remote-server?id=${encodeURIComponent(serverId)}`
      )
      setDetail(response)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load server.")
    } finally {
      if (mode === "load") {
        setIsLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }

  useEffect(() => {
    void loadDetail()
  }, [serverId])

  useEffect(() => {
    if (!detail) {
      return
    }

    setForm({
      name: detail.item.name,
      baseUrl: detail.item.baseUrl,
      description: detail.item.description ?? "",
      monitorSecret: "",
    })
  }, [detail])

  async function handleUpdateServer() {
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      await requestJson<{ item: RemoteServerTarget }>(
        `/internal/v1/framework/remote-server?id=${encodeURIComponent(serverId)}`,
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
      await loadDetail("refresh")
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to update server.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleGitUpdate(overrideDirty = false) {
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await requestJson<RemoteGitUpdateResponse>(
        `/internal/v1/framework/remote-server/git-update?id=${encodeURIComponent(serverId)}`,
        {
          method: "POST",
          body: JSON.stringify({
            overrideDirty,
          }),
        }
      )
      setMessage(
        `${response.update.message}${response.mode === "override_dirty_update" ? " Dirty drift was discarded before update." : ""}`
      )
      await loadDetail("refresh")
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to run git update.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !detail) {
    return null
  }

  return (
    <div className="space-y-5" data-technical-name={liveServerDetailTechnicalName}>
      <div className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm">
        <TechnicalNameBadgeRow names={[liveServerDetailTechnicalName]} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => void navigate("/dashboard/live-servers")}>
                <ArrowLeftIcon className="size-4" />
              </Button>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Live Server
              </p>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
                {detail.item.name}
              </h1>
              <Badge variant="outline" className={getStatusTone(detail.status.status)}>
                {getStatusLabel(detail.status.status)}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{detail.item.baseUrl}</p>
              {detail.item.description ? <p>{detail.item.description}</p> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-10 gap-2" onClick={() => void loadDetail("refresh")} disabled={isRefreshing || isSaving}>
              <RefreshCwIcon className="size-4" />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="outline" className="h-10 gap-2" onClick={() => setIsEditDialogOpen(true)} disabled={isSaving}>
              <PencilLineIcon className="size-4" />
              Edit Server
            </Button>
            <Button variant="outline" className="h-10 gap-2" onClick={() => void handleGitUpdate(false)} disabled={isSaving}>
              <RefreshCwIcon className="size-4" />
              Git Update
            </Button>
            <Button variant="outline" className="h-10 gap-2" onClick={() => void handleGitUpdate(true)} disabled={isSaving}>
              <RefreshCwIcon className="size-4" />
              Override Dirty
            </Button>
            <Button asChild className="h-10 gap-2 bg-slate-950 text-white hover:bg-slate-800">
              <a href={detail.item.baseUrl} target="_blank" rel="noreferrer">
                <ExternalLinkIcon className="size-4" />
                Open Server
              </a>
            </Button>
          </div>
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Confirmed",
            value: detail.item.confirmedAt ? "Yes" : "No",
            tone: detail.item.confirmedAt ? "text-emerald-700" : "text-amber-700",
          },
          {
            label: "Secret Saved",
            value: detail.item.hasMonitorSecret ? "Yes" : "No",
            tone: detail.item.hasMonitorSecret ? "text-foreground" : "text-rose-700",
          },
          {
            label: "Checked At",
            value: formatDateTime(detail.status.checkedAt),
            tone: "text-foreground",
          },
          {
            label: "Latency",
            value: detail.status.latencyMs == null ? "N/A" : `${detail.status.latencyMs} ms`,
            tone: "text-foreground",
          },
        ].map((item) => (
          <Card key={item.label} className="border-border/70 bg-card/80">
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className={`text-xl ${item.tone}`}>{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Identity</CardTitle>
            <CardDescription>Saved target and live app identity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Name</div>
              <div className="mt-1 text-foreground">{detail.item.name}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Base URL</div>
              <div className="mt-1 text-foreground">{detail.item.baseUrl}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">App</div>
              <div className="mt-1 text-foreground">{detail.status.snapshot?.appName ?? "Not available"}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Version</div>
              <div className="mt-1 text-foreground">{detail.status.snapshot?.appVersion ?? "Not available"}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Environment</div>
              <div className="mt-1 text-foreground">{detail.status.snapshot?.environment ?? "Not available"}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Database</CardTitle>
            <CardDescription>Database state reported by that server.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Driver</div>
              <div className="mt-1 text-foreground">{detail.status.snapshot?.databaseDriver ?? "Not available"}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Database Name</div>
              <div className="mt-1 text-foreground">{detail.status.snapshot?.databaseName ?? "Not available"}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Reachable</div>
              <div className="mt-1 text-foreground">{detail.status.snapshot?.databaseReachable ? "Yes" : "No"}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Update & Health</CardTitle>
            <CardDescription>Live runtime update and health values.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Branch</div>
              <div className="mt-1 text-foreground">{detail.status.snapshot?.gitBranch ?? "Not available"}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Git Status</div>
              <div className="mt-1 text-foreground">
                {getGitStatusLabel(detail.status.snapshot?.gitStatus)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Remote Update</div>
              <div className="mt-1 text-foreground">{detail.status.snapshot?.hasRemoteUpdate ? "Pending" : "Up to date"}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Latest Update</div>
              <div className="mt-1 text-foreground">
                {detail.status.snapshot?.latestUpdateMessage ?? "Not available"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Latest Update Time</div>
              <div className="mt-1 text-foreground">
                {formatDateTime(detail.status.snapshot?.latestUpdateTimestamp ?? null)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Health URL</div>
              {detail.status.snapshot?.healthUrl ? (
                <Link to={detail.status.snapshot.healthUrl} className="mt-1 block text-sky-700">
                  {detail.status.snapshot.healthUrl}
                </Link>
              ) : (
                <div className="mt-1 text-foreground">Not available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle>Verification</CardTitle>
          <CardDescription>
            Each server is isolated. This target is confirmed only when its saved secret matches the remote server&apos;s <code>SERVER_MONITOR_SHARED_SECRET</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Saved secret: {detail.item.hasMonitorSecret ? "Present" : "Missing"}</p>
          <p>Confirmed at: {formatDateTime(detail.item.confirmedAt)}</p>
          <p>Latest detail: {detail.status.error ?? "Remote server responded successfully."}</p>
        </CardContent>
      </Card>

      <RemoteServerEditorDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        isSaving={isSaving}
        form={form}
        onFormChange={setForm}
        onSubmit={handleUpdateServer}
      />
    </div>
  )
}
