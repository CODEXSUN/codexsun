import { CalendarClock, CheckCheck, CreditCard, MapPin, PackageCheck, PackageOpen, Truck } from "lucide-react"
import type { ReactNode } from "react"

import type { StorefrontOrder, StorefrontOrderTimelineEvent } from "@ecommerce/shared"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CommerceOrderStatusBadge } from "@/components/ux/commerce-order-status-badge"
import { CommercePrice } from "@/components/ux/commerce-price"

import {
  handleStorefrontImageError,
  resolveStorefrontImageUrl,
} from "../lib/storefront-image"

const timelineFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatTimestamp(value: string | null | undefined) {
  if (!value) {
    return "Awaiting update"
  }

  const timestamp = new Date(value)

  if (Number.isNaN(timestamp.getTime())) {
    return "Awaiting update"
  }

  return timelineFormatter.format(timestamp)
}

function findTimelineEntry(
  timeline: StorefrontOrder["timeline"],
  codes: string[]
) {
  return timeline.find((entry) => codes.includes(entry.code)) ?? null
}

function toLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function TimelineMilestone({
  icon: Icon,
  label,
  summary,
  timestamp,
  isComplete,
}: {
  icon: typeof CalendarClock
  label: string
  summary: string
  timestamp: string | null | undefined
  isComplete: boolean
}) {
  return (
    <div className="rounded-[1.55rem] border border-primary/12 bg-gradient-to-b from-primary/10 via-background to-background p-4 shadow-[0_18px_34px_-28px_hsl(var(--primary)/0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-11 items-center justify-center rounded-[1rem] bg-primary/12 text-primary">
          <Icon className="size-5" />
        </div>
        <Badge
          variant="outline"
          className={isComplete ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border/70 bg-background/80 text-muted-foreground"}
        >
          {isComplete ? "Completed" : "Pending"}
        </Badge>
      </div>
      <p className="mt-4 text-sm font-semibold tracking-tight text-foreground">{label}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{summary}</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">
        {formatTimestamp(timestamp)}
      </p>
    </div>
  )
}

function TimelineEntryRow({ entry }: { entry: StorefrontOrderTimelineEvent }) {
  return (
    <div className="flex gap-4 rounded-[1.35rem] border border-border/70 bg-background/85 p-4">
      <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCheck className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-medium text-foreground">{entry.label}</p>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {formatTimestamp(entry.createdAt)}
          </p>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.summary}</p>
      </div>
    </div>
  )
}

export function StorefrontOrderDetailCard({
  order,
  actions,
}: {
  order: StorefrontOrder
  actions?: ReactNode
}) {
  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: order.currency,
    maximumFractionDigits: 0,
  })
  const orderCreatedEntry = findTimelineEntry(order.timeline, ["order_created"])
  const deliveredEntry = findTimelineEntry(order.timeline, [
    "delivered",
    "order_delivered",
    "shipment_delivered",
  ])
  const shippedEntry = findTimelineEntry(order.timeline, [
    "shipped",
    "order_shipped",
    "shipment_shipped",
  ])
  const paymentPendingEntry = findTimelineEntry(order.timeline, ["payment_pending"])
  const orderPaidEntry = findTimelineEntry(order.timeline, ["order_paid", "payment_captured"])
  const deliveryStatusLabel =
    order.fulfillmentMethod === "store_pickup"
      ? order.status === "cancelled"
        ? "Pickup cancelled"
        : order.status === "refunded"
          ? "Refunded"
          : order.paymentCollectionMethod === "pay_at_store" && order.paymentStatus !== "paid"
            ? "Awaiting pickup payment"
            : order.status === "delivered"
              ? "Collected"
              : order.paymentStatus === "paid" || order.status === "paid" || order.status === "fulfilment_pending"
                ? "Ready for pickup"
                : "Pickup reserved"
      : order.status === "cancelled"
        ? "Cancelled"
        : order.status === "refunded"
          ? "Refunded"
          : order.status === "delivered"
            ? "Delivered"
            : order.status === "shipped"
              ? "In transit"
              : order.paymentStatus === "paid" || order.status === "paid" || order.status === "fulfilment_pending"
                ? "Preparing shipment"
                : order.status === "payment_pending"
                  ? "Awaiting payment"
                  : "Order created"
  const deliveryStatusTimestamp =
    deliveredEntry?.createdAt ??
    shippedEntry?.createdAt ??
    orderPaidEntry?.createdAt ??
    paymentPendingEntry?.createdAt ??
    orderCreatedEntry?.createdAt

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[2rem] border-primary/16 bg-gradient-to-br from-primary/10 via-background to-background py-0 shadow-[0_26px_56px_-40px_hsl(var(--primary)/0.25)]">
        <CardContent className="grid gap-6 p-5 md:p-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">
                  Order overview
                </p>
                <div>
                  <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-[2.4rem]">
                    {order.orderNumber}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Purchased on {formatTimestamp(orderCreatedEntry?.createdAt ?? order.createdAt)}
                  </p>
                </div>
              </div>
              <CommerceOrderStatusBadge status={order.status} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full border-primary/15 bg-background/82 px-3 py-1">
                {order.itemCount} item{order.itemCount > 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline" className="rounded-full border-primary/15 bg-background/82 px-3 py-1">
                Payment {toLabel(order.paymentStatus)}
              </Badge>
              <Badge variant="outline" className="rounded-full border-primary/15 bg-background/82 px-3 py-1">
                {order.paymentProvider === "store"
                  ? "Store payment"
                  : `${order.paymentProvider.toUpperCase()} ${toLabel(order.paymentMode)}`}
              </Badge>
              <Badge variant="outline" className="rounded-full border-primary/15 bg-background/82 px-3 py-1">
                {order.fulfillmentMethod === "store_pickup" ? "Store pickup" : "Home delivery"}
              </Badge>
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-primary/14 bg-background/88 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/75">
                  {order.fulfillmentMethod === "store_pickup" ? "Pickup for" : "Shipping to"}
                </p>
                <p className="mt-3 font-medium text-foreground">{order.shippingAddress.fullName}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-primary/14 bg-background/88 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/75">
                  Payment reference
                </p>
                <p className="mt-3 font-medium text-foreground">
                  {order.providerPaymentId ?? order.providerOrderId ?? "Pending capture"}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Latest update {formatTimestamp(order.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[1.55rem] border border-primary/14 bg-background/88 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/75">
                Total paid
              </p>
              <div className="mt-3">
                <CommercePrice amount={order.totalAmount} />
              </div>
            </div>
            <div className="rounded-[1.55rem] border border-primary/14 bg-background/88 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/75">
                Delivery status
              </p>
              <p className="mt-3 text-base font-semibold text-foreground">
                {deliveryStatusLabel}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {formatTimestamp(deliveryStatusTimestamp)}
              </p>
            </div>
            <div className="rounded-[1.55rem] border border-primary/14 bg-background/88 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/75">
                Order note
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {order.notes ?? "No additional delivery or purchase note was added for this order."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <TimelineMilestone
          icon={PackageOpen}
          label="Purchased"
          summary="Checkout was placed successfully and the order was created in the storefront."
          timestamp={orderCreatedEntry?.createdAt ?? order.createdAt}
          isComplete
        />
        <TimelineMilestone
          icon={CreditCard}
          label="Paid"
          summary="Payment verification status for this order."
          timestamp={orderPaidEntry?.createdAt}
          isComplete={order.paymentStatus === "paid" || orderPaidEntry !== null}
        />
        <TimelineMilestone
          icon={Truck}
          label="Delivered"
          summary="Delivery confirmation appears here once the fulfillment timeline reaches the destination."
          timestamp={deliveredEntry?.createdAt}
          isComplete={deliveredEntry !== null || order.status === "delivered"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <Card className="rounded-[2rem] border-border/70 py-0 shadow-[0_18px_42px_-34px_hsl(var(--primary)/0.2)]">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="text-[1.35rem] tracking-tight">Purchased items</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 rounded-[1.6rem] border border-border/70 bg-gradient-to-b from-background to-primary/5 p-4 md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-center"
              >
                <div className="overflow-hidden rounded-[1.2rem] border border-border/70 bg-muted/30">
                  <img
                    src={resolveStorefrontImageUrl(item.imageUrl, item.name)}
                    alt={item.name}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(event) => handleStorefrontImageError(event, item.name)}
                  />
                </div>

                <div className="min-w-0 space-y-3">
                  <div className="space-y-1">
                    {item.brandName ? (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
                        {item.brandName}
                      </p>
                    ) : null}
                    <p className="text-base font-semibold tracking-tight text-foreground">
                      {item.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x {currencyFormatter.format(item.unitPrice)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.variantLabel ? (
                      <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground">
                        {item.variantLabel}
                      </Badge>
                    ) : null}
                    {item.attributes.map((attribute) => (
                      <Badge
                        key={`${item.id}:${attribute.name}:${attribute.value}`}
                        variant="outline"
                        className="rounded-full border-border/70 bg-background/85 px-3 py-1"
                      >
                        {attribute.name}: {attribute.value}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="justify-self-start md:justify-self-end">
                  <CommercePrice
                    amount={item.lineTotal}
                    compareAtAmount={item.mrp * item.quantity}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[2rem] border-border/70 py-0 shadow-[0_18px_42px_-34px_hsl(var(--primary)/0.2)]">
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle className="text-[1.35rem] tracking-tight">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <CommercePrice amount={order.subtotalAmount} />
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-emerald-700">
                  -{currencyFormatter.format(order.discountAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Shipping</span>
                {order.shippingAmount > 0 ? (
                  <CommercePrice amount={order.shippingAmount} />
                ) : (
                  <span className="font-medium text-emerald-700">Free</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Handling</span>
                {order.handlingAmount > 0 ? (
                  <CommercePrice amount={order.handlingAmount} />
                ) : (
                  <span className="font-medium text-emerald-700">Free</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 rounded-[1.3rem] border border-primary/14 bg-primary/7 px-4 py-3">
                <span className="font-semibold text-foreground">Grand total</span>
                <CommercePrice amount={order.totalAmount} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/70 py-0 shadow-[0_18px_42px_-34px_hsl(var(--primary)/0.2)]">
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle className="flex items-center gap-2 text-[1.35rem] tracking-tight">
                <MapPin className="size-4 text-primary" />
                {order.fulfillmentMethod === "store_pickup" ? "Pickup details" : "Delivery address"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {order.fulfillmentMethod === "store_pickup" && order.pickupLocation ? (
                <div className="rounded-[1.35rem] border border-border/70 bg-background/85 p-4">
                  <p className="font-semibold text-foreground">{order.pickupLocation.storeName}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {order.pickupLocation.line1}
                    {order.pickupLocation.line2 ? `, ${order.pickupLocation.line2}` : ""}
                    <br />
                    {order.pickupLocation.city}, {order.pickupLocation.state} {order.pickupLocation.pincode}
                    <br />
                    {order.pickupLocation.country}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {order.pickupLocation.pickupNote}
                  </p>
                </div>
              ) : (
                <div className="rounded-[1.35rem] border border-border/70 bg-background/85 p-4">
                  <p className="font-semibold text-foreground">{order.shippingAddress.fullName}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {order.shippingAddress.line1}
                    {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                    <br />
                    {order.shippingAddress.country}
                  </p>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[1.25rem] border border-border/70 bg-background/85 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {order.shippingAddress.email}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-border/70 bg-background/85 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Phone
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {order.shippingAddress.phoneNumber}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/70 py-0 shadow-[0_18px_42px_-34px_hsl(var(--primary)/0.2)]">
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle className="flex items-center gap-2 text-[1.35rem] tracking-tight">
                <PackageCheck className="size-4 text-primary" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-5">
              {order.timeline.map((entry) => (
                <TimelineEntryRow key={entry.id} entry={entry} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
