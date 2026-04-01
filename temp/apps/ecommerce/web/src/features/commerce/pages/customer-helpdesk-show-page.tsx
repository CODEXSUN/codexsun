import type { CustomerHelpdeskDetail, CustomerHelpdeskIssueSeverity, StorefrontOrder } from '@shared/index'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Mail, MapPin, ShieldCheck, ShoppingBag, UserRound } from 'lucide-react'
import { DetailSection, EntityDetailHeader, formatDetailValue } from '@/components/entity/entity-detail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import {
  getCustomerHelpdeskCustomer,
  HttpError,
  sendCustomerHelpdeskPasswordReset,
  sendCustomerHelpdeskRecoveryEmail,
} from '@/shared/api/client'
import { showErrorToast, showSuccessToast } from '@/shared/notifications/toast'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Not recorded'
  }

  return new Date(value).toLocaleString()
}

function formatAddress(parts: Array<string | null | undefined>) {
  return parts.filter((part) => part && part.trim().length > 0).join(', ')
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to load the customer support record.'
}

function issueTone(severity: CustomerHelpdeskIssueSeverity) {
  switch (severity) {
    case 'critical':
      return 'border-rose-200 bg-rose-50 text-rose-950'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-950'
    default:
      return 'border-sky-200 bg-sky-50 text-sky-950'
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

function OrderPanel({ order }: { order: StorefrontOrder }) {
  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-4 py-4">
        <div>
          <p className="text-base font-semibold text-foreground">{order.orderNumber}</p>
          <p className="mt-1 text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{order.status}</Badge>
          <Badge variant="outline">{order.paymentStatus}</Badge>
          <Badge variant="outline" className="capitalize">{order.deliveryMethod}</Badge>
        </div>
      </div>

      <table className="w-full border-collapse">
        <tbody>
          <OverviewRow label="Customer" value={`${order.firstName} ${order.lastName}`} />
          <OverviewRow label="Email" value={order.email} />
          <OverviewRow label="Mobile" value={order.phone} />
          <OverviewRow label="Payment Method" value={order.paymentMethod} />
          <OverviewRow label="Gateway" value={formatDetailValue(order.paymentGateway)} />
          <OverviewRow label="Payment Captured" value={formatDate(order.paymentCapturedAt)} />
          <OverviewRow label="Delivery Address" value={formatAddress([
            order.addressLine1,
            order.addressLine2,
            order.city,
            order.state,
            order.postalCode,
            order.country,
          ]) || '-'} />
          <OverviewRow label="Customer Note" value={formatDetailValue(order.note)} />
        </tbody>
      </table>

      <div className="border-t border-border/60">
        <div className="grid gap-px bg-border/60 md:grid-cols-4">
          <div className="bg-background/70 px-4 py-3 text-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Subtotal</p>
            <p className="mt-2 font-semibold text-foreground">{formatCurrency(order.subtotal)}</p>
          </div>
          <div className="bg-background/70 px-4 py-3 text-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Shipping</p>
            <p className="mt-2 font-semibold text-foreground">{formatCurrency(order.shippingAmount)}</p>
          </div>
          <div className="bg-background/70 px-4 py-3 text-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Handling</p>
            <p className="mt-2 font-semibold text-foreground">{formatCurrency(order.handlingAmount)}</p>
          </div>
          <div className="bg-background/70 px-4 py-3 text-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Total</p>
            <p className="mt-2 font-semibold text-foreground">{formatCurrency(order.totalAmount)}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60">
        {order.items.length === 0 ? (
          <div className="px-4 py-4 text-sm text-muted-foreground">No line items were recorded for this order.</div>
        ) : (
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
                  <td className="px-4 py-3 text-sm text-foreground">
                    <div className="space-y-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">/{item.productSlug}</p>
                    </div>
                  </td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{item.sku}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{item.size} / {item.color}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{item.quantity}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{formatCurrency(item.unitPrice)}</td>
                  <td className="border-l border-border/70 px-4 py-3 text-sm font-medium text-foreground">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export function CustomerHelpdeskShowPage() {
  const { customerId } = useParams()
  const { session } = useAuth()
  const token = session?.accessToken ?? null
  const [item, setItem] = useState<CustomerHelpdeskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [workingAction, setWorkingAction] = useState<'password-reset' | 'recovery' | null>(null)

  useEffect(() => {
    const accessToken = token
    if (!accessToken || !customerId || (session?.user.actorType !== 'admin' && session?.user.actorType !== 'staff')) {
      return
    }

    let cancelled = false

    async function loadCustomer() {
      const authToken = accessToken
      const selectedCustomerId = customerId
      if (!authToken || !selectedCustomerId) {
        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const nextItem = await getCustomerHelpdeskCustomer(authToken, selectedCustomerId)
        if (!cancelled) {
          setItem(nextItem)
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

    void loadCustomer()

    return () => {
      cancelled = true
    }
  }, [customerId, session?.user.actorType, token])

  async function refreshCustomer() {
    const selectedCustomerId = customerId
    if (!token || !selectedCustomerId) {
      return
    }

    setErrorMessage(null)
    setItem(await getCustomerHelpdeskCustomer(token, selectedCustomerId))
  }

  async function handleSendPasswordReset() {
    if (!token || !item) {
      return
    }

    setWorkingAction('password-reset')
    try {
      await sendCustomerHelpdeskPasswordReset(token, item.customer.id)
      showSuccessToast({
        title: 'Password reset sent',
        description: `Password reset OTP sent to ${item.customer.email}.`,
      })
      await refreshCustomer()
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to send reset OTP',
        description: message,
      })
    } finally {
      setWorkingAction(null)
    }
  }

  async function handleSendRecoveryEmail() {
    if (!token || !item) {
      return
    }

    setWorkingAction('recovery')
    try {
      await sendCustomerHelpdeskRecoveryEmail(token, item.customer.id)
      showSuccessToast({
        title: 'Recovery email sent',
        description: `Recovery OTP sent to ${item.customer.email}.`,
      })
      await refreshCustomer()
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to send recovery OTP',
        description: message,
      })
    } finally {
      setWorkingAction(null)
    }
  }

  if (session?.user.actorType !== 'admin' && session?.user.actorType !== 'staff') {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">
          This workspace is available only to internal support and operations users.
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Loading customer record...</CardContent>
      </Card>
    )
  }

  if (!item) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-destructive">{errorMessage ?? 'Customer record not found.'}</CardContent>
      </Card>
    )
  }

  const profile = item.customer.profile
  const lastOrder = item.orders[0] ?? null

  return (
    <div className="space-y-6">
      <EntityDetailHeader
        backHref="/admin/dashboard/customers"
        backLabel="Back to customers"
        title={item.customer.displayName}
        description="Review the full customer support record, validate identity using existing account and order data, and trigger supported recovery actions."
        isActive={item.customer.isActive}
        actions={(
          <>
            <Button onClick={() => void handleSendPasswordReset()} disabled={workingAction !== null || !item.customer.isActive}>
              <Mail className="size-4" />
              {workingAction === 'password-reset' ? 'Sending reset OTP...' : 'Send password reset OTP'}
            </Button>
            <Button variant="outline" onClick={() => void handleSendRecoveryEmail()} disabled={workingAction !== null || item.customer.isActive}>
              <ShieldCheck className="size-4" />
              {workingAction === 'recovery' ? 'Sending recovery OTP...' : 'Send recovery email'}
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
              <OverviewRow label="Email" value={item.customer.email} />
              <OverviewRow label="Mobile" value={formatDetailValue(item.customer.phoneNumber)} />
              <OverviewRow label="Account Status" value={item.customer.isActive ? 'Active' : 'Disabled'} />
              <OverviewRow label="Issue Count" value={String(item.issues.length)} />
              <OverviewRow label="Orders" value={`${item.customer.orderCount} orders / ${formatCurrency(item.customer.totalSpent)}`} />
              <OverviewRow label="Last Order" value={item.customer.lastOrderNumber ?? 'No order yet'} />
              <OverviewRow label="Last Order Time" value={formatDate(item.customer.lastOrderAt)} />
              <OverviewRow label="Saved Address" value={formatDetailValue(item.customer.defaultAddressSummary)} />
              <OverviewRow label="Deletion Requested" value={formatDate(item.customer.deletionRequestedAt)} />
              <OverviewRow label="Recovery Window" value={formatDate(item.customer.purgeAfterAt)} />
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Support snapshot</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1rem] border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <UserRound className="size-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{profile.displayName}</p>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-muted/20 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Profile addresses</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{profile.addresses.length}</p>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-muted/20 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Latest order status</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{lastOrder?.status ?? 'No order yet'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Call guidance</p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>Verify email, mobile, and address details already saved in the account.</p>
              <p>Use order number, item rows, and delivery destination to resolve mismatch cases.</p>
              <p>Do not ask for the customer&apos;s password or existing login credentials.</p>
            </div>
          </div>
        </div>
      </div>

      <DetailSection
        title="Support flags"
        description="Operational issues derived from account, address, and order history."
      >
        {item.issues.length > 0 ? (
          <div className="grid gap-3">
            {item.issues.map((issue) => (
              <div key={issue.code} className={`rounded-[1.25rem] border px-4 py-4 ${issueTone(issue.severity)}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">{issue.title}</p>
                  <Badge variant="outline" className="bg-white/70">{issue.severity}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6">{issue.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
            No obvious account, delivery, or order mismatch risks are currently flagged for this customer.
          </div>
        )}
      </DetailSection>

      <DetailSection
        title="Order ledger"
        description="Full order summary with delivery, payment, and line-item detail for customer support calls."
      >
        {item.orders.length > 0 ? (
          <div className="grid gap-4">
            {item.orders.map((order) => (
              <OrderPanel key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/55 px-4 py-5 text-sm text-muted-foreground">
            No storefront orders are linked to this customer email yet.
          </div>
        )}
      </DetailSection>

      <DetailSection
        title="Address verification"
        description="Compare saved profile addresses against recent delivery destinations from the order ledger."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
            <div className="border-b border-border/60 px-4 py-4">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <p className="font-semibold text-foreground">Saved addresses</p>
              </div>
            </div>
            {item.addresses.length > 0 ? (
              <div className="grid gap-px bg-border/60">
                {item.addresses.map((address) => (
                  <div key={address.id} className="bg-background/70 px-4 py-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">{address.label}</p>
                      {address.isDefault ? <Badge variant="outline">default</Badge> : null}
                    </div>
                    <p className="mt-2 text-foreground">{address.firstName} {address.lastName}</p>
                    <p className="text-muted-foreground">{address.phone}</p>
                    <p className="mt-2 text-muted-foreground">
                      {formatAddress([
                        address.addressLine1,
                        address.addressLine2,
                        address.city,
                        address.state,
                        address.postalCode,
                        address.country,
                      ])}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-5 text-sm text-muted-foreground">No saved delivery addresses are available on the profile.</div>
            )}
          </div>

          <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
            <div className="border-b border-border/60 px-4 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-4 text-primary" />
                <p className="font-semibold text-foreground">Recent delivery destinations</p>
              </div>
            </div>
            {item.orders.length > 0 ? (
              <div className="grid gap-px bg-border/60">
                {item.orders.slice(0, 4).map((order) => (
                  <div key={order.id} className="bg-background/70 px-4 py-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">{order.orderNumber}</p>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                    <p className="mt-2 text-foreground">{order.firstName} {order.lastName}</p>
                    <p className="text-muted-foreground">{order.phone}</p>
                    <p className="mt-2 text-muted-foreground">
                      {formatAddress([
                        order.addressLine1,
                        order.addressLine2,
                        order.city,
                        order.state,
                        order.postalCode,
                        order.country,
                      ])}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-5 text-sm text-muted-foreground">No order-linked delivery destinations are available yet.</div>
            )}
          </div>
        </div>
      </DetailSection>

      <DetailSection
        title="Verification history"
        description="Recent OTP and recovery challenges for known customer destinations."
      >
        {item.verifications.length > 0 ? (
          <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
            <table className="w-full border-collapse">
              <thead className="bg-muted/30">
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Purpose</th>
                  <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Destination</th>
                  <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Channel</th>
                  <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Requested</th>
                  <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Verified</th>
                  <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Expires</th>
                  <th className="border-l border-border/70 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">State</th>
                </tr>
              </thead>
              <tbody>
                {item.verifications.map((verification) => (
                  <tr key={verification.id} className="border-b border-border/60 last:border-b-0">
                    <td className="px-4 py-3 text-sm text-foreground">{verification.purpose}</td>
                    <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{verification.destination}</td>
                    <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{verification.channel}</td>
                    <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{formatDate(verification.createdAt)}</td>
                    <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{formatDate(verification.verifiedAt)}</td>
                    <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{formatDate(verification.expiresAt)}</td>
                    <td className="border-l border-border/70 px-4 py-3 text-sm text-foreground">{verification.isActive ? 'Active' : 'Closed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/55 px-4 py-5 text-sm text-muted-foreground">
            No recent verification history is available for this customer.
          </div>
        )}
      </DetailSection>
    </div>
  )
}
