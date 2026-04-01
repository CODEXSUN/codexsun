import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/features/store/lib/storefront-utils'
import { describeCustomerOrder, getCustomerPaymentLabel, useCustomerOrders } from '../lib/customer-orders'

export function CustomerOrdersPage() {
  const { orders, isLoading, errorMessage } = useCustomerOrders()

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_-44px_rgba(40,28,18,0.25)] sm:p-7">
        <div className="space-y-3">
          <Badge variant="outline" className="w-fit">
            Order History
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Order History.</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Review placed orders, item lines, payment state, and delivery destination.
            </p>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading orders...</CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-muted-foreground">No storefront orders are linked to your account yet.</p>
            <Button asChild>
              <Link to="/search">Start shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order, orderIndex) => (
            <section
              key={order.id}
              className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/78 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.24)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex min-w-10 items-center justify-center rounded-full border border-slate-900/10 bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      #{orderIndex + 1}
                    </span>
                    <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{order.orderNumber}</h2>
                    <Badge variant="outline">{order.status}</Badge>
                    <Badge variant="outline">{order.paymentStatus}</Badge>
                    <Button variant="outline" size="sm" asChild className="ml-auto rounded-full px-4 text-xs font-semibold">
                      <Link to={`/account/orders/${order.id}/track`}>Track Shipment</Link>
                    </Button>
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{describeCustomerOrder(order)}</p>
                </div>

                <div className="grid min-w-[220px] gap-2 text-right text-sm">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Placed</p>
                    <p className="mt-1 font-medium text-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Payment Rail</p>
                    <p className="mt-1 font-medium text-foreground">{getCustomerPaymentLabel(order)}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 border-b border-border/60 bg-background/40 px-5 py-4 sm:grid-cols-4 sm:px-6">
                <div className="rounded-[1.2rem] border border-border/70 bg-white/70 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Items</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {order.items.reduce((total, item) => total + item.quantity, 0)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-white/70 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Subtotal</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{formatCurrency(order.subtotal)}</p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-white/70 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Shipping</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{formatCurrency(order.shippingAmount)}</p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-white/70 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{formatCurrency(order.totalAmount)}</p>
                </div>
              </div>

              <div className="px-5 py-4 sm:px-6">
                <div className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-background/55">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead className="bg-white/75 text-left">
                        <tr className="border-b border-border/70">
                          <th className="px-4 py-3 font-semibold text-foreground">No.</th>
                          <th className="px-4 py-3 font-semibold text-foreground">Item</th>
                          <th className="px-4 py-3 font-semibold text-foreground">Variant</th>
                          <th className="px-4 py-3 text-right font-semibold text-foreground">Qty</th>
                          <th className="px-4 py-3 text-right font-semibold text-foreground">Unit</th>
                          <th className="px-4 py-3 text-right font-semibold text-foreground">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, index) => (
                          <tr key={item.id} className="border-b border-border/60 last:border-b-0">
                            <td className="px-4 py-3">
                              <span className="inline-flex min-w-9 items-center justify-center rounded-full border border-border/70 bg-muted/35 px-2.5 py-1 text-xs font-semibold text-foreground">
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-foreground">{item.productName}</div>
                              <div className="text-xs text-muted-foreground">{item.productSlug}</div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{item.size} / {item.color}</td>
                            <td className="px-4 py-3 text-right font-medium text-foreground">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground">{formatCurrency(item.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 px-5 pb-5 sm:grid-cols-[1.15fr_0.85fr] sm:px-6 sm:pb-6">
                <div className="rounded-[1.35rem] border border-border/70 bg-background/60 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Delivery Address</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {order.firstName} {order.lastName}
                    <br />
                    {order.addressLine1}
                    {order.addressLine2 ? (
                      <>
                        <br />
                        {order.addressLine2}
                      </>
                    ) : null}
                    <br />
                    {order.city}, {order.state} {order.postalCode}
                    <br />
                    {order.country}
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-border/70 bg-background/60 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Order Snapshot</p>
                  <dl className="mt-2 grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Payment status</dt>
                      <dd className="font-medium text-foreground">{order.paymentStatus}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Delivery method</dt>
                      <dd className="font-medium capitalize text-foreground">{order.deliveryMethod}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Payment method</dt>
                      <dd className="max-w-[12rem] text-right font-medium capitalize text-foreground">{order.paymentMethod}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
