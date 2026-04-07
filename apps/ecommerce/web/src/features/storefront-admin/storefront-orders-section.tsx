import { ClipboardList, Package, RefreshCw, Search, Truck } from "lucide-react"
import { useEffect, useState } from "react"

import type {
  StorefrontAdminOrderOperationsReport,
  StorefrontAdminOrderQueueBucket,
  StorefrontAdminOrderQueueItem,
  StorefrontOrderStatus,
} from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CommerceOrderStatusBadge } from "@/components/ux/commerce-order-status-badge"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import { storefrontApi } from "../../api/storefront-api"
import { StorefrontAdminOrderOperationsDialog } from "./storefront-admin-order-operations-dialog"

type StatusFilterValue = "all" | StorefrontOrderStatus

const bucketLabels: Record<"all" | StorefrontAdminOrderQueueBucket, string> = {
  all: "All orders",
  payment_attention: "Action required",
  fulfilment: "Fulfilment",
  shipment: "Shipment",
  pickup: "Pickup",
  completed: "Completed",
  closed: "Closed",
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDateTime(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
}

function formatAgeHours(value: number) {
  return `${value.toFixed(1)} hrs`
}

function PaymentStatusBadge({
  status,
}: {
  status: StorefrontAdminOrderQueueItem["paymentStatus"]
}) {
  const className =
    status === "failed"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : status === "paid"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
        : status === "refunded"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-700"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700"

  return (
    <Badge variant="outline" className={className}>
      {status}
    </Badge>
  )
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

function OrderQueueList({
  items,
  onOpenOrder,
}: {
  items: StorefrontAdminOrderQueueItem[]
  onOpenOrder: (orderId: string) => void
}) {
  if (items.length === 0) {
    return (
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardContent className="p-5 text-sm text-muted-foreground">
          No orders match the current queue filters.
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
            className="grid gap-4 px-5 py-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)_minmax(0,0.9fr)]"
          >
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{item.orderNumber}</p>
                <CommerceOrderStatusBadge status={item.orderStatus} />
                <PaymentStatusBadge status={item.paymentStatus} />
                {item.needsAttention ? (
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700">
                    attention
                  </Badge>
                ) : null}
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {item.customerName} | {item.customerEmail} | {item.customerPhone}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">{item.itemSummary}</p>
              <p className="text-sm leading-6 text-muted-foreground">
                {item.latestTimelineLabel} | {item.latestTimelineSummary}
              </p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>{formatMoney(item.totalAmount, item.currency)}</p>
              <p>Items: {item.itemCount}</p>
              <p>Queue: {bucketLabels[item.queueBucket]}</p>
              <p>
                Fulfilment: {item.fulfillmentMethod.replaceAll("_", " ")} | Payment:{" "}
                {item.paymentCollectionMethod.replaceAll("_", " ")}
              </p>
              <p>
                Provider: {item.paymentProvider} | Mode: {item.paymentMode}
              </p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground xl:text-right">
              <p>Updated: {formatDateTime(item.updatedAt)}</p>
              <p>Last event: {formatDateTime(item.latestTimelineAt)}</p>
              <p>Age: {formatAgeHours(item.ageHours)}</p>
              <p>Created: {formatDateTime(item.createdAt)}</p>
              {item.refundStatus ? <p>Refund: {item.refundStatus}</p> : null}
              <div className="pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenOrder(item.orderId)}>
                  View order
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function StorefrontOrdersSection() {
  const [report, setReport] = useState<StorefrontAdminOrderOperationsReport | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  useGlobalLoading(isLoading)

  async function loadReport() {
    setIsLoading(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const nextReport = await storefrontApi.getOrdersReport(accessToken)
      setReport(nextReport)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load ecommerce orders."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadReport()
  }, [])

  const normalizedQuery = searchTerm.trim().toLowerCase()

  function getFilteredItems(bucket: "all" | StorefrontAdminOrderQueueBucket) {
    if (!report) {
      return []
    }

    return report.items.filter((item) => {
      if (bucket !== "all" && item.queueBucket !== bucket) {
        return false
      }

      if (statusFilter !== "all" && item.orderStatus !== statusFilter) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const haystack = [
        item.orderNumber,
        item.customerName,
        item.customerEmail,
        item.customerPhone,
        item.itemSummary,
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }

  const tabs: AnimatedContentTab[] = [
    {
      value: "all",
      label: `All (${report?.summary.totalOrders ?? 0})`,
      content: <OrderQueueList items={getFilteredItems("all")} onOpenOrder={setSelectedOrderId} />,
    },
    {
      value: "payment_attention",
      label: `Action required (${report?.summary.actionRequiredCount ?? 0})`,
      content: <OrderQueueList items={getFilteredItems("payment_attention")} onOpenOrder={setSelectedOrderId} />,
    },
    {
      value: "fulfilment",
      label: `Fulfilment (${report?.summary.fulfilmentQueueCount ?? 0})`,
      content: <OrderQueueList items={getFilteredItems("fulfilment")} onOpenOrder={setSelectedOrderId} />,
    },
    {
      value: "shipment",
      label: `Shipment (${report?.summary.shipmentQueueCount ?? 0})`,
      content: <OrderQueueList items={getFilteredItems("shipment")} onOpenOrder={setSelectedOrderId} />,
    },
    {
      value: "pickup",
      label: `Pickup (${report?.summary.pickupQueueCount ?? 0})`,
      content: <OrderQueueList items={getFilteredItems("pickup")} onOpenOrder={setSelectedOrderId} />,
    },
    {
      value: "completed",
      label: `Completed (${report?.summary.completedCount ?? 0})`,
      content: <OrderQueueList items={getFilteredItems("completed")} onOpenOrder={setSelectedOrderId} />,
    },
    {
      value: "closed",
      label: `Closed (${report?.summary.closedCount ?? 0})`,
      content: <OrderQueueList items={getFilteredItems("closed")} onOpenOrder={setSelectedOrderId} />,
    },
  ]

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
            <ClipboardList className="size-3.5" />
            Order operations
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <CardTitle>Ecommerce admin order queue</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-7">
                Review payment-attention orders, fulfilment work, shipment progress, pickup orders,
                and completed or closed records from one ecommerce-owned queue.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" className="gap-2" onClick={() => void loadReport()}>
              <RefreshCw className="size-4" />
              Refresh queue
            </Button>
          </div>
        </CardHeader>
      </Card>

      {report ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Action required"
            value={String(report.summary.actionRequiredCount)}
            description="Orders still blocked on payment recovery, pending verification, or early-stage intervention."
          />
          <SummaryCard
            title="Fulfilment queue"
            value={String(report.summary.fulfilmentQueueCount)}
            description="Paid delivery orders waiting to be packed, allocated, or moved into shipment."
          />
          <SummaryCard
            title="Shipment and pickup"
            value={String(report.summary.shipmentQueueCount + report.summary.pickupQueueCount)}
            description="Orders already handed to shipment flow or limited to in-store pickup handling."
          />
          <SummaryCard
            title="Completed and closed"
            value={String(report.summary.completedCount + report.summary.closedCount)}
            description="Delivered, cancelled, and refunded orders that no longer sit in the active queue."
          />
        </div>
      ) : null}

      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardContent className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by order number, customer, phone, or item"
              className="pl-9"
              aria-label="Search ecommerce order queue"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilterValue)}>
            <SelectTrigger aria-label="Filter order queue by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="payment_pending">Payment pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="fulfilment_pending">Fulfilment pending</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {report ? (
        <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <div className="rounded-[1.1rem] border border-border/70 bg-card/60 p-4">
              <div className="flex items-center gap-2 text-foreground">
                <Package className="size-4 text-primary" />
                <p className="font-medium">Total orders</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {report.summary.totalOrders} ecommerce orders are currently available in the admin queue.
              </p>
            </div>
            <div className="rounded-[1.1rem] border border-border/70 bg-card/60 p-4">
              <div className="flex items-center gap-2 text-foreground">
                <Truck className="size-4 text-indigo-600" />
                <p className="font-medium">Operational focus</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Work action-required orders first, then fulfilment and shipment queues, before reviewing completed history.
              </p>
            </div>
            <div className="rounded-[1.1rem] border border-border/70 bg-card/60 p-4">
              <div className="flex items-center gap-2 text-foreground">
                <RefreshCw className="size-4 text-emerald-600" />
                <p className="font-medium">Last generated</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {formatDateTime(report.generatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div>{report ? <AnimatedTabs defaultTabValue="all" tabs={tabs} /> : null}</div>
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
