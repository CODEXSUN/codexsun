import { AlertTriangle, CheckCircle2, RefreshCw, Search, Wallet } from "lucide-react"
import { useEffect, useState } from "react"

import type {
  StorefrontPaymentExceptionItem,
  StorefrontOperationalAgingBucket,
  StorefrontOperationalAgingReport,
  StorefrontFulfilmentAgingItem,
  StorefrontPaymentOperationsReport,
  StorefrontPaymentSettlementItem,
  StorefrontRefundAgingItem,
  StorefrontRefundQueueItem,
  StorefrontPaymentWebhookExceptionItem,
} from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import { storefrontApi } from "../../api/storefront-api"
import { StorefrontAdminOrderOperationsDialog } from "./storefront-admin-order-operations-dialog"

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

function AgingBucketSummary({
  title,
  buckets,
  currency,
}: {
  title: string
  buckets: StorefrontOperationalAgingBucket[]
  currency: string
}) {
  return (
    <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <div className="space-y-2">
          {buckets.map((bucket) => (
            <div key={bucket.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{bucket.label}</span>
              <span className="text-right text-foreground">
                {bucket.count} | {formatMoney(bucket.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SettlementQueueList({
  items,
  onOpenOrder,
}: {
  items: StorefrontPaymentSettlementItem[]
  onOpenOrder: (orderId: string) => void
}) {
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
            <div className="flex flex-col items-start gap-2 md:items-end">
              <Badge variant="secondary">{item.paymentStatus}</Badge>
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenOrder(item.orderId)}>
                View order
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function PaymentExceptionList({
  items,
  onOpenOrder,
  onReconcileOrder,
  reconcilingOrderId,
}: {
  items: StorefrontPaymentExceptionItem[]
  onOpenOrder: (orderId: string) => void
  onReconcileOrder: (orderId: string) => void
  reconcilingOrderId: string | null
}) {
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
            <div className="flex flex-col items-start gap-2 md:items-end">
              <Badge variant="outline">{item.providerPaymentId ?? "No payment id"}</Badge>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenOrder(item.orderId)}>
                  View order
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onReconcileOrder(item.orderId)}
                  disabled={reconcilingOrderId === item.orderId}
                >
                  {reconcilingOrderId === item.orderId ? "Reconciling..." : "Reconcile"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function RefundQueueList({
  items,
  onOpenOrder,
  onUpdateRefundStatus,
  updatingRefundOrderId,
}: {
  items: StorefrontRefundQueueItem[]
  onOpenOrder: (orderId: string) => void
  onUpdateRefundStatus: (
    orderId: string,
    status: "queued" | "processing" | "rejected"
  ) => void
  updatingRefundOrderId: string | null
}) {
  if (items.length === 0) {
    return (
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardContent className="p-5 text-sm text-muted-foreground">
          No refund requests are active right now.
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
                <Badge
                  variant={
                    item.refundStatus === "rejected"
                      ? "destructive"
                      : item.refundStatus === "refunded"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {item.refundStatus}
                </Badge>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {item.customerName} | {item.customerEmail}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">{item.summary}</p>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{formatMoney(item.requestedAmount, item.currency)}</p>
              <p>Order status: {item.orderStatus.replaceAll("_", " ")}</p>
              <p>Requested: {formatDateTime(item.requestedAt)}</p>
              <p>Updated: {formatDateTime(item.updatedAt)}</p>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <Badge variant="outline">{item.providerRefundId ?? "Pending provider refund"}</Badge>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenOrder(item.orderId)}>
                  View order
                </Button>
                {item.refundStatus === "requested" ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onUpdateRefundStatus(item.orderId, "queued")}
                    disabled={updatingRefundOrderId === item.orderId}
                  >
                    {updatingRefundOrderId === item.orderId ? "Updating..." : "Queue"}
                  </Button>
                ) : null}
                {["requested", "queued"].includes(item.refundStatus) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateRefundStatus(item.orderId, "processing")}
                    disabled={updatingRefundOrderId === item.orderId}
                  >
                    Process
                  </Button>
                ) : null}
                {["requested", "queued", "processing"].includes(item.refundStatus) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => onUpdateRefundStatus(item.orderId, "rejected")}
                    disabled={updatingRefundOrderId === item.orderId}
                  >
                    Reject
                  </Button>
                ) : null}
              </div>
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

function FulfilmentAgingList({
  items,
  onOpenOrder,
}: {
  items: StorefrontFulfilmentAgingItem[]
  onOpenOrder: (orderId: string) => void
}) {
  if (items.length === 0) {
    return (
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardContent className="p-5 text-sm text-muted-foreground">
          No fulfilment-aging items are active right now.
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
              <p className="font-medium text-foreground">{item.orderNumber}</p>
              <p className="truncate text-sm text-muted-foreground">
                {item.customerName} | {item.customerEmail}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">{item.itemSummary}</p>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{formatMoney(item.totalAmount, item.currency)}</p>
              <p>Status: {item.orderStatus.replaceAll("_", " ")}</p>
              <p>Aging since: {formatDateTime(item.agingStartedAt)}</p>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <Badge variant="outline">{item.ageHours.toFixed(1)} hrs</Badge>
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenOrder(item.orderId)}>
                View order
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function RefundAgingList({
  items,
  onOpenOrder,
}: {
  items: StorefrontRefundAgingItem[]
  onOpenOrder: (orderId: string) => void
}) {
  if (items.length === 0) {
    return (
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardContent className="p-5 text-sm text-muted-foreground">
          No refund-aging items are active right now.
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
                <Badge variant="outline">{item.refundStatus}</Badge>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {item.customerName} | {item.customerEmail}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">{item.summary}</p>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{formatMoney(item.requestedAmount, item.currency)}</p>
              <p>Status: {item.orderStatus.replaceAll("_", " ")}</p>
              <p>Requested: {formatDateTime(item.agingStartedAt)}</p>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <Badge variant="outline">{item.ageHours.toFixed(1)} hrs</Badge>
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenOrder(item.orderId)}>
                View order
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function StorefrontPaymentsSection() {
  const [report, setReport] = useState<StorefrontPaymentOperationsReport | null>(null)
  const [agingReport, setAgingReport] = useState<StorefrontOperationalAgingReport | null>(null)
  const [exceptionSearchTerm, setExceptionSearchTerm] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReconciling, setIsReconciling] = useState(false)
  const [isExportingSummary, setIsExportingSummary] = useState(false)
  const [isExportingFailedPayments, setIsExportingFailedPayments] = useState(false)
  const [isExportingRefunds, setIsExportingRefunds] = useState(false)
  const [isExportingSettlementGaps, setIsExportingSettlementGaps] = useState(false)
  const [reconcilingOrderId, setReconcilingOrderId] = useState<string | null>(null)
  const [refundSearchTerm, setRefundSearchTerm] = useState("")
  const [updatingRefundOrderId, setUpdatingRefundOrderId] = useState<string | null>(null)
  useGlobalLoading(
      isLoading ||
      isReconciling ||
      isExportingSummary ||
      isExportingFailedPayments ||
      isExportingRefunds ||
      isExportingSettlementGaps ||
      Boolean(reconcilingOrderId) ||
      Boolean(updatingRefundOrderId)
  )

  async function loadReport() {
    setIsLoading(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const [nextReport, nextAgingReport] = await Promise.all([
        storefrontApi.getPaymentsReport(accessToken),
        storefrontApi.getOperationalAgingReport(accessToken),
      ])
      setReport(nextReport)
      setAgingReport(nextAgingReport)
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

  async function handleExportDailySummary() {
    setIsExportingSummary(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const document = await storefrontApi.downloadPaymentsDailySummary(accessToken, 30)
      const href = window.URL.createObjectURL(document.blob)
      const anchor = window.document.createElement("a")
      anchor.href = href
      anchor.download = document.fileName
      anchor.click()
      window.URL.revokeObjectURL(href)

      showRecordToast({
        entity: "Daily payment summary",
        action: "exported",
        recordName: document.fileName,
      })
    } catch (exportError) {
      const message =
        exportError instanceof Error
          ? exportError.message
          : "Failed to export the daily payment summary."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Daily payment summary export failed.",
        description: message,
      })
    } finally {
      setIsExportingSummary(false)
    }
  }

  async function handleExportFailedPayments() {
    setIsExportingFailedPayments(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const document = await storefrontApi.downloadFailedPaymentsReport(accessToken)
      const href = window.URL.createObjectURL(document.blob)
      const anchor = window.document.createElement("a")
      anchor.href = href
      anchor.download = document.fileName
      anchor.click()
      window.URL.revokeObjectURL(href)

      showRecordToast({
        entity: "Failed-payment report",
        action: "exported",
        recordName: document.fileName,
      })
    } catch (exportError) {
      const message =
        exportError instanceof Error
          ? exportError.message
          : "Failed to export the failed-payment report."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Failed-payment export failed.",
        description: message,
      })
    } finally {
      setIsExportingFailedPayments(false)
    }
  }

  async function handleExportRefunds() {
    setIsExportingRefunds(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const document = await storefrontApi.downloadRefundsReport(accessToken)
      const href = window.URL.createObjectURL(document.blob)
      const anchor = window.document.createElement("a")
      anchor.href = href
      anchor.download = document.fileName
      anchor.click()
      window.URL.revokeObjectURL(href)

      showRecordToast({
        entity: "Refund report",
        action: "exported",
        recordName: document.fileName,
      })
    } catch (exportError) {
      const message =
        exportError instanceof Error ? exportError.message : "Failed to export the refund report."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Refund export failed.",
        description: message,
      })
    } finally {
      setIsExportingRefunds(false)
    }
  }

  async function handleExportSettlementGaps() {
    setIsExportingSettlementGaps(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const document = await storefrontApi.downloadSettlementGapReport(accessToken)
      const href = window.URL.createObjectURL(document.blob)
      const anchor = window.document.createElement("a")
      anchor.href = href
      anchor.download = document.fileName
      anchor.click()
      window.URL.revokeObjectURL(href)

      showRecordToast({
        entity: "Settlement-gap report",
        action: "exported",
        recordName: document.fileName,
      })
    } catch (exportError) {
      const message =
        exportError instanceof Error
          ? exportError.message
          : "Failed to export the settlement-gap report."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Settlement-gap export failed.",
        description: message,
      })
    } finally {
      setIsExportingSettlementGaps(false)
    }
  }

  async function handleReconcileOrder(orderId: string) {
    setReconcilingOrderId(orderId)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const result = await storefrontApi.reconcilePayments(accessToken, {
        orderIds: [orderId],
        maxOrders: 1,
      })
      await loadReport()
      showRecordToast({
        entity: "Payment exception",
        action: "reconciled",
        recordName: `${result.updatedCount} order updated`,
      })
    } catch (reconcileError) {
      const message =
        reconcileError instanceof Error
          ? reconcileError.message
          : "Failed to reconcile the selected payment exception."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Payment exception reconcile failed.",
        description: message,
      })
    } finally {
      setReconcilingOrderId(null)
    }
  }

  async function handleRefundStatusUpdate(
    orderId: string,
    status: "queued" | "processing" | "rejected"
  ) {
    setUpdatingRefundOrderId(orderId)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const response = await storefrontApi.updateRefundStatus(accessToken, {
        orderId,
        status,
      })
      await loadReport()
      showRecordToast({
        entity: "Refund",
        action: "updated",
        recordName: response.item.orderNumber,
      })
    } catch (refundError) {
      const message =
        refundError instanceof Error ? refundError.message : "Failed to update refund status."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Refund update failed.",
        description: message,
      })
    } finally {
      setUpdatingRefundOrderId(null)
    }
  }

  const normalizedExceptionQuery = exceptionSearchTerm.trim().toLowerCase()
  const filteredExceptions = report
    ? report.failedPayments.filter((item) => {
        if (!normalizedExceptionQuery) {
          return true
        }

        return [
          item.orderNumber,
          item.customerName,
          item.customerEmail,
          item.summary,
          item.providerPaymentId ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedExceptionQuery)
      })
    : []
  const normalizedRefundQuery = refundSearchTerm.trim().toLowerCase()
  const filteredRefunds = report
    ? report.refundQueue.filter((item) => {
        if (!normalizedRefundQuery) {
          return true
        }

        return [
          item.orderNumber,
          item.customerName,
          item.customerEmail,
          item.summary,
          item.providerRefundId ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedRefundQuery)
      })
    : []

  const tabs: AnimatedContentTab[] = report
    ? [
        {
          value: "settlements",
          label: "Settlement visibility",
          content: <SettlementQueueList items={report.settlementQueue} onOpenOrder={setSelectedOrderId} />,
        },
        {
          value: "exceptions",
          label: "Payment exceptions",
          content: (
            <div className="space-y-4">
              <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={exceptionSearchTerm}
                      onChange={(event) => setExceptionSearchTerm(event.target.value)}
                      placeholder="Search exceptions by order, customer, email, or payment id"
                      className="pl-9"
                      aria-label="Search payment exception queue"
                    />
                  </div>
                </CardContent>
              </Card>
              <PaymentExceptionList
                items={filteredExceptions}
                onOpenOrder={setSelectedOrderId}
                onReconcileOrder={handleReconcileOrder}
                reconcilingOrderId={reconcilingOrderId}
              />
            </div>
          ),
        },
        {
          value: "webhooks",
          label: "Webhook exceptions",
          content: <WebhookExceptionList items={report.webhookExceptions} />,
        },
        {
          value: "fulfilment_aging",
          label: "Fulfilment aging",
          content: (
            <div className="space-y-4">
              {agingReport ? (
                <AgingBucketSummary
                  title="Fulfilment aging bands"
                  buckets={agingReport.fulfilmentBuckets}
                  currency={agingReport.fulfilmentItems[0]?.currency ?? "INR"}
                />
              ) : null}
              <FulfilmentAgingList
                items={agingReport?.fulfilmentItems ?? []}
                onOpenOrder={setSelectedOrderId}
              />
            </div>
          ),
        },
        {
          value: "refunds",
          label: "Refund queue",
          content: (
            <div className="space-y-4">
              <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={refundSearchTerm}
                      onChange={(event) => setRefundSearchTerm(event.target.value)}
                      placeholder="Search refunds by order, customer, email, or provider refund id"
                      className="pl-9"
                      aria-label="Search refund queue"
                    />
                  </div>
                </CardContent>
              </Card>
              <RefundQueueList
                items={filteredRefunds}
                onOpenOrder={setSelectedOrderId}
                onUpdateRefundStatus={handleRefundStatusUpdate}
                updatingRefundOrderId={updatingRefundOrderId}
              />
            </div>
          ),
        },
        {
          value: "refund_aging",
          label: "Refund aging",
          content: (
            <div className="space-y-4">
              {agingReport ? (
                <AgingBucketSummary
                  title="Refund aging bands"
                  buckets={agingReport.refundBuckets}
                  currency={agingReport.refundItems[0]?.currency ?? "INR"}
                />
              ) : null}
              <RefundAgingList
                items={agingReport?.refundItems ?? []}
                onOpenOrder={setSelectedOrderId}
              />
            </div>
          ),
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
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => void handleExportDailySummary()}
                disabled={isExportingSummary}
              >
                <Wallet className="size-4" />
                {isExportingSummary ? "Exporting..." : "Export daily summary"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => void handleExportFailedPayments()}
                disabled={isExportingFailedPayments}
              >
                <AlertTriangle className="size-4" />
                {isExportingFailedPayments ? "Exporting..." : "Export failed payments"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => void handleExportRefunds()}
                disabled={isExportingRefunds}
              >
                <Wallet className="size-4" />
                {isExportingRefunds ? "Exporting..." : "Export refunds"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => void handleExportSettlementGaps()}
                disabled={isExportingSettlementGaps}
              >
                <AlertTriangle className="size-4" />
                {isExportingSettlementGaps ? "Exporting..." : "Export settlement gaps"}
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
          <SummaryCard
            title="Refund queue"
            value={String(report.summary.refundQueueCount)}
            description={`${report.summary.refundInFlightCount} active refund requests and ${report.summary.refundedCount} completed refunds are tracked here.`}
          />
          <SummaryCard
            title="Fulfilment aging"
            value={String(agingReport?.summary.fulfilmentAgingCount ?? 0)}
            description={`${agingReport?.summary.fulfilmentOver72HoursCount ?? 0} fulfilment orders have been open longer than 72 hours.`}
          />
          <SummaryCard
            title="Refund aging"
            value={String(agingReport?.summary.refundAgingCount ?? 0)}
            description={`${agingReport?.summary.refundOver72HoursCount ?? 0} refund requests have been open longer than 72 hours.`}
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

      <StorefrontAdminOrderOperationsDialog
        orderId={selectedOrderId}
        open={Boolean(selectedOrderId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrderId(null)
          }
        }}
        onOrderUpdated={async () => {
          await loadReport()
        }}
      />
    </div>
  )
}
