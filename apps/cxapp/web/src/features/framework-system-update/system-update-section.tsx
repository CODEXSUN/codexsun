import { useEffect, useState } from "react"
import { AlertTriangleIcon, GitBranchIcon, RefreshCcwIcon, RotateCwIcon, ShieldAlertIcon, Trash2Icon } from "lucide-react"

import type {
  SystemUpdateHistory,
  SystemUpdateRunResponse,
  SystemUpdateStatus,
} from "../../../../../framework/shared/system-update"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

const pendingRestartStorageKey = "codexsun-system-update-pending"

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
    | { error?: string; message?: string; context?: { localChanges?: string[] } }
    | null

  if (!response.ok) {
    const error = new Error(
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`
    ) as Error & { localChanges?: string[] }

    error.localChanges = payload?.context?.localChanges
    throw error
  }

  return payload as T
}

function CommitCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GitBranchIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <Icon className="size-4" />
        <span>{label}</span>
      </div>
      <p className="mt-2 font-mono text-xs text-foreground">{value}</p>
    </div>
  )
}

export function FrameworkSystemUpdateSection() {
  const [status, setStatus] = useState<SystemUpdateStatus | null>(null)
  const [history, setHistory] = useState<SystemUpdateHistory["items"]>([])
  const [error, setError] = useState<string | null>(null)
  const [localChanges, setLocalChanges] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [healthMessage, setHealthMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  useGlobalLoading(isLoading || isUpdating)

  async function loadStatus() {
    setIsLoading(true)
    setError(null)

    try {
      const [nextStatus, nextHistory] = await Promise.all([
        requestJson<SystemUpdateStatus>("/internal/v1/framework/system-update"),
        requestJson<SystemUpdateHistory>("/internal/v1/framework/system-update/history"),
      ])
      setStatus(nextStatus)
      setHistory(nextHistory.items)
      setLocalChanges(nextStatus.localChanges)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to read update status.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  useEffect(() => {
    const pendingToken = window.localStorage.getItem(pendingRestartStorageKey)

    if (!pendingToken) {
      return
    }

    let cancelled = false

    async function confirmHealth() {
      try {
        const response = await fetch("/public/v1/health", { cache: "no-store" })

        if (!response.ok) {
          throw new Error("Health check failed.")
        }

        if (!cancelled) {
          setHealthMessage("Application restarted successfully and health check returned OK.")
          window.localStorage.removeItem(pendingRestartStorageKey)
        }
      } catch {
        if (!cancelled) {
          window.setTimeout(() => {
            void confirmHealth()
          }, 1500)
        }
      }
    }

    void confirmHealth()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleUpdate() {
    setIsUpdating(true)
    setError(null)
    setMessage(null)

    try {
      const response = await requestJson<SystemUpdateRunResponse>(
        "/internal/v1/framework/system-update",
        { method: "POST", body: JSON.stringify({}) }
      )

      setStatus(response.status)
      setLocalChanges(response.status.localChanges)
      setMessage(response.message)
      window.localStorage.setItem(pendingRestartStorageKey, new Date().toISOString())

      window.setTimeout(() => {
        window.location.reload()
      }, 2500)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "System update failed.")
      setLocalChanges(
        updateError instanceof Error && "localChanges" in updateError && Array.isArray(updateError.localChanges)
          ? updateError.localChanges
          : []
      )
      await loadStatus()
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleForcedReset() {
    setIsUpdating(true)
    setError(null)
    setMessage(null)

    try {
      const response = await requestJson<SystemUpdateRunResponse>(
        "/internal/v1/framework/system-update/reset",
        { method: "POST", body: JSON.stringify({ force: true }) }
      )

      setStatus(response.status)
      setLocalChanges(response.status.localChanges)
      setMessage(response.message)
      window.localStorage.setItem(pendingRestartStorageKey, new Date().toISOString())

      window.setTimeout(() => {
        window.location.reload()
      }, 2500)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Forced reset failed.")
      setLocalChanges(
        updateError instanceof Error && "localChanges" in updateError && Array.isArray(updateError.localChanges)
          ? updateError.localChanges
          : []
      )
      await loadStatus()
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading && !status) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Loading update status...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">System Update</h1>
          <p className="text-sm text-muted-foreground">
            Update only from tracked git commits. Local server changes require manual update.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={() => void loadStatus()} disabled={isLoading || isUpdating}>
            <RefreshCcwIcon className="size-4" />
            Refresh
          </Button>
          <Button
            type="button"
            onClick={() => void handleUpdate()}
            disabled={isLoading || isUpdating || !status?.canAutoUpdate}
          >
            <RotateCwIcon className="size-4" />
            {isUpdating ? "Updating..." : "Update & Restart"}
          </Button>
          {!status?.isClean || localChanges.length > 0 ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={isLoading || isUpdating}>
                  <Trash2Icon className="size-4" />
                  Force Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">
                    Force reset local changes?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground">
                    <span className="block">
                      This will discard local server changes, remove untracked files, rebuild the app, and restart.
                    </span>
                    <span className="block font-medium text-foreground">
                      Current commit: {status?.currentCommit ?? "-"}
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="bg-destructive/5">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => void handleForcedReset()}
                  >
                    Force Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
          {message}
        </div>
      ) : null}
      {healthMessage ? (
        <div className="rounded-2xl border border-sky-200/70 bg-sky-50/80 px-4 py-3 text-sm text-sky-900">
          {healthMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <CommitCard icon={GitBranchIcon} label="Branch" value={status?.branch ?? "-"} />
        <CommitCard icon={GitBranchIcon} label="Upstream" value={status?.upstream ?? "-"} />
        <CommitCard icon={GitBranchIcon} label="Current Commit" value={status?.currentCommit ?? "-"} />
        <CommitCard icon={GitBranchIcon} label="Remote Commit" value={status?.remoteCommit ?? "-"} />
        <CommitCard
          icon={status?.canAutoUpdate ? RefreshCcwIcon : ShieldAlertIcon}
          label="Mode"
          value={status?.canAutoUpdate ? "Automatic update allowed" : "Manual update required"}
        />
      </div>

      <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>Update Guard</CardTitle>
          <CardDescription className="text-xs">
            Automatic update runs only on a clean tracked branch, then builds and restarts the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.preflight.issues.length ? (
            <div className="rounded-xl border border-destructive/15 bg-destructive/5 p-4 text-sm text-destructive">
              <p className="font-medium">Preflight issues</p>
              <div className="mt-2 space-y-1 text-xs">
                {status.preflight.issues.map((issue) => (
                  <p key={issue}>{issue}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Preflight checks passed: git, npm, and repository write access are available.
            </div>
          )}

          {status?.hasRemoteUpdate ? (
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
              A newer tracked commit is available.
            </div>
          ) : (
            <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Repository is already at the latest tracked commit.
            </div>
          )}

          {!status?.isClean || localChanges.length > 0 ? (
            <div className="rounded-xl border border-amber-300/70 bg-amber-50/90 p-4 text-sm text-amber-950">
              <div className="flex items-start gap-3">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                <div className="space-y-2">
                  <p className="font-medium">
                    Local server changes detected. Automatic update is blocked.
                  </p>
                  <p className="text-xs text-amber-900/80">
                    Use manual git update on the server when the worktree is not clean.
                  </p>
                  <div className="rounded-lg border border-amber-200/80 bg-white/70 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-900/80">
                      Changed Files
                    </p>
                    <div className="space-y-1 font-mono text-xs text-amber-950">
                      {(localChanges.length > 0 ? localChanges : status?.localChanges ?? []).map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription className="text-xs">
            Latest update and reset actions recorded on this server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              No update activity recorded yet.
            </div>
          ) : (
            history.map((entry) => (
              <div
                key={`${entry.timestamp}-${entry.action}-${entry.result}`}
                className="rounded-xl border border-border/70 bg-card/70 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {entry.action === "update" ? "Update" : "Force Reset"} · {entry.result}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.message}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {entry.previousCommit ?? "-"} → {entry.currentCommit ?? "-"}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground">
                    <p>{new Date(entry.timestamp).toLocaleString()}</p>
                    <p>{entry.actor ?? "system"}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
