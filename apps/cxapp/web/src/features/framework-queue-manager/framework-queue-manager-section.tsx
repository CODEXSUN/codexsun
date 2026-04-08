import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2Icon,
  Clock3Icon,
  ListRestartIcon,
  LoaderCircleIcon,
  RefreshCcwIcon,
  SearchIcon,
  TriangleAlertIcon,
  WorkflowIcon,
} from "lucide-react"

import type {
  RuntimeJobDashboard,
  RuntimeJobDashboardItem,
  RuntimeJobStatus,
} from "../../../../../framework/shared/runtime-jobs"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

type QueueFilter = RuntimeJobStatus | "all" | "ready"

type QueueLogEntry = {
  id: string
  label: string
  timestamp: string
  tone: "default" | "warn" | "success"
  detail?: string | null
}

const statusToneMap: Record<RuntimeJobStatus, "default" | "secondary" | "outline" | "destructive"> = {
  queued: "outline",
  running: "secondary",
  completed: "default",
  failed: "destructive",
}

const statusBadgeClassMap: Partial<Record<RuntimeJobStatus, string>> = {
  completed: "border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
}

async function requestJson<T>(path: string): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    headers: accessToken
      ? {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        }
      : {
          "content-type": "application/json",
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

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not recorded"
  }

  return new Date(value).toLocaleString()
}

function formatRelativeAge(value: string) {
  const deltaMs = Date.now() - new Date(value).getTime()

  if (!Number.isFinite(deltaMs) || deltaMs < 60_000) {
    return "just now"
  }

  const deltaMinutes = Math.floor(deltaMs / 60_000)

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`
  }

  const deltaHours = Math.floor(deltaMinutes / 60)

  if (deltaHours < 24) {
    return `${deltaHours}h ago`
  }

  return `${Math.floor(deltaHours / 24)}d ago`
}

function buildQueueLog(item: RuntimeJobDashboardItem): QueueLogEntry[] {
  const entries: QueueLogEntry[] = [
    {
      id: `${item.id}-created`,
      label: "Queued",
      timestamp: item.createdAt,
      tone: "default",
      detail: item.dedupeKey ? `Dedupe key: ${item.dedupeKey}` : null,
    },
  ]

  if (item.scheduledAt !== item.createdAt) {
    entries.push({
      id: `${item.id}-scheduled`,
      label: "Scheduled",
      timestamp: item.scheduledAt,
      tone: "default",
      detail: "Job was deferred before entering the worker lane.",
    })
  }

  if (item.startedAt) {
    entries.push({
      id: `${item.id}-started`,
      label: "Worker picked up job",
      timestamp: item.startedAt,
      tone: "default",
      detail: item.lockedBy ? `Worker: ${item.lockedBy}` : null,
    })
  }

  if (item.failedAt) {
    entries.push({
      id: `${item.id}-failed`,
      label: item.attempts < item.maxAttempts ? "Attempt failed" : "Job failed",
      timestamp: item.failedAt,
      tone: "warn",
      detail: item.lastError,
    })
  }

  if (item.completedAt) {
    entries.push({
      id: `${item.id}-completed`,
      label: "Completed",
      timestamp: item.completedAt,
      tone: "success",
      detail: item.resultSummary,
    })
  }

  return entries.sort((left, right) => left.timestamp.localeCompare(right.timestamp))
}

function QueueSummaryCard({
  active,
  count,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  count: number
  icon: typeof WorkflowIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.5rem] border p-5 text-left transition ${
        active
          ? "border-foreground/20 bg-card shadow-sm"
          : "border-border/70 bg-card/70 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{count}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/80 p-2.5">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      </div>
    </button>
  )
}

export function FrameworkQueueManagerSection() {
  const [dashboard, setDashboard] = useState<RuntimeJobDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<QueueFilter>("all")
  const [query, setQuery] = useState("")
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  useGlobalLoading(isLoading)

  async function loadDashboard() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await requestJson<RuntimeJobDashboard>(
        "/internal/v1/framework/runtime-jobs?limit=160"
      )
      setDashboard(response)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load queue manager."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return (dashboard?.items ?? []).filter((item) => {
      if (statusFilter === "ready") {
        if (
          item.status !== "queued" ||
          new Date(item.availableAt).getTime() > Date.now()
        ) {
          return false
        }
      } else if (statusFilter !== "all" && item.status !== statusFilter) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const haystack = [
        item.id,
        item.queueName,
        item.handlerKey,
        item.appId,
        item.moduleKey,
        item.dedupeKey ?? "",
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [dashboard?.items, query, statusFilter])

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedJobId(null)
      return
    }

    setSelectedJobId((current) =>
      current && filteredItems.some((item) => item.id === current) ? current : filteredItems[0]?.id ?? null
    )
  }, [filteredItems])

  const selectedJob =
    filteredItems.find((item) => item.id === selectedJobId) ??
    dashboard?.items[0] ??
    null

  const queueLog = selectedJob ? buildQueueLog(selectedJob) : []
  const queueNames = useMemo(
    () => Array.from(new Set((dashboard?.items ?? []).map((item) => item.queueName))),
    [dashboard?.items]
  )

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[1.75rem] border-border/70 bg-card/85 shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Framework Operations
              </p>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  Queue Manager
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                  Watch background jobs the same way you review customer operations: a clean status deck on top,
                  a live execution list in the middle, and a readable log trail on the side.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                {dashboard ? `Updated ${formatRelativeAge(dashboard.generatedAt)}` : "Waiting for data"}
              </Badge>
              <Button type="button" variant="outline" onClick={() => void loadDashboard()} disabled={isLoading}>
                <RefreshCcwIcon className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Queues: {queueNames.length || 0}</span>
            <span>Latest snapshot: {dashboard ? formatTimestamp(dashboard.generatedAt) : "Not loaded"}</span>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <QueueSummaryCard
          active={statusFilter === "all"}
          count={dashboard?.summary.total ?? 0}
          icon={WorkflowIcon}
          label="All Jobs"
          onClick={() => setStatusFilter("all")}
        />
        <QueueSummaryCard
          active={statusFilter === "queued"}
          count={dashboard?.summary.queued ?? 0}
          icon={Clock3Icon}
          label="Queued"
          onClick={() => setStatusFilter("queued")}
        />
        <QueueSummaryCard
          active={statusFilter === "running"}
          count={dashboard?.summary.running ?? 0}
          icon={LoaderCircleIcon}
          label="Running"
          onClick={() => setStatusFilter("running")}
        />
        <QueueSummaryCard
          active={statusFilter === "failed"}
          count={dashboard?.summary.failed ?? 0}
          icon={TriangleAlertIcon}
          label="Failed"
          onClick={() => setStatusFilter("failed")}
        />
        <QueueSummaryCard
          active={statusFilter === "ready"}
          count={dashboard?.summary.readyNow ?? 0}
          icon={ListRestartIcon}
          label="Ready Now"
          onClick={() => setStatusFilter("ready")}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <Card className="rounded-[1.75rem] border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Runtime Queue</CardTitle>
                <CardDescription>
                  Recent background jobs across framework and app handlers.
                </CardDescription>
              </div>
              <div className="relative w-full lg:w-80">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search job id, queue, handler, app..."
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
                Loading queue jobs...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
                No jobs matched the current filter.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === selectedJob?.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedJobId(item.id)}
                    className={`w-full rounded-[1.25rem] border p-4 text-left transition ${
                      isSelected
                        ? "border-foreground/15 bg-background shadow-sm"
                        : "border-border/70 bg-card/70 hover:border-accent/40 hover:bg-background/80"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={statusToneMap[item.status]}
                            className={`rounded-full px-2.5 py-0.5 ${statusBadgeClassMap[item.status] ?? ""}`}
                          >
                            {item.status}
                          </Badge>
                          <p className="text-sm font-semibold text-foreground">{item.handlerKey}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{item.queueName}</span>
                          <span>{item.appId}</span>
                          <span>{item.moduleKey}</span>
                        </div>
                        <p className="font-mono text-[11px] text-muted-foreground">{item.id}</p>
                      </div>
                      <div className="space-y-1 text-right text-xs text-muted-foreground">
                        <p>
                          Attempts {item.attempts}/{item.maxAttempts}
                        </p>
                        <p>{formatTimestamp(item.updatedAt)}</p>
                        <p>{formatRelativeAge(item.updatedAt)}</p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/70 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle>Execution Log</CardTitle>
            <CardDescription>
              Selected job detail, worker timing, and the latest execution notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!selectedJob ? (
              <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
                Pick a job from the queue to inspect its payload and lifecycle log.
              </div>
            ) : (
              <>
                <div className="rounded-[1.25rem] border border-border/70 bg-background/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-foreground">{selectedJob.handlerKey}</p>
                        <Badge
                          variant={statusToneMap[selectedJob.status]}
                          className={`rounded-full px-2.5 py-0.5 ${statusBadgeClassMap[selectedJob.status] ?? ""}`}
                        >
                          {selectedJob.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedJob.queueName} / {selectedJob.appId} / {selectedJob.moduleKey}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Scheduled: {formatTimestamp(selectedJob.availableAt)}</p>
                      <p>Updated: {formatTimestamp(selectedJob.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.15rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Attempts
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {selectedJob.attempts}/{selectedJob.maxAttempts}
                    </p>
                  </div>
                  <div className="rounded-[1.15rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Worker Lock
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {selectedJob.lockedBy ?? "Not locked"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTimestamp(selectedJob.lockedAt)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {queueLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1.15rem] border border-border/70 bg-card/70 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-full border border-border/70 bg-background/80 p-2">
                          {entry.tone === "success" ? (
                            <CheckCircle2Icon className="size-4 text-emerald-600" />
                          ) : entry.tone === "warn" ? (
                            <TriangleAlertIcon className="size-4 text-amber-600" />
                          ) : (
                            <Clock3Icon className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">{entry.label}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatTimestamp(entry.timestamp)}
                            </p>
                          </div>
                          {entry.detail ? (
                            <p className="text-sm leading-6 text-muted-foreground">{entry.detail}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[1.25rem] border border-border/70 bg-zinc-950 p-4 text-zinc-100">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                      Payload
                    </p>
                    <p className="text-[11px] text-zinc-500">{selectedJob.id}</p>
                  </div>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-zinc-200">
                    {JSON.stringify(selectedJob.payload, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
