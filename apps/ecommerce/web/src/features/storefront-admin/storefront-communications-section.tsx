import { Mail, RefreshCw, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react"
import { useEffect, useState } from "react"

import type {
  StorefrontCommunicationHealthResponse,
  StorefrontCommunicationLogItem,
} from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import { storefrontApi } from "../../api/storefront-api"

function formatDateTime(value: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
}

function canResend(item: StorefrontCommunicationLogItem) {
  return (
    item.templateCode === "storefront_order_confirmed" ||
    item.templateCode === "storefront_payment_failed"
  )
}

export function StorefrontCommunicationsSection() {
  const [health, setHealth] = useState<StorefrontCommunicationHealthResponse | null>(null)
  const [items, setItems] = useState<StorefrontCommunicationLogItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [resendingId, setResendingId] = useState<string | null>(null)
  useGlobalLoading(isLoading || Boolean(resendingId))

  async function load() {
    setIsLoading(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const [nextHealth, nextLog] = await Promise.all([
        storefrontApi.getCommunicationsHealth(accessToken),
        storefrontApi.getCommunicationsLog(accessToken),
      ])

      setHealth(nextHealth)
      setItems(nextLog.items)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load storefront communications."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleResend(item: StorefrontCommunicationLogItem) {
    setResendingId(item.id)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const result = await storefrontApi.resendCommunication(accessToken, {
        templateCode: item.templateCode,
        orderId: item.referenceId,
      })

      await load()

      if (result.deliveryStatus === "sent") {
        showRecordToast({
          entity: "Communication",
          action: "resent",
          recordName: item.templateCode,
        })
      } else {
        showAppToast({
          variant: "error",
          title: "Communication resend failed.",
          description: result.message,
        })
      }
    } catch (resendError) {
      showAppToast({
        variant: "error",
        title: "Communication resend failed.",
        description:
          resendError instanceof Error
            ? resendError.message
            : "Failed to resend storefront communication.",
      })
    } finally {
      setResendingId(null)
    }
  }

  const failedCount = items.filter((item) => item.status === "failed").length

  return (
    <div className="space-y-4">
      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 py-0">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <Card className="border border-border/70 bg-background/90 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <Mail className="size-3.5" />
            Storefront communications
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <CardTitle>Customer communication health and resend tools</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-7">
                Review storefront mail readiness, delivery failures, and retry supported order mails
                without leaving the ecommerce workspace.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" className="gap-2" onClick={() => void load()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
          <CardContent className="space-y-2 p-5">
            <div className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="size-4 text-emerald-600" />
              <p className="font-medium">Template readiness</p>
            </div>
            <p className="text-2xl font-semibold tracking-tight">{health?.checkedTemplateCodes.length ?? 0}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {health?.ready
                ? "Required storefront customer mail templates are active."
                : "Template readiness could not be confirmed."}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
          <CardContent className="space-y-2 p-5">
            <div className="flex items-center gap-2 text-foreground">
              <TriangleAlert className="size-4 text-amber-600" />
              <p className="font-medium">Failed messages</p>
            </div>
            <p className="text-2xl font-semibold tracking-tight">{failedCount}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Failed storefront messages are recorded here and can be retried for supported templates.
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
          <CardContent className="space-y-2 p-5">
            <div className="flex items-center gap-2 text-foreground">
              <Mail className="size-4 text-primary" />
              <p className="font-medium">Total activity</p>
            </div>
            <p className="text-2xl font-semibold tracking-tight">{items.length}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              All storefront customer mail activity from mailbox records, newest first.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="text-[1.1rem] tracking-tight">Communication activity</CardTitle>
          <CardDescription>
            Supported resend actions are available for order confirmation and payment failed mails.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border/70 p-0">
          {items.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">
              No storefront communication messages are recorded yet.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_auto]"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{item.templateName ?? item.templateCode}</p>
                    <Badge variant={item.status === "failed" ? "destructive" : item.status === "sent" ? "secondary" : "outline"}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{item.subject}</p>
                  <p className="truncate text-sm text-muted-foreground">{item.recipientSummary}</p>
                  {item.errorMessage ? (
                    <p className="text-sm leading-6 text-destructive">{item.errorMessage}</p>
                  ) : null}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Created: {formatDateTime(item.createdAt)}</p>
                  <p>Sent: {formatDateTime(item.sentAt)}</p>
                  <p>Failed: {formatDateTime(item.failedAt)}</p>
                </div>
                <div className="flex items-start justify-start md:justify-end">
                  {canResend(item) ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      disabled={resendingId === item.id}
                      onClick={() => void handleResend(item)}
                    >
                      <RotateCcw className="size-4" />
                      {resendingId === item.id ? "Resending..." : "Resend"}
                    </Button>
                  ) : (
                    <Badge variant="outline">View only</Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
