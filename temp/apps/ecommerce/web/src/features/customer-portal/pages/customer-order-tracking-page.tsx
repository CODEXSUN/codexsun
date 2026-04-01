import { useParams, Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/features/store/lib/storefront-utils'
import { useCustomerOrderWorkflow } from '../lib/customer-orders'
import { 
  CheckCircle2, 
  Truck, 
  Package, 
  ClipboardCheck, 
  Clock, 
  MapPin, 
  ArrowLeft,
  ExternalLink,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function CustomerOrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { workflow, isLoading, errorMessage } = useCustomerOrderWorkflow(orderId)

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading tracking details...</div>
      </div>
    )
  }

  if (errorMessage || !workflow) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild className="-ml-2 gap-2 text-muted-foreground hover:text-foreground">
          <Link to="/account/orders">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-destructive">
            <Info className="h-5 w-5" />
            {errorMessage || 'Order tracking data not available.'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const { order, events, shipment, shipmentEvents } = workflow
  
  const steps = [
    { key: 'placed', label: 'Order Placed', icon: ClipboardCheck },
    { key: 'packed', label: 'Packed', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ]

  // Determine current step index
  const getCurrentStepIndex = () => {
    if (order.status === 'delivered' || order.status === 'delivery_confirmed') return 3
    if (order.status === 'shipped' || order.status === 'out_for_delivery' || order.status === 'in_transit') return 2
    if (order.status === 'packed' || order.status === 'courier_assigned') return 1
    return 0
  }

  const currentStepIndex = getCurrentStepIndex()

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-[2.2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_-44px_rgba(40,28,18,0.25)] sm:p-8">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <Button variant="ghost" asChild className="-ml-3 gap-2 text-muted-foreground hover:text-foreground">
                <Link to="/account/orders">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Orders
                </Link>
              </Button>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Track Order <span className="text-primary/80">#{order.orderNumber}</span>
              </h1>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                {order.status.replace(/_/g, ' ')}
              </Badge>
              <p className="mt-2 text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                Updated {new Date(order.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stepper Logic */}
          <div className="relative pt-8 pb-4">
            <div className="absolute top-[3.25rem] left-[10%] right-[10%] h-0.5 bg-slate-200">
              <div 
                className="h-full bg-slate-900 transition-all duration-700 ease-in-out" 
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 80 + 10}%` }}
              />
            </div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isCompleted = index <= currentStepIndex
                const isActive = index === currentStepIndex

                return (
                  <div key={step.key} className="flex flex-col items-center gap-3 text-center">
                    <div className={cn(
                      "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-500",
                      isCompleted ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "border-slate-200 bg-white text-slate-400"
                    )}>
                      <Icon className={cn("h-6 w-6", isActive && "animate-pulse")} />
                    </div>
                    <div>
                      <p className={cn(
                        "text-xs font-bold uppercase tracking-wider sm:text-sm",
                        isCompleted ? "text-slate-900" : "text-slate-400"
                      )}>
                        {step.label}
                      </p>
                      {isCompleted && index === 0 && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Timeline and Status */}
        <div className="space-y-6 lg:col-span-2">
          {/* Shipment Card */}
          {shipment && (
            <Card className="overflow-hidden rounded-[1.8rem] border-white/70 bg-white/78 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.24)]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Shipment Details</h3>
                        <p className="text-sm text-muted-foreground">{shipment.courierName || 'Pending Courier Assignment'}</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tracking ID</p>
                        <p className="font-mono text-sm font-semibold text-foreground">{shipment.trackingNumber || 'Awaiting ID'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Est. Delivery</p>
                        <p className="text-sm font-semibold text-foreground">
                          {shipment.estimatedDeliveryAt ? new Date(shipment.estimatedDeliveryAt).toLocaleDateString() : 'To be updated'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {shipment.trackingUrl && (
                    <Button variant="outline" size="sm" asChild className="rounded-xl border-slate-200 hover:bg-slate-50">
                      <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                        Track Online
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline Section */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 px-1 text-lg font-bold text-foreground">
              <Clock className="h-5 w-5 text-primary/70" />
              Order Timeline
            </h3>
            <div className="space-y-4">
              {[...shipmentEvents, ...events].sort((a, b) => new Date((b as any).occurredAt || (b as any).eventTime).getTime() - new Date((a as any).occurredAt || (a as any).eventTime).getTime()).map((event: any, idx) => (
                <div key={event.id} className="relative flex gap-4 pl-1">
                  {/* Timeline Line */}
                  {idx !== events.length + shipmentEvents.length - 1 && (
                    <div className="absolute top-8 left-4 bottom-[-1rem] w-0.5 bg-slate-100" />
                  )}
                  
                  <div className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm",
                    idx === 0 ? "border-slate-900 text-slate-900 ring-4 ring-slate-900/5" : "border-slate-100 text-slate-400"
                  )}>
                    <div className={cn("h-2 w-2 rounded-full", idx === 0 ? "bg-slate-900" : "bg-slate-200")} />
                  </div>
                  
                  <div className={cn(
                    "flex-1 rounded-[1.4rem] border p-4 transition-all",
                    idx === 0 ? "border-slate-900/10 bg-white shadow-sm" : "border-slate-50 bg-white/40"
                  )}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className={cn("text-sm font-bold", idx === 0 ? "text-slate-900" : "text-slate-600")}>
                          {event.title}
                        </p>
                        {event.description && (
                          <p className="text-xs leading-relaxed text-muted-foreground">{event.description}</p>
                        )}
                        {event.locationName && (
                          <p className="flex items-center gap-1.5 pt-1 text-[10px] font-medium text-slate-500">
                            <MapPin className="h-3 w-3" />
                            {event.locationName}
                          </p>
                        )}
                      </div>
                      <time className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">
                        {new Date(event.occurredAt || event.eventTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </time>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary Snapshot */}
        <div className="space-y-6">
          <Card className="rounded-[1.8rem] border-white/70 bg-white/78 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.24)]">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-foreground">Order Snapshot</h3>
              
              <div className="space-y-4">
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                       <Package className="h-6 w-6 text-slate-300" />
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <p className="text-sm font-semibold truncate text-foreground">{item.productName}</p>
                      <p className="text-[11px] text-muted-foreground">Qty: {item.quantity} · {item.size} / {item.color}</p>
                    </div>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-[11px] font-medium text-muted-foreground pl-1">
                    + {order.items.length - 3} more items
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items Total</span>
                  <span className="font-semibold text-foreground">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold text-foreground">{formatCurrency(order.shippingAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-900/5">
                  <span className="text-sm font-bold text-foreground">Total Paid</span>
                  <span className="text-base font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Delivery To</p>
                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                  <p className="text-xs leading-relaxed text-foreground font-medium">
                    {order.firstName} {order.lastName}<br />
                    {order.addressLine1}<br />
                    {order.city}, {order.state} {order.postalCode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
