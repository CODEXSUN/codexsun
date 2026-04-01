import { Bell, Headphones, Heart, ShoppingBag, ShoppingCart, UserCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { buildCustomerPortalPath } from '@framework-core/web/auth/lib/portal-routing'
import { useStorefront } from '@/features/store/context/storefront-context'
import { formatCurrency } from '@/features/store/lib/storefront-utils'
import { useCustomerOrders } from '../lib/customer-orders'

const quickActions = [
  { title: 'Orders', href: buildCustomerPortalPath('/orders'), icon: ShoppingBag, summary: 'Track placed orders and payment status.' },
  { title: 'Profile', href: buildCustomerPortalPath('/profile'), icon: UserCircle2, summary: 'Review your account details and delivery information.' },
  { title: 'Wishlist', href: buildCustomerPortalPath('/wishlist'), icon: Heart, summary: 'Keep products saved for later.' },
  { title: 'Support', href: buildCustomerPortalPath('/support'), icon: Headphones, summary: 'Reach help when you need order assistance.' },
] as const

export function CustomerDashboardPage() {
  const { session } = useAuth()
  const { cartItems, cartCount, cartSubtotal, wishlistProductIds } = useStorefront()
  const { orders, notifications, isLoading, errorMessage } = useCustomerOrders()
  const latestOrder = orders[0] ?? null

  return (
    <div className="space-y-4">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="gap-4 border-b border-border/60 p-8">
          <Badge className="w-fit">Customer portal</Badge>
          <div className="space-y-3">
            <CardTitle className="text-4xl tracking-tight sm:text-5xl">Your Tirupur Direct account.</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              Track current orders, keep saved styles close, and move back into checkout without leaving your portal.
            </CardDescription>
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
              Signed in as {session?.user.displayName ?? 'Customer'}
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-8 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Orders</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{orders.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">Placed orders currently linked to your account.</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Wishlist</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{wishlistProductIds.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">Products saved for later.</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Cart</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{cartCount}</p>
            <p className="mt-2 text-sm text-muted-foreground">{cartItems.length > 0 ? `${formatCurrency(cartSubtotal)} ready for checkout.` : 'No items queued right now.'}</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Notifications</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{notifications.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">Recent order and payment activity.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Account actions</CardTitle>
            <CardDescription>Fast access to the customer routes that matter most.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {quickActions.map((action) => (
              <Link key={action.href} to={action.href} className="rounded-[1.5rem] border border-border/70 p-5 transition hover:border-primary/40 hover:bg-accent/40">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/15">
                  <action.icon className="size-5 text-accent" />
                </div>
                <p className="mt-4 font-semibold text-foreground">{action.title}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{action.summary}</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current account state</CardTitle>
            <CardDescription>Live current data from your checkout and storefront activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.5rem] border border-border/70 p-5">
              <p className="font-semibold text-foreground">Profile email</p>
              <p className="mt-2 text-sm text-muted-foreground">{session?.user.email ?? 'No email on file'}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 p-5">
              <p className="font-semibold text-foreground">Latest order</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {isLoading ? 'Loading current orders...' : latestOrder ? `${latestOrder.orderNumber} • ${latestOrder.status}` : 'No order has been placed yet.'}
              </p>
            </div>
            {errorMessage ? (
              <div className="rounded-[1.25rem] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/search">
                  <ShoppingBag className="size-4" />
                  Browse catalog
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={buildCustomerPortalPath('/cart')}>
                  <ShoppingCart className="size-4" />
                  Open cart
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={buildCustomerPortalPath('/notifications')}>
                  <Bell className="size-4" />
                  Notifications
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
