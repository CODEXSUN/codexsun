import { useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CommerceOrderStatusBadge } from "@/components/ux/commerce-order-status-badge"
import { CommercePrice } from "@/components/ux/commerce-price"
import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"

import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { useStorefrontCart } from "../cart/storefront-cart"
import { CustomerPortalLayout } from "../components/customer-portal-layout"
import { StorefrontProductCard } from "../components/storefront-product-card"
import { CustomerProfileSection } from "../features/customer-portal/customer-profile-section"
import { useStorefrontCustomerPortal } from "../hooks/use-storefront-customer-portal"
import {
  customerPortalSections,
  normalizePortalSectionId,
} from "../lib/customer-portal"
import { storefrontPaths } from "../lib/storefront-routes"

function SummaryMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1.4rem] border border-border/70 bg-background/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  )
}

export function StorefrontAccountPage() {
  const { sectionId } = useParams()
  const activeSection = normalizePortalSectionId(sectionId)
  const navigate = useNavigate()
  const customerAuth = useStorefrontCustomerAuth()
  const customerPortal = useStorefrontCustomerPortal()
  const cart = useStorefrontCart()
  const { brand } = useRuntimeBrand()
  const portal = customerPortal.portalQuery.data
  const orders = customerPortal.ordersQuery.data?.items ?? []
  const [error, setError] = useState<string | null>(null)

  if (!customerAuth.isAuthenticated) {
    return <Navigate to={storefrontPaths.accountLogin(storefrontPaths.account())} replace />
  }

  async function handleToggleWishlist(productId: string) {
    try {
      await customerPortal.toggleWishlist(productId)
    } catch (wishlistError) {
      setError(wishlistError instanceof Error ? wishlistError.message : "Failed to update wishlist.")
    }
  }

  function renderSection() {
    if (!portal) {
      return (
        <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading customer portal...
          </CardContent>
        </Card>
      )
    }

    if (activeSection === "overview") {
      return (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryMetric label="Orders" value={String(portal.stats.orderCount)} />
            <SummaryMetric label="Wishlist" value={String(portal.stats.wishlistCount)} />
            <SummaryMetric label="Coupons" value={String(portal.stats.activeCouponCount)} />
            <SummaryMetric label="Reward Points" value={String(portal.rewards.pointsBalance)} />
          </div>
          <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {customerPortalSections.slice(1, 5).map((section) => {
                const Icon = section.icon

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => void navigate(storefrontPaths.accountSection(section.id))}
                    className="rounded-[1.4rem] border border-border/70 bg-background/70 p-4 text-left transition hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <p className="mt-4 font-medium text-foreground">{section.label}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.summary}</p>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )
    }

    if (activeSection === "profile") {
      return (
        <CustomerProfileSection
          profile={portal.profile}
          onSave={async (payload) => {
            setError(null)
            try {
              await customerAuth.updateProfile(payload)
              await customerAuth.refresh()
              await customerPortal.portalQuery.refetch()
            } catch (saveError) {
              setError(
                saveError instanceof Error ? saveError.message : "Failed to save profile."
              )
              throw saveError
            }
          }}
        />
      )
    }

    if (activeSection === "wishlist") {
      return portal.wishlist.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {portal.wishlist.map((item) => (
            <StorefrontProductCard
              key={item.id}
              item={item}
              href={storefrontPaths.product(item.slug)}
              isWishlisted
              onToggleWishlist={() => void handleToggleWishlist(item.id)}
              onAddToCart={() =>
                cart.addItem({
                  productId: item.id,
                  slug: item.slug,
                  name: item.name,
                  imageUrl: item.primaryImageUrl,
                  unitPrice: item.sellingPrice,
                  mrp: item.mrp,
                })
              }
            />
          ))}
        </div>
      ) : (
        <Card className="rounded-[1.8rem] border-dashed border-border/70 py-0 shadow-sm">
          <CardContent className="grid gap-4 p-6">
            <p className="text-sm text-muted-foreground">
              Wishlist items appear here after you save products from catalog or product detail screens.
            </p>
            <div>
              <Button asChild className="rounded-full">
                <Link to={storefrontPaths.catalog()}>Browse catalog</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (activeSection === "cart") {
      return (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-4">
            {cart.items.length > 0 ? (
              cart.items.map((item) => (
                <Card key={item.productId} className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
                  <CardContent className="flex items-center justify-between gap-4 p-5">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.quantity} items</p>
                    </div>
                    <CommercePrice amount={item.unitPrice * item.quantity} compareAtAmount={item.mrp * item.quantity} />
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="rounded-[1.8rem] border-dashed border-border/70 py-0 shadow-sm">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Your live storefront cart is empty.
                </CardContent>
              </Card>
            )}
          </div>
          <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Cart summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">{cart.itemCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <CommercePrice amount={cart.subtotalAmount} />
              </div>
              <Button asChild className="w-full rounded-full">
                <Link to={storefrontPaths.cart()}>Open cart</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link to={storefrontPaths.checkout()}>Go to checkout</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (activeSection === "orders") {
      return (
        <div className="grid gap-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <Card key={order.id} className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="space-y-2">
                    <Link
                      to={storefrontPaths.accountOrder(order.id)}
                      className="font-medium text-foreground transition hover:text-primary"
                    >
                      {order.orderNumber}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{order.itemCount} items</span>
                      <CommercePrice amount={order.totalAmount} />
                    </div>
                  </div>
                  <CommerceOrderStatusBadge status={order.status} />
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="rounded-[1.8rem] border-dashed border-border/70 py-0 shadow-sm">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Orders will appear here after your first checkout.
              </CardContent>
            </Card>
          )}
        </div>
      )
    }

    if (activeSection === "support") {
      return (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Need help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">
                Reach the support desk for order help, account access, payment questions, or delivery updates.
              </p>
              {brand?.primaryEmail ? (
                <div className="rounded-[1.3rem] border border-border/70 bg-background/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Support Email
                  </p>
                  <a
                    href={`mailto:${brand.primaryEmail}`}
                    className="mt-2 block text-base font-medium text-foreground transition hover:text-primary"
                  >
                    {brand.primaryEmail}
                  </a>
                </div>
              ) : null}
              {brand?.primaryPhone ? (
                <div className="rounded-[1.3rem] border border-border/70 bg-background/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Support Phone
                  </p>
                  <a
                    href={`tel:${brand.primaryPhone}`}
                    className="mt-2 block text-base font-medium text-foreground transition hover:text-primary"
                  >
                    {brand.primaryPhone}
                  </a>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full">
                  <Link to={storefrontPaths.trackOrder()}>Track an order</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to={storefrontPaths.accountSection("orders")}>Open orders</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Support details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.3rem] border border-border/70 bg-background/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Company
                </p>
                <p className="mt-2 font-medium text-foreground">{brand?.brandName ?? "Support Desk"}</p>
                {brand?.tagline ? (
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{brand.tagline}</p>
                ) : null}
              </div>
              {brand?.website ? (
                <div className="rounded-[1.3rem] border border-border/70 bg-background/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Website
                  </p>
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block text-sm font-medium text-foreground transition hover:text-primary"
                  >
                    {brand.website}
                  </a>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )
    }

    if (activeSection === "coupons") {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          {portal.coupons.map((coupon) => (
            <Card key={coupon.id} className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {coupon.code}
                    </p>
                    <p className="mt-2 text-xl font-semibold">{coupon.title}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {coupon.discountLabel}
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{coupon.summary}</p>
                <p className="text-sm text-muted-foreground">
                  Minimum order {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(coupon.minimumOrderAmount)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (activeSection === "gift-cards") {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          {portal.giftCards.map((giftCard) => (
            <Card key={giftCard.id} className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {giftCard.code}
                    </p>
                    <p className="mt-2 text-xl font-semibold">{giftCard.title}</p>
                  </div>
                  <CommercePrice amount={giftCard.balanceAmount} />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{giftCard.summary}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric label="Tier" value={portal.rewards.tier.toUpperCase()} />
          <SummaryMetric label="Available points" value={String(portal.rewards.pointsBalance)} />
          <SummaryMetric label="Lifetime points" value={String(portal.rewards.lifetimePoints)} />
          <SummaryMetric
            label="Next tier"
            value={portal.rewards.nextTier ? portal.rewards.nextTier.toUpperCase() : "MAX"}
          />
        </div>
        <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
          <CardHeader>
            <CardTitle>Reward activity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {portal.rewards.activities.map((activity) => (
              <div key={activity.id} className="rounded-[1.3rem] border border-border/70 bg-background/80 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{activity.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{activity.summary}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700">
                    +{activity.points}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <CustomerPortalLayout
      activeSection={activeSection}
      title={portal?.profile.displayName ?? customerAuth.customer?.displayName ?? "Your account"}
      description="Profile, wishlist, cart, orders, coupons, gift cards, and rewards in one customer-only portal."
    >
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {renderSection()}
    </CustomerPortalLayout>
  )
}
