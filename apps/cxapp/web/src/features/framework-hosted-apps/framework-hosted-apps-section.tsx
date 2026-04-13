import { useEffect, useState } from "react"
import {
  RefreshCwIcon,
  RotateCwIcon,
  TriangleAlertIcon,
} from "lucide-react"

import type {
  HostedAppStatusItem,
  HostedAppsSoftwareUpdateResponse,
  HostedAppsStatusResponse,
} from "../../../../../framework/shared/hosted-apps"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

const hostedAppsShellTechnicalName = "shell.framework.hosted-apps"

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

function getStatusTone(item: HostedAppStatusItem) {
  if (item.healthState === "live") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200"
  }

  if (item.healthState === "starting") {
    return "bg-amber-50 text-amber-700 border-amber-200"
  }

  if (item.healthState === "failed") {
    return "bg-rose-50 text-rose-700 border-rose-200"
  }

  if (item.dockerState === "missing") {
    return "bg-slate-100 text-slate-700 border-slate-200"
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200"
}

function getStatusLabel(item: HostedAppStatusItem) {
  if (item.healthState === "live") {
    return "Live"
  }

  if (item.healthState === "starting") {
    return "Starting"
  }

  if (item.healthState === "failed") {
    return "Failed"
  }

  if (item.dockerState === "missing") {
    return "Missing"
  }

  return "Down"
}

export function FrameworkHostedAppsSection() {
  const [status, setStatus] = useState<HostedAppsStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  useGlobalLoading(isLoading || isRefreshing || isUpdating)

  async function loadStatus(nextMode: "load" | "refresh" = "load") {
    if (nextMode === "load") {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }

    setError(null)

    try {
      const response = await requestJson<HostedAppsStatusResponse>(
        "/internal/v1/framework/hosted-apps"
      )
      setStatus(response)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load hosted apps.")
    } finally {
      if (nextMode === "load") {
        setIsLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  async function handleCleanUpdate() {
    setIsUpdating(true)
    setError(null)
    setMessage(null)

    try {
      const response = await requestJson<HostedAppsSoftwareUpdateResponse>(
        "/internal/v1/framework/hosted-apps/update-clean",
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      )

      setMessage(
        response.mode === "git_sync_update"
          ? `Git-sync update started cleanly. ${response.message}`
          : `Clean rebuild started. ${response.message}`
      )
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Clean update failed.")
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading || !status) {
    return null
  }

  return (
    <div className="space-y-5" data-technical-name={hostedAppsShellTechnicalName}>
      <div className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm">
        <TechnicalNameBadgeRow names={[hostedAppsShellTechnicalName]} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Framework Operations
            </p>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
                Hosted Apps
              </h1>
              <span
                className={`size-3 rounded-full ${
                  status.summary.failed === 0 && status.summary.down === 0
                    ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]"
                    : "bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.14)]"
                }`}
                aria-label="Hosted runtime fleet status"
                title="Hosted runtime fleet status"
              />
            </div>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              Review live container and health state for Docker-managed suite deployments, then run a clean software update from the same framework surface.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="h-10 gap-2"
              onClick={() => void loadStatus("refresh")}
              disabled={isRefreshing || isUpdating}
            >
              <RefreshCwIcon className="size-4" />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              className="h-10 gap-2 bg-slate-950 text-white hover:bg-slate-800"
              onClick={() => void handleCleanUpdate()}
              disabled={isRefreshing || isUpdating}
            >
              <RotateCwIcon className="size-4" />
              {isUpdating ? "Updating..." : "Clean Update Software"}
            </Button>
          </div>
        </div>
        {message ? (
          <p className="mt-3 text-sm text-emerald-700">{message}</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        ) : null}
        {status.issues.length > 0 ? (
          <div className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
              <p>{status.issues.join(" ")}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total Apps",
            value: status.summary.total,
            tone: "text-foreground",
          },
          {
            label: "Live",
            value: status.summary.live,
            tone: "text-emerald-700",
          },
          {
            label: "Starting",
            value: status.summary.starting,
            tone: "text-amber-700",
          },
          {
            label: "Failed/Down",
            value: status.summary.failed + status.summary.down,
            tone: "text-rose-700",
          },
          {
            label: "Update Mode",
            value: status.softwareUpdateMode === "git_sync_update" ? "Git Sync" : "Clean Rebuild",
            tone: "text-slate-700",
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

      <Card className="relative border-border/70 bg-card/90" data-technical-name="block.framework.hosted-apps.table">
        <TechnicalNameBadgeRow names={["block.framework.hosted-apps.table"]} />
        <CardHeader>
          <CardTitle>Live Server Status</CardTitle>
          <CardDescription>
            Each row reflects the current Docker container state plus a live health request against that app&apos;s exposed server port.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-3 py-3 font-medium">App</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Container</th>
                <th className="px-3 py-3 font-medium">Port</th>
                <th className="px-3 py-3 font-medium">Live URL</th>
                <th className="px-3 py-3 font-medium">Started</th>
                <th className="px-3 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {status.items.map((item) => (
                <tr key={item.clientId} className="border-b border-border/50 align-top last:border-b-0">
                  <td className="px-3 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{item.displayName}</p>
                      <p className="font-mono text-xs text-muted-foreground">{item.clientId}</p>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <Badge variant="outline" className={getStatusTone(item)}>
                      {getStatusLabel(item)}
                    </Badge>
                  </td>
                  <td className="px-3 py-4">
                    <div className="space-y-1">
                      <p className="font-mono text-xs text-foreground">{item.containerName}</p>
                      <p className="text-xs text-muted-foreground">{item.image ?? "Image not available"}</p>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-xs text-foreground">
                    {item.hostPort ?? item.configuredPublicPort ?? "Not available"}
                  </td>
                  <td className="px-3 py-4 text-xs">
                    {item.liveUrl ? (
                      <a
                        href={item.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-700 underline underline-offset-4"
                      >
                        {item.liveUrl}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Not available</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-xs text-muted-foreground">
                    {formatDateTime(item.startedAt)}
                  </td>
                  <td className="px-3 py-4 text-xs text-muted-foreground">
                    {item.healthMessage ?? "No detail"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
