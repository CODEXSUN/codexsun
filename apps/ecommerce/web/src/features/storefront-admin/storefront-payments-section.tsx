import { AlertTriangle, CheckCircle2, RefreshCw, Wallet } from "lucide-react"
import { useEffect, useState } from "react"

import type {
  StorefrontPaymentExceptionItem,
  StorefrontPaymentOperationsReport,
  StorefrontPaymentSettlementItem,
  StorefrontPaymentWebhookExceptionItem,
} from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import { storefrontApi } from "../../api/storefront-api"

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string
  value: string
  description: string
}) {
  return (
    <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function SettlementQueueList({ items }: { items: StorefrontPaymentSettlementItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardContent className="p-5 text-sm text-muted-foreground">
          No live paid orders are currently waiting in the settlement visibility queue.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
      <CardContent className="divide-y divide-border/70 p-0">
        {items.map((item) => (
          <div
            key={item.orderId}
            className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_auto]"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{item.orderNumber}</p>
                <Badge variant="outline">{item.orderStatus.replaceAll("_", " ")}</Badge>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {item.customerName} | {item.customerEmail}
              </p>
              <p className="text-xs text-muted-foreground">
                Paid at {formatDateTime(item.paidAt)} | Age {item.ageHours.toFixed(1)} hrs
              </p>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{formatMoney(item.totalAmount, item.currency)}</p>
              <p className="truncate">Provider order: {item.providerOrderId ?? "-"}</p>
              <p className="truncate">Provider payment: {item.providerPaymentId ?? "-"}</p>
            </div>
            <div className="flex items-start justify-start md:justify-end">
              <Badge variant="secondary">{item.paymentStatus}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function PaymentExceptionList({ items }: { items: StorefrontPaymentExceptionItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardContent className="p-5 text-sm text-muted-foreground">
          No payment exceptions are active right now.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
      <CardContent className="divide-y divide-border/70 p-0">
        {items.map((item) => (
          <div
            key={item.orderId}
            className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_auto]"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{item.orderNumber}</p>
                <Badge variant={item.paymentStatus === "failed" ? "destructive" : "outline"}>
                  {item.paymentStatus}
                </Badge>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {item.customerName} | {item.customerEmail}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">{item.summary}</p>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{formatMoney(item.totalAmount, item.currency)}</p>
              <p>Order status: {item.orderStatus.replaceAll("_", " ")}</p>
              <p>Last attempt: {formatDateTime(item.lastAttemptAt)}</p>
            </div>
            <div className="flex items-start justify-start md:justify-end">
              <Badge variant="outline">{item.providerPaymentId ?? "No payment id"}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function WebhookExceptionList({ items }: { items: StorefrontPaymentWebhookExceptionItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardContent className="p-5 text-sm text-muted-foreground">
          No webhook exceptions are open right now.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
      <CardContent className="divide-y divide-border/70 p-0">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{item.eventType}</p>
                <Badge variant="outline">{item.processingStatus}</Badge>
              </div>
              <p className="truncate text-sm text-muted-foreground">{item.providerEventId}</p>
              <p className="text-sm leading-6 text-muted-foreground">
                {item.processingSummary ?? "Webhook exception requires operator review."}
              </p>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Received: {formatDateTime(item.receivedAt)}</p>
              <p>Processed: {formatDateTime(item.processedAt)}</p>
              <p className="truncate">Order: {item.orderId ?? "-"}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function StorefrontPaymentsSection() {
  const [report, setReport] = useState<StorefrontPaymentOperationsReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReconciling, setIsReconciling] = useState(false)
  useGlobalLoading(isLoading || isReconciling)

  async function loadReport() {
    setIsLoading(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const nextReport = await storefrontApi.getPaymentsReport(accessToken)
      setReport(nextReport)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load payment operations report."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadReport()
  }, [])

  async function handleReconcile() {
    setIsReconciling(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const result = await storefrontApi.reconcilePayments(accessToken, { maxOrders: 50 })
      await loadReport()
      showRecordToast({
        entity: "Payments",
        action: "reconciled",
        recordName: `${result.updatedCount} orders updated`,
      })
    } catch (reconcileError) {
      const message =
        reconcileError instanceof Error
          ? reconcileError.message
          : "Failed to reconcile Razorpay payments."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Payment reconciliation failed.",
        description: message,
      })
    } finally {
      setIsReconciling(false)
    }
  }

  const tabs: AnimatedContentTab[] = report
    ? [
        {
          value: "settlements",
          label: "Settlement visibility",
          content: <SettlementQueueList items={report.settlementQueue} />,
        },
        {
          value: "exceptions",
          label: "Payment exceptions",
          content: <PaymentExceptionList items={report.failedPayments} />,
        },
        {
          value: "webhooks",
          label: "Webhook exceptions",
          content: <WebhookExceptionList items={report.webhookExceptions} />,
        },
      ]
    : []

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
            <Wallet className="size-3.5" />
            Payment operations
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <CardTitle>Settlement visibility and payment exceptions</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-7">
                Review live Razorpay-paid orders, payment failures, and webhook exceptions from one
                ecommerce-owned operations surface.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="gap-2" onClick={() => void loadReport()}>
                <RefreshCw className="size-4" />
                Refresh report
              </Button>
              <Button type="button" className="gap-2" onClick={() => void handleReconcile()} disabled={isReconciling}>
                <RefreshCw className={`size-4 ${isReconciling ? "animate-spin" : ""}`} />
                {isReconciling ? "Reconciling..." : "Run reconciliation"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {report ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Settlement queue"
            value={String(report.summary.settlementPendingCount)}
            description={`${formatMoney(
              report.summary.settlementPendingAmount,
              report.settlementQueue[0]?.currency ?? "INR"
            )} in live paid orders awaiting settlement visibility.`}
          />
          <SummaryCard
            title="Failed payments"
            value={String(report.summary.failedPaymentCount)}
            description="Live Razorpay orders that failed and still need customer recovery or admin action."
          />
          <SummaryCard
            title="Pending payments"
            value={String(report.summary.paymentPendingCount)}
            description="Live checkout orders still waiting on verified payment capture."
          />
          <SummaryCard
            title="Webhook exceptions"
            value={String(report.summary.webhookExceptionCount)}
            description="Ignored or failed webhook events that need reconciliation or investigation."
          />
        </div>
      ) : null}

      {report ? (
        <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <div className="rounded-[1.1rem] border border-border/70 bg-card/60 p-4">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <p className="font-medium">Live payment orders</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {report.summary.livePaymentOrderCount} live Razorpay orders are currently tracked by ecommerce.
              </p>
            </div>
            <div className="rounded-[1.1rem] border border-border/70 bg-card/60 p-4">
              <div className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="size-4 text-amber-600" />
                <p className="font-medium">Exception focus</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Prioritize failed payments first, then pending payments older than a few hours, then unmatched webhook events.
              </p>
            </div>
            <div className="rounded-[1.1rem] border border-border/70 bg-card/60 p-4">
              <div className="flex items-center gap-2 text-foreground">
                <RefreshCw className="size-4 text-primary" />
                <p className="font-medium">Last generated</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {formatDateTime(report.generatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div>{report ? <AnimatedTabs defaultTabValue="settlements" tabs={tabs} /> : null}</div>
    </div>
  )
}
