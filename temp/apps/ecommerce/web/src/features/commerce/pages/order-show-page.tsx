import type {
  CommerceOrderEvent,
  CommerceOrderEventType,
  CommerceOrderWorkflow,
  CommerceShipmentEvent,
  CommerceWorkflowActionPayload,
} from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, CalendarClock, CircleDot, CreditCard, PackageCheck, Printer, Truck } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { DetailSection, EntityDetailHeader, formatDetailValue } from '@/components/entity/entity-detail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import {
  applyCommerceWorkflowAction,
  getCommerceInvoicePrint,
  getCommerceOrderWorkflow,
  HttpError,
} from '@/shared/api/client'
import { showErrorToast, showInfoToast, showSuccessToast } from '@/shared/notifications/toast'

type ActionFormState = {
  courierName: string
  courierService: string
  trackingNumber: string
  trackingUrl: string
  locationName: string
  estimatedDeliveryAt: string
  notes: string
  description: string
}

const initialActionFormState: ActionFormState = {
  courierName: '',
  courierService: '',
  trackingNumber: '',
  trackingUrl: '',
  locationName: '',
  estimatedDeliveryAt: '',
  notes: '',
  description: '',
}

const quickActions: Array<{ eventType: CommerceOrderEventType; label: string; description: string }> = [
  { eventType: 'prepare_delivery', label: 'Prepare', description: 'Move the order into warehouse preparation.' },
  { eventType: 'packed', label: 'Pack', description: 'Mark the garments as packed for handover.' },
  { eventType: 'courier_assigned', label: 'Assign courier', description: 'Record the courier, service, and tracking references.' },
  { eventType: 'picked_up', label: 'Picked up', description: 'Record the pickup handover from warehouse to courier.' },
  { eventType: 'in_transit', label: 'In transit', description: 'Mark the parcel as moving through the carrier network.' },
  { eventType: 'out_for_delivery', label: 'Out for delivery', description: 'Mark the parcel as out with the delivery rider.' },
  { eventType: 'delivered', label: 'Delivered', description: 'Record the courier-side delivery completion.' },
  { eventType: 'delivery_confirmed', label: 'Customer confirmed', description: 'Capture final delivery confirmation from the customer.' },
]

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    const detail =
      error.context &&
      typeof error.context === 'object' &&
      'detail' in error.context &&
      typeof error.context.detail === 'string'
        ? error.context.detail
        : null

    return detail ? `${error.message} ${detail}` : error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to complete this order operation.'
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Not recorded'
  }

  return new Date(value).toLocaleString()
}

function statusTone(value: string) {
  if (['delivered', 'delivery_confirmed', 'paid', 'issued'].includes(value)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }

  if (['cancelled'].includes(value)) {
    return 'border-rose-200 bg-rose-50 text-rose-800'
  }

  if (['pending_payment', 'draft', 'pending'].includes(value)) {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }

  return 'border-sky-200 bg-sky-50 text-sky-800'
}

function eventLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function buildPayload(eventType: CommerceOrderEventType, values: ActionFormState): CommerceWorkflowActionPayload {
  return {
    eventType,
    courierName: values.courierName || undefined,
    courierService: values.courierService || undefined,
    trackingNumber: values.trackingNumber || undefined,
    trackingUrl: values.trackingUrl || undefined,
    locationName: values.locationName || undefined,
    estimatedDeliveryAt: values.estimatedDeliveryAt || undefined,
    notes: values.notes || undefined,
    description: values.description || undefined,
  }
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border/60 last:border-b-0">
      <th className="w-[168px] border-r border-border/70 px-3 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:w-[208px]">
        {label}
      </th>
      <td className="px-4 py-3 text-sm text-foreground">{value}</td>
    </tr>
  )
}

function TimelineList({
  items,
  emptyText,
}: {
  items: Array<CommerceOrderEvent | CommerceShipmentEvent>
  emptyText: string
}) {
  if (items.length === 0) {
    return <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/50 px-4 py-5 text-sm text-muted-foreground">{emptyText}</div>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const timestamp = 'occurredAt' in item ? item.occurredAt : item.eventTime
        return (
          <div key={item.id} className="flex gap-3 rounded-[1.35rem] border border-border/70 bg-background/65 p-4">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <CircleDot className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{item.title}</p>
                <Badge variant="outline" className="capitalize">
                  {eventLabel(item.eventType)}
                </Badge>
              </div>
              {item.description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p> : null}
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">{formatDate(timestamp)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function OrderShowPage() {
  const { orderId } = useParams()
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? null
  const [loading, setLoading] = useState(true)
  const [workingAction, setWorkingAction] = useState<CommerceOrderEventType | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [workflow, setWorkflow] = useState<CommerceOrderWorkflow | null>(null)
  const [actionValues, setActionValues] = useState<ActionFormState>(initialActionFormState)

  const order = workflow?.order ?? null

  useEffect(() => {
    const token = accessToken
    const selectedOrderId = orderId
    if (typeof token !== 'string' || !selectedOrderId) {
      return
    }

    let cancelled = false

    async function loadWorkflow() {
      const authToken = token
      const selectedOrderIdValue = selectedOrderId
      if (!authToken || !selectedOrderIdValue) {
        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const nextWorkflow = await getCommerceOrderWorkflow(authToken, selectedOrderIdValue)
        if (!cancelled) {
          setWorkflow(nextWorkflow)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadWorkflow()

    return () => {
      cancelled = true
    }
  }, [accessToken, orderId])

  async function refreshWorkflow() {
    const token = accessToken
    const selectedOrderId = orderId
    if (typeof token !== 'string' || !selectedOrderId) {
      return
    }

    setErrorMessage(null)
    setWorkflow(await getCommerceOrderWorkflow(token, selectedOrderId))
  }

  async function runAction(eventType: CommerceOrderEventType) {
    const token = accessToken
    const selectedOrderId = orderId
    if (typeof token !== 'string' || !selectedOrderId) {
      return
    }

    setWorkingAction(eventType)
    setErrorMessage(null)

    try {
      const nextWorkflow = await applyCommerceWorkflowAction(
        token,
        selectedOrderId,
        buildPayload(eventType, actionValues),
      )
      setWorkflow(nextWorkflow)
      await refreshWorkflow()
      showSuccessToast({
        title: 'Workflow updated',
        description: `${eventLabel(eventType)} recorded for ${nextWorkflow.order.orderNumber}.`,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to update workflow',
        description: message,
      })
    } finally {
      setWorkingAction(null)
    }
  }

  async function handlePrintInvoice() {
    const token = accessToken
    const selectedOrderId = orderId
    if (typeof token !== 'string' || !selectedOrderId) {
      return
    }

    try {
      const document = await getCommerceInvoicePrint(token, selectedOrderId)
      const popup = window.open('', '_blank', 'noopener,noreferrer')
      if (!popup) {
        showInfoToast({
          title: 'Popup blocked',
          description: 'Allow popups to open the print-ready invoice preview.',
        })
        return
      }

      popup.document.open()
      popup.document.write(document.html)
      popup.document.close()
      popup.focus()
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to open invoice',
        description: message,
      })
    }
  }

  const statusSummary = useMemo(() => {
    if (!workflow) {
      return null
    }

    return {
      order: workflow.order.status,
      shipment: workflow.shipment?.status ?? 'pending',
      invoice: workflow.invoice?.status ?? 'draft',
    }
  }, [workflow])

  if (session?.user.actorType !== 'admin' && session?.user.actorType !== 'staff') {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">
          This operations workspace is available only for internal fulfillment teams.
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Loading order workflow...</CardContent>
      </Card>
    )
  }

  if (!workflow || !order) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-destructive">{errorMessage ?? 'Order record not found.'}</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <EntityDetailHeader
        backHref="/admin/dashboard/orders"
        backLabel="Back to orders"
        title={order.orderNumber}
        description="Review order identity, customer delivery details, workflow actions, shipment updates, invoice output, and linked accounting."
        isActive={order.status !== 'cancelled'}
        actions={(
          <>
            <Button variant="outline" onClick={() => void runAction('estimated_delivery_updated')} disabled={workingAction !== null}>
              <CalendarClock className="size-4" />
              Update ETA
            </Button>
            <Button variant="outline" onClick={() => void runAction('tracking_updated')} disabled={workingAction !== null}>
              <Truck className="size-4" />
              Update tracking
            </Button>
            <Button onClick={() => void handlePrintInvoice()} disabled={!workflow.invoice}>
              <Printer className="size-4" />
              Print invoice
            </Button>
          </>
        )}
      />

      {errorMessage ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_320px]">
        <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
          <table className="w-full border-collapse">
            <tbody>
              <OverviewRow label="Customer" value={`${order.firstName} ${order.lastName}`} />
              <OverviewRow label="Email" value={order.email} />
              <OverviewRow label="Mobile" value={order.phone} />
              <OverviewRow label="Order Status" value={eventLabel(order.status)} />
              <OverviewRow label="Payment Status" value={eventLabel(order.paymentStatus)} />
              <OverviewRow label="Delivery Method" value={eventLabel(order.deliveryMethod)} />
              <OverviewRow label="Payment Method" value={eventLabel(order.paymentMethod)} />
              <OverviewRow label="Created" value={formatDate(order.createdAt)} />
              <OverviewRow label="Delivery Address" value={formatDetailValue([
                order.addressLine1,
                order.addressLine2,
                order.city,
                order.state,
                order.postalCode,
                order.country,
              ].filter(Boolean).join(', '))} />
              <OverviewRow label="Customer Note" value={formatDetailValue(order.note)} />
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Workflow status</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1rem] border border-border/70 bg-muted/20 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Order</p>
                <div className="mt-2"><Badge variant="outline" className={statusTone(statusSummary?.order ?? 'pending')}>{eventLabel(statusSummary?.order ?? 'pending')}</Badge></div>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-muted/20 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Shipment</p>
                <div className="mt-2"><Badge variant="outline" className={statusTone(statusSummary?.shipment ?? 'pending')}>{eventLabel(statusSummary?.shipment ?? 'pending')}</Badge></div>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-muted/20 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Invoice</p>
                <div className="mt-2"><Badge variant="outline" className={statusTone(statusSummary?.invoice ?? 'draft')}>{eventLabel(statusSummary?.invoice ?? 'draft')}</Badge></div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Commercial snapshot</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1rem] border border-border/70 bg-muted/20 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Items</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-muted/20 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Total</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatCurrency(order.totalAmount, order.currency)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DetailSection
        title="Order lines"
        description="Customer order lines in a product-style table for quick operational review."
      >
        <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
          <table className="w-full border-collapse">
            <thead className="bg-muted/30">
              <tr className="border-b border-border/60">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Item</th>
                <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">SKU</th>
                <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Variant</th>
                <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Qty</th>
                <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Unit Price</th>
                <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-border/60 last:border-b-0">
                  <td className="px-4 py-3 text-sm text-foreground">{item.productName}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{item.sku}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{item.size} / {item.color}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{item.quantity}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{formatCurrency(item.unitPrice, order.currency)}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm font-medium text-foreground">{formatCurrency(item.lineTotal, order.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailSection>

      <Tabs defaultValue="actions" className="space-y-4">
        <TabsList className="flex w-full flex-wrap justify-start gap-2 rounded-[1.2rem] border border-border/70 bg-background/60 p-2">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="shipment">Shipment</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Workflow actions</CardTitle>
                <CardDescription>Operate the fulfillment lifecycle from intake to final confirmation.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {quickActions.map((action) => (
                  <button
                    key={action.eventType}
                    type="button"
                    onClick={() => void runAction(action.eventType)}
                    disabled={workingAction !== null}
                    className="rounded-[1.3rem] border border-border/70 bg-background/70 p-4 text-left transition hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <p className="font-medium text-foreground">{action.label}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Dispatch details</CardTitle>
                <CardDescription>Use this form for courier assignment, ETA changes, and tracking updates.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="order-courier-name">Courier name</Label>
                  <Input id="order-courier-name" value={actionValues.courierName} onChange={(event) => setActionValues((current) => ({ ...current, courierName: event.target.value }))} placeholder="Delhivery, Blue Dart, DTDC" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order-courier-service">Courier service</Label>
                  <Input id="order-courier-service" value={actionValues.courierService} onChange={(event) => setActionValues((current) => ({ ...current, courierService: event.target.value }))} placeholder="Surface, air, express" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order-tracking-number">Tracking number</Label>
                  <Input id="order-tracking-number" value={actionValues.trackingNumber} onChange={(event) => setActionValues((current) => ({ ...current, trackingNumber: event.target.value }))} placeholder="AWB / tracking reference" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order-location">Current location</Label>
                  <Input id="order-location" value={actionValues.locationName} onChange={(event) => setActionValues((current) => ({ ...current, locationName: event.target.value }))} placeholder="Tiruppur hub, Chennai, customer city" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="order-tracking-url">Tracking URL</Label>
                  <Input id="order-tracking-url" value={actionValues.trackingUrl} onChange={(event) => setActionValues((current) => ({ ...current, trackingUrl: event.target.value }))} placeholder="https://courier.example/track/..." />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="order-eta">Estimated delivery</Label>
                  <Input id="order-eta" type="datetime-local" value={actionValues.estimatedDeliveryAt} onChange={(event) => setActionValues((current) => ({ ...current, estimatedDeliveryAt: event.target.value }))} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="order-action-description">Event description</Label>
                  <Textarea id="order-action-description" value={actionValues.description} onChange={(event) => setActionValues((current) => ({ ...current, description: event.target.value }))} placeholder="Operator note for the next event." rows={3} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="order-action-notes">Shipment notes</Label>
                  <Textarea id="order-action-notes" value={actionValues.notes} onChange={(event) => setActionValues((current) => ({ ...current, notes: event.target.value }))} placeholder="Permanent notes stored on the shipment record." rows={3} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow timeline</CardTitle>
              <CardDescription>Every state transition is recorded as an explicit backend event for audit and support traceability.</CardDescription>
            </CardHeader>
            <CardContent>
              <TimelineList items={workflow.events} emptyText="No order events have been recorded yet." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="size-5" />
                Shipment tracking
              </CardTitle>
              <CardDescription>Courier references, promised dates, and parcel event scans.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-3">
                <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Shipment number</p>
                  <p className="mt-2 font-semibold text-foreground">{workflow.shipment?.shipmentNumber ?? 'Not created'}</p>
                </div>
                <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Courier</p>
                  <p className="mt-2 text-foreground">{workflow.shipment?.courierName ?? 'Not assigned'}</p>
                  <p className="text-sm text-muted-foreground">{workflow.shipment?.courierService ?? 'No service selected'}</p>
                </div>
                <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tracking</p>
                  <p className="mt-2 text-foreground">{workflow.shipment?.trackingNumber ?? 'No tracking number'}</p>
                  {workflow.shipment?.trackingUrl ? (
                    <a href={workflow.shipment.trackingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-accent underline-offset-4 hover:underline">
                      Open tracking
                      <ArrowUpRight className="size-4" />
                    </a>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4 text-sm">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Picked up</p>
                    <p className="mt-2 text-foreground">{formatDate(workflow.shipment?.pickedUpAt ?? null)}</p>
                  </div>
                  <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4 text-sm">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">ETA</p>
                    <p className="mt-2 text-foreground">{formatDate(workflow.shipment?.estimatedDeliveryAt ?? null)}</p>
                  </div>
                </div>
              </div>
              <TimelineList items={workflow.shipmentEvents} emptyText="Shipment events will appear here once fulfillment begins." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="size-5" />
                Invoice and order lines
              </CardTitle>
              <CardDescription>Sales invoice rows generated from storefront order items.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflow.invoice ? (
                <>
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Invoice</p>
                      <p className="mt-2 font-semibold text-foreground">{workflow.invoice.invoiceNumber}</p>
                    </div>
                    <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</p>
                      <div className="mt-2"><Badge variant="outline" className={statusTone(workflow.invoice.status)}>{eventLabel(workflow.invoice.status)}</Badge></div>
                    </div>
                    <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Payment</p>
                      <p className="mt-2 font-semibold text-foreground">{eventLabel(workflow.invoice.paymentStatus)}</p>
                    </div>
                    <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Total</p>
                      <p className="mt-2 font-semibold text-foreground">{formatCurrency(workflow.invoice.totalAmount, workflow.invoice.currency)}</p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
                    <table className="w-full border-collapse">
                      <thead className="bg-muted/30">
                        <tr className="border-b border-border/60">
                          <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Description</th>
                          <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Qty</th>
                          <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Unit Price</th>
                          <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workflow.invoice.items.map((item) => (
                          <tr key={item.id} className="border-b border-border/60 last:border-b-0">
                            <td className="px-4 py-3 text-sm text-foreground">{item.description}</td>
                            <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{item.quantity}</td>
                            <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{formatCurrency(item.unitPrice, workflow.invoice?.currency ?? order.currency)}</td>
                            <td className="border-l border-border/70 px-4 py-3 text-sm font-medium text-foreground">{formatCurrency(item.lineTotal, workflow.invoice?.currency ?? order.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/55 px-4 py-5 text-sm text-muted-foreground">
                  Invoice has not been created for this order.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5" />
                Accounting postings
              </CardTitle>
              <CardDescription>Linked vouchers keep sales and collection flows auditable.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflow.accountingVouchers.length > 0 ? workflow.accountingVouchers.map((voucher) => (
                <div key={voucher.id} className="rounded-[1.35rem] border border-border/70 bg-background/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{voucher.voucherNumber}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{voucher.voucherType} · Posted {formatDate(voucher.postingDate)}</p>
                    </div>
                    <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-800">
                      {eventLabel(voucher.voucherType)}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {voucher.lines.map((line) => (
                      <div key={line.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[1.1rem] border border-border/70 bg-background/70 px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-foreground">{line.ledgerName}</p>
                          <p className="text-muted-foreground">{line.ledgerCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-foreground">Dr {line.debitAmount.toFixed(2)}</p>
                          <p className="text-muted-foreground">Cr {line.creditAmount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/55 px-4 py-5 text-sm text-muted-foreground">
                  Accounting voucher is not posted yet for this order.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
