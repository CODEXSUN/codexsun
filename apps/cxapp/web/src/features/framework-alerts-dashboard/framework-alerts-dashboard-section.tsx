import { useEffect, useState } from "react"
import {
  BellRingIcon,
  CircleAlertIcon,
  CircleCheckBigIcon,
  RefreshCcwIcon,
  SendIcon,
} from "lucide-react"

import type { MonitoringDashboardResponse } from "../../../../../framework/shared/monitoring"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showAppToast } from "@/components/ui/app-toast"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

async function requestJson<T>(path: string): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    headers: accessToken
      ? {
          authorization: `Bearer ${accessToken}`,
        }
      : undefined,
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

export function FrameworkAlertsDashboardSection() {
  const [report, setReport] = useState<MonitoringDashboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  useGlobalLoading(isLoading)

  async function loadReport() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await requestJson<MonitoringDashboardResponse>(
        "/internal/v1/framework/alerts-dashboard?windowHours=24"
      )
      setReport(response)
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load the alerts dashboard."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Alerts dashboard failed.",
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadReport()
  }, [])

  const breachedCount =
    report?.summaries.filter((item) => item.alertState === "breached").length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Alerts Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Live monitoring status for checkout, payment verify, webhook, order creation, and mail send.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void loadReport()} disabled={isLoading}>
          <RefreshCcwIcon className="size-4" />
          Refresh
        </Button>
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
              Window
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {report?.windowHours ?? 24}h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Breached
            </p>
            <p className="text-2xl font-semibold text-foreground">{breachedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Channels
            </p>
            <p className="text-sm font-medium text-foreground">
              {report?.channels.hasEmailTargets ? "Email" : "No email"}
              {" / "}
              {report?.channels.hasWebhookTarget ? "Webhook" : "No webhook"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>Alert Channels</CardTitle>
          <CardDescription>
            Destinations configured from Core Settings observability controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
            <div className="flex items-center gap-2">
              <SendIcon className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Alert emails</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {report?.channels.alertEmails.length
                ? report.channels.alertEmails.join(", ")
                : "No operator emails configured."}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
            <div className="flex items-center gap-2">
              <BellRingIcon className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Alert webhook</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {report?.channels.alertWebhookUrl ?? "No webhook target configured."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>Operation Status</CardTitle>
          <CardDescription>
            Each card compares recent failures against its configured alert threshold.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {report?.summaries.map((item) => {
            const breached = item.alertState === "breached"

            return (
              <div
                key={item.operation}
                className={`rounded-2xl border p-4 ${
                  breached
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-emerald-200/60 bg-emerald-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Last event: {formatTimestamp(item.lastEventAt)}
                    </p>
                  </div>
                  {breached ? (
                    <CircleAlertIcon className="size-4 text-destructive" />
                  ) : (
                    <CircleCheckBigIcon className="size-4 text-emerald-600" />
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Success
                    </p>
                    <p className="mt-1 font-semibold text-foreground">{item.successCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Failure
                    </p>
                    <p className="mt-1 font-semibold text-foreground">{item.failureCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Threshold
                    </p>
                    <p className="mt-1 font-semibold text-foreground">{item.threshold}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Last failure: {formatTimestamp(item.lastFailureAt)}
                </p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Failures</CardTitle>
          <CardDescription>
            Latest failed events across the monitored production-critical flows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!report || report.recentFailures.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              No recent failures recorded in the selected monitoring window.
            </div>
          ) : (
            report.recentFailures.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/70 bg-card/70 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.sourceApp} / {item.operation}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.message}</p>
                    <p className="text-xs text-muted-foreground">
                      Reference: {item.referenceId ?? "-"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
