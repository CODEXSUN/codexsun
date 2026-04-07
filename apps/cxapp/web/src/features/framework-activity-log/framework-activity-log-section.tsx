import { useEffect, useState } from "react"
import { ActivityIcon, RefreshCcwIcon, TestTube2Icon } from "lucide-react"

import type {
  ActivityLogListResponse,
  ActivityLogWriteResponse,
} from "../../../../../framework/shared/activity-log"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

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

export function FrameworkActivityLogSection() {
  const [logs, setLogs] = useState<ActivityLogListResponse["items"]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isWriting, setIsWriting] = useState(false)
  useGlobalLoading(isLoading || isWriting)

  async function loadLogs() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await requestJson<ActivityLogListResponse>(
        "/internal/v1/framework/activity-log?limit=100"
      )
      setLogs(response.items)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load activity log."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadLogs()
  }, [])

  async function handleWriteTestEntry() {
    setIsWriting(true)
    setError(null)

    try {
      const response = await requestJson<ActivityLogWriteResponse>(
        "/internal/v1/framework/activity-log/test",
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      )

      showRecordToast({
        entity: "Activity Log",
        action: "saved",
        recordName: response.item.action,
        recordId: response.item.id,
      })
      showAppToast({
        variant: "info",
        title: "Test activity recorded.",
        description: "The framework activity log received a new validation record.",
      })
      await loadLogs()
    } catch (writeError) {
      setError(
        writeError instanceof Error ? writeError.message : "Failed to write test activity."
      )
    } finally {
      setIsWriting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Activity Log</h1>
          <p className="text-sm text-muted-foreground">
            Framework runtime and admin validation activity recorded inside the platform audit ledger.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={() => void loadLogs()} disabled={isLoading || isWriting}>
            <RefreshCcwIcon className="size-4" />
            Refresh
          </Button>
          <Button type="button" onClick={() => void handleWriteTestEntry()} disabled={isLoading || isWriting}>
            <TestTube2Icon className="size-4" />
            {isWriting ? "Writing..." : "Write Test Entry"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Total Records
            </p>
            <p className="text-2xl font-semibold text-foreground">{logs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Errors
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {logs.filter((entry) => entry.level === "error").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Warnings
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {logs.filter((entry) => entry.level === "warn").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription className="text-xs">
            Latest framework and admin events captured in the audit ledger.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Loading activity log...
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              No activity records found yet.
            </div>
          ) : (
            logs.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-border/70 bg-card/70 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ActivityIcon className="size-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        {entry.category} / {entry.action}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.message}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span>Level: {entry.level}</span>
                      <span>Actor: {entry.actorEmail ?? entry.actorType ?? "system"}</span>
                      <span>Request: {entry.requestId ?? "-"}</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground">
                    <p>{new Date(entry.createdAt).toLocaleString()}</p>
                    <p>{entry.routePath ?? "-"}</p>
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
