import { useEffect, useState } from "react"
import { ArrowRight, Download, RefreshCcw, ShieldCheck, Sparkles, Trash2, Truck } from "lucide-react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"

import type {
  StorefrontCommunicationLogItem,
  StorefrontSupportCaseView,
} from "@ecommerce/shared"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CommerceOrderStatusBadge } from "@/components/ux/commerce-order-status-badge"
import { CommercePrice } from "@/components/ux/commerce-price"
import { CommerceQuantityStepper } from "@/components/ux/commerce-quantity-stepper"
import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"
import { GlobalLoader } from "@/registry/concerns/feedback/global-loader"
import { cn } from "@/lib/utils"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { useStorefrontCart } from "../cart/storefront-cart"
import { CustomerPortalLayout } from "../components/customer-portal-layout"
import { StorefrontProductCard } from "../components/storefront-product-card"
import { CustomerProfileSection } from "../features/customer-portal/customer-profile-section"
import { useStorefrontCustomerPortal } from "../hooks/use-storefront-customer-portal"
import {
  handleStorefrontImageError,
  resolveStorefrontImageUrl,
} from "../lib/storefront-image"
import {
  customerPortalSections,
  normalizePortalSectionId,
} from "../lib/customer-portal"
import { StorefrontCheckoutContent } from "./storefront-checkout-page"
import { storefrontPaths } from "../lib/storefront-routes"

const portalFreeShippingThreshold = 5000
const portalShippingEstimate = 199
const portalHandlingEstimate = 99

function formatPortalCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPortalDateTime(value: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
}

function formatSupportCaseLabel(value: string) {
  return value.replaceAll("_", " ")
}

function PortalCartSummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string
  value: React.ReactNode
  emphasized?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 text-sm",
        emphasized && "border-t border-[#eadfd3] pt-4 text-base font-semibold"
      )}
    >
      <span className={cn("text-muted-foreground", emphasized && "text-foreground")}>
        {label}
      </span>
      <div className="text-right text-foreground">{value}</div>
    </div>
  )
}

function SummaryMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1.7rem] border border-primary/12 bg-gradient-to-b from-primary/8 via-background to-background p-5 shadow-[0_18px_38px_-30px_hsl(var(--primary)/0.18)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/75">
        {label}
      </p>
      <p className="mt-3 text-[1.9rem] font-semibold tracking-tight text-foreground">{value}</p>
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
  const supportCases = customerPortal.supportCasesQuery.data?.items ?? []
  const [communicationItems, setCommunicationItems] = useState<StorefrontCommunicationLogItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [supportDraft, setSupportDraft] = useState({
    orderId: "none",
    category: "order" as "order" | "payment" | "shipment" | "refund" | "account" | "other",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
    subject: "",
    message: "",
  })
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null)
  const estimatedShipping =
    cart.items.length === 0
      ? 0
      : cart.subtotalAmount >= portalFreeShippingThreshold
        ? 0
        : portalShippingEstimate
  const estimatedHandling = cart.items.length === 0 ? 0 : portalHandlingEstimate
  const estimatedTotal = cart.subtotalAmount + estimatedShipping + estimatedHandling
  const totalSavings = cart.items.reduce(
    (sum, item) => sum + Math.max(0, (item.mrp - item.unitPrice) * item.quantity),
    0
  )

  useEffect(() => {
    if (!customerAuth.accessToken || !customerAuth.customer || customerAuth.isLoading) {
      setCommunicationItems([])
      return
    }

    let isCancelled = false

    async function loadCommunicationHistory() {
      try {
        const response = await storefrontApi.getCustomerCommunicationLog(customerAuth.accessToken!)

        if (!isCancelled) {
          setCommunicationItems(response.items)
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load communication history."
          )
        }
      }
    }

    void loadCommunicationHistory()

    return () => {
      isCancelled = true
    }
  }, [customerAuth.accessToken, customerAuth.customer, customerAuth.isLoading])

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

  async function handleCreateSupportCase() {
    try {
      setError(null)

      const response = await customerPortal.createSupportCase({
        orderId: supportDraft.orderId === "none" ? null : supportDraft.orderId,
        category: supportDraft.category,
        priority: supportDraft.priority,
        subject: supportDraft.subject,
        message: supportDraft.message,
      })

      setSupportDraft({
        orderId: "none",
        category: "order",
        priority: "normal",
        subject: "",
        message: "",
      })
      showRecordToast({
        entity: "Support case",
        action: "created",
        recordName: response.item.caseNumber,
      })
    } catch (supportError) {
      const message =
        supportError instanceof Error ? supportError.message : "Failed to create support case."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Support request failed.",
        description: message,
      })
    }
  }

  async function handleDownloadReceipt(orderId: string) {
    if (!customerAuth.accessToken) {
      return
    }

    setDownloadingOrderId(orderId)

    try {
      const document = await storefrontApi.downloadCustomerOrderReceipt(
        customerAuth.accessToken,
        orderId
      )
      const href = window.URL.createObjectURL(document.blob)
      const anchor = window.document.createElement("a")
      anchor.href = href
      anchor.download = document.fileName
      window.document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(href)
    } catch (downloadError) {
      const message =
        downloadError instanceof Error ? downloadError.message : "Failed to download receipt."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Receipt download failed.",
        description: message,
      })
    } finally {
      setDownloadingOrderId(null)
    }
  }

  async function handleRepeatOrder(orderId: string) {
    if (!customerAuth.accessToken) {
      return
    }

    setDownloadingOrderId(orderId)

    try {
      const response = await storefrontApi.getCustomerOrder(customerAuth.accessToken, orderId)

      response.item.items.forEach((item) => {
        cart.addItem(
          {
            productId: item.productId,
            slug: item.slug,
            name: item.name,
            imageUrl: item.imageUrl,
            unitPrice: item.unitPrice,
            mrp: item.mrp,
          },
          item.quantity
        )
      })

      showRecordToast({
        entity: "Order",
        action: "repeated",
        recordName: response.item.orderNumber,
      })
      void navigate(storefrontPaths.accountSection("cart"))
    } catch (repeatError) {
      const message =
        repeatError instanceof Error ? repeatError.message : "Failed to add the order back to cart."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Repeat order failed.",
        description: message,
      })
    } finally {
      setDownloadingOrderId(null)
    }
  }

  function handleMoveWishlistToCart() {
    portal?.wishlist.forEach((item) => {
      cart.addItem({
        productId: item.id,
        slug: item.slug,
        name: item.name,
        imageUrl: item.primaryImageUrl,
        unitPrice: item.sellingPrice,
        mrp: item.mrp,
        shippingCharge: item.shippingCharge,
        handlingCharge: item.handlingCharge,
      })
    })

    showAppToast({
      variant: "success",
      title: "Wishlist moved to cart.",
      description: "Saved products were added to your cart for checkout review.",
    })
    void navigate(storefrontPaths.accountSection("cart"))
  }

  function renderSection() {
    if (!portal) {
      return (
        <GlobalLoader
          fullScreen={false}
          size="md"
          label="Loading customer portal..."
          className="min-h-[48vh]"
        />
      )
    }

    if (activeSection === "overview") {
      return (
        <div className="space-y-8 py-1 md:space-y-10 md:py-3">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryMetric label="Orders" value={String(portal.stats.orderCount)} />
            <SummaryMetric label="Wishlist" value={String(portal.stats.wishlistCount)} />
            <SummaryMetric label="Coupons" value={String(portal.stats.activeCouponCount)} />
            <SummaryMetric label="Reward Points" value={String(portal.rewards.pointsBalance)} />
          </div>
          <Card className="overflow-hidden rounded-[2rem] border-primary/20 bg-gradient-to-b from-primary/8 via-background to-background py-0 shadow-[0_24px_52px_-36px_hsl(var(--primary)/0.18)]">
            <CardHeader className="space-y-2 border-b border-primary/12 pb-5 pt-3 md:pt-5">
              <CardTitle className="text-[1.55rem] tracking-tight text-foreground">
                Quick actions
              </CardTitle>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                Move through your customer workspace quickly with the most common account actions, all in one place.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 pt-5 md:grid-cols-2 md:p-7 md:pt-6 xl:grid-cols-4">
              {customerPortalSections.slice(1, 5).map((section) => {
                const Icon = section.icon

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => void navigate(storefrontPaths.accountSection(section.id))}
                    className="rounded-[1.6rem] border border-primary/22 bg-gradient-to-b from-background via-primary/4 to-primary/8 p-5 text-left shadow-[0_12px_28px_-26px_hsl(var(--primary)/0.18)] transition hover:-translate-y-1 hover:border-primary/30 hover:from-background hover:via-primary/6 hover:to-primary/10 hover:shadow-[0_24px_40px_-28px_hsl(var(--primary)/0.22)]"
                  >
                    <div className="flex size-11 items-center justify-center rounded-[1.1rem] bg-gradient-to-br from-primary/90 to-primary/65 text-primary-foreground shadow-[0_18px_30px_-22px_hsl(var(--primary)/0.38)]">
                      <Icon className="size-5" />
                    </div>
                    <p className="mt-5 font-semibold tracking-tight text-foreground">{section.label}</p>
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
          accessToken={customerAuth.accessToken!}
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
          onDeactivate={async () => {
            setError(null)

            try {
              await storefrontApi.deactivateMyCustomerAccount(customerAuth.accessToken!)
            } catch (deactivateError) {
              setError(
                deactivateError instanceof Error
                  ? deactivateError.message
                  : "Failed to deactivate account."
              )
              throw deactivateError
            }

            await customerAuth.logout()
            void navigate(storefrontPaths.accountLogin(), { replace: true })
          }}
        />
      )
    }

    if (activeSection === "wishlist") {
      return portal.wishlist.length > 0 ? (
        <Card className="overflow-hidden rounded-[2rem] border-[#e3d4c3] bg-[linear-gradient(180deg,#fbf6ef_0%,#f3ebe2_100%)] py-0 shadow-[0_20px_44px_-34px_rgba(51,32,17,0.35)]">
          <CardContent className="space-y-5 p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8f6c56]">
                  Saved for later
                </p>
                <p className="text-sm leading-6 text-[#7d6658]">
                  Your wishlist stays ready here for quick comparison, easy return visits, and faster checkout.
                </p>
              </div>
              <Button type="button" className="rounded-full" onClick={handleMoveWishlistToCart}>
                Move all to cart
                <ArrowRight className="size-4" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {portal.wishlist.map((item) => (
                <StorefrontProductCard
                  key={item.id}
                  item={item}
                  href={storefrontPaths.product(item.slug)}
                  density="compact"
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
                      shippingCharge: item.shippingCharge,
                      handlingCharge: item.handlingCharge,
                    })
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
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
        <div className="space-y-6">
          <Card className="relative overflow-hidden rounded-[2.4rem] border-[#e3d5c6] bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(252,247,241,0.96)_34%,rgba(247,237,225,0.92)_100%)] py-0 shadow-[0_28px_70px_-46px_rgba(48,31,19,0.18)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(213,183,150,0.18),transparent_24%),radial-gradient(circle_at_74%_28%,rgba(255,255,255,0.72),transparent_22%),radial-gradient(circle_at_88%_82%,rgba(176,131,88,0.12),transparent_18%),linear-gradient(120deg,rgba(255,255,255,0.3),transparent_48%)]" />
            <CardContent className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="space-y-4">
                <Badge
                  variant="outline"
                  className="border-[#cfb9a0] bg-[#fffdf9] px-4 py-1 text-[11px] font-semibold tracking-[0.24em] uppercase text-[#2f2118]"
                >
                  Portal cart
                </Badge>
                <div className="space-y-3">
                  <h2 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                    Review and checkout without leaving your account.
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                    The cart now uses the same storefront surfaces, spacing, and summary
                    treatment, while delivery and payment stay inside your customer portal.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:justify-items-end">
                <Button asChild variant="outline" className="rounded-full border-[#ddd1c2] bg-white/82 px-5 text-[#2f241d] hover:border-[#d0c0ae] hover:bg-white">
                  <Link to={storefrontPaths.catalog()}>Continue shopping</Link>
                </Button>
                <Button asChild className="rounded-full bg-[#201712] px-5 text-white hover:bg-[#31231b]">
                  <Link to={storefrontPaths.accountSection("checkout")}>
                    Continue to checkout
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
            <section className="space-y-4">
              {cart.items.length === 0 ? (
                <Card className="rounded-[2rem] border-dashed border-[#dfd1c1] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,240,231,0.72))] py-0 shadow-[0_20px_50px_-42px_rgba(48,31,19,0.18)]">
                  <CardContent className="grid gap-5 p-6 sm:p-8">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Cart status
                      </p>
                      <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
                        Your bag is empty.
                      </h2>
                      <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                        Add products from the catalog, then come back here to review quantities,
                        savings, delivery estimates, and portal checkout totals.
                      </p>
                    </div>
                    <div>
                      <Button asChild className="rounded-full px-5">
                        <Link to={storefrontPaths.catalog()}>
                          Browse catalog
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                cart.items.map((item) => {
                  const lineAmount = item.unitPrice * item.quantity
                  const lineCompareAmount = item.mrp * item.quantity
                  const savingsAmount = Math.max(0, lineCompareAmount - lineAmount)

                  return (
                    <Card
                      key={item.productId}
                      className="overflow-hidden rounded-[2rem] border-[#e4d7c9] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(251,247,242,0.92))] py-0 shadow-[0_24px_60px_-44px_rgba(48,31,19,0.24)] backdrop-blur"
                    >
                      <CardContent className="p-4 sm:p-5">
                        <article className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
                          <div className="rounded-[1.55rem] border border-[#e6d8c8] bg-[linear-gradient(180deg,#f8f1e9,#fcf8f3)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:h-full">
                            <div className="overflow-hidden rounded-[1.2rem] border border-white/90 bg-white shadow-[inset_0_0_0_1px_rgba(223,208,192,0.8)]">
                              <img
                                src={resolveStorefrontImageUrl(item.imageUrl, item.name)}
                                alt={item.name}
                                className="aspect-[4/4.8] h-full w-full object-cover"
                                onError={(event) => handleStorefrontImageError(event, item.name)}
                              />
                            </div>
                          </div>

                          <div className="min-w-0 space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="min-w-0 space-y-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                  Bag item
                                </p>
                                <Link
                                  to={storefrontPaths.product(item.slug)}
                                  className="line-clamp-2 text-xl font-semibold tracking-tight text-foreground transition hover:text-primary"
                                >
                                  {item.name}
                                </Link>
                                <div className="flex flex-wrap gap-2">
                                  <Badge
                                    variant="outline"
                                    className="border-[#ded0c0] bg-[#fcfaf7] px-3 py-1 text-[11px] tracking-[0.14em] uppercase text-[#725947]"
                                  >
                                    Qty {item.quantity}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="border-[#ded0c0] bg-[#fcfaf7] px-3 py-1 text-[11px] tracking-[0.14em] uppercase text-[#725947]"
                                  >
                                    Unit {formatPortalCurrency(item.unitPrice)}
                                  </Badge>
                                  {savingsAmount > 0 ? (
                                    <Badge className="border-transparent bg-[#e4f4e8] px-3 py-1 text-[11px] tracking-[0.14em] uppercase text-[#2f7a46] shadow-[inset_0_0_0_1px_rgba(72,136,92,0.12)]">
                                      Save {formatPortalCurrency(savingsAmount)}
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>

                              <div className="space-y-2 text-left sm:text-right">
                                <CommercePrice
                                  amount={lineAmount}
                                  compareAtAmount={lineCompareAmount}
                                  className="justify-start sm:justify-end"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Totals refresh instantly in your portal.
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.45rem] border border-[#e7dacb] bg-[linear-gradient(180deg,#fffdf9,#faf5ef)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                              <CommerceQuantityStepper
                                value={item.quantity}
                                onChange={(quantity) => cart.updateQuantity(item.productId, quantity)}
                                className="border-[#d8c8b8] bg-white shadow-[0_10px_22px_-18px_rgba(48,31,19,0.28)]"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                className="rounded-full px-3 text-[#3a2b22] hover:bg-[#f4ede5]"
                                onClick={() => cart.removeItem(item.productId)}
                              >
                                <Trash2 className="size-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </article>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </section>

            <aside className="space-y-5">
              <Card className="rounded-[2rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(251,247,242,0.93))] py-0 shadow-[0_24px_60px_-44px_rgba(48,31,19,0.18)]">
                <CardContent className="space-y-5 p-5 sm:p-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      Order summary
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Estimated totals stay visible while final shipping and payment are confirmed during portal checkout.
                    </p>
                  </div>

                  {totalSavings > 0 ? (
                    <div className="rounded-[1.5rem] border border-[#cde6d3] bg-[#e7f5ea] px-4 py-3 text-sm text-[#2f7a46]">
                      You are currently saving {formatPortalCurrency(totalSavings)} on this bag.
                    </div>
                  ) : null}

                  <div className="space-y-4">
                    <PortalCartSummaryRow
                      label="Items"
                      value={<span className="font-medium">{cart.itemCount}</span>}
                    />
                    <PortalCartSummaryRow
                      label="Subtotal"
                      value={<CommercePrice amount={cart.subtotalAmount} className="justify-end" />}
                    />
                    <PortalCartSummaryRow
                      label="Shipping"
                      value={
                        estimatedShipping === 0 ? (
                          <span className="font-medium">Free</span>
                        ) : (
                          <CommercePrice amount={estimatedShipping} className="justify-end" />
                        )
                      }
                    />
                    <PortalCartSummaryRow
                      label="Handling"
                      value={<CommercePrice amount={estimatedHandling} className="justify-end" />}
                    />
                    <PortalCartSummaryRow
                      label="Total"
                      emphasized
                      value={<CommercePrice amount={estimatedTotal} className="justify-end" />}
                    />
                  </div>

                  <Button
                    asChild
                    className="h-12 w-full rounded-full bg-[#201712] text-white hover:bg-[#31231b]"
                    size="lg"
                    disabled={cart.items.length === 0}
                  >
                    <Link to={storefrontPaths.accountSection("checkout")}>
                      Continue to checkout
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-[1.9rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,240,231,0.68))] py-0 shadow-[0_20px_50px_-42px_rgba(48,31,19,0.16)]">
                <CardContent className="grid gap-4 p-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      Portal notes
                    </h3>
                  </div>
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-start gap-3 rounded-[1.2rem] border border-[#e8ddd2] bg-[#fcfaf7] p-3">
                      <Truck className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Delivery estimate</p>
                        <p className="mt-1 leading-6 text-muted-foreground">
                          Free shipping unlocks above {formatPortalCurrency(portalFreeShippingThreshold)}.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-[1.2rem] border border-[#e8ddd2] bg-[#fcfaf7] p-3">
                      <ShieldCheck className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Stay inside your account</p>
                        <p className="mt-1 leading-6 text-muted-foreground">
                          Delivery, payment, and order confirmation now finish completely inside the customer portal.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      )
    }

    if (activeSection === "checkout") {
      return (
        <StorefrontCheckoutContent
          embedded
          cartHref={storefrontPaths.accountSection("cart")}
        />
      )
    }

    if (activeSection === "orders") {
      return (
        <div className="grid gap-4">
          {customerPortal.ordersQuery.isLoading ? (
            <GlobalLoader
              fullScreen={false}
              size="md"
              label="Loading orders..."
              className="min-h-[36vh]"
            />
          ) : customerPortal.ordersQuery.error ? (
            <Card className="rounded-[1.8rem] border-destructive/30 py-0 shadow-sm">
              <CardContent className="p-6 text-sm text-destructive">
                {customerPortal.ordersQuery.error instanceof Error
                  ? customerPortal.ordersQuery.error.message
                  : "Orders could not be loaded."}
              </CardContent>
            </Card>
          ) : orders.length > 0 ? (
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
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => void handleDownloadReceipt(order.id)}
                      disabled={downloadingOrderId === order.id}
                    >
                      <Download className="size-4" />
                      {downloadingOrderId === order.id ? "Preparing..." : "Receipt"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => void handleRepeatOrder(order.id)}
                      disabled={downloadingOrderId === order.id}
                    >
                      <RefreshCcw className="size-4" />
                      Reorder
                    </Button>
                    <CommerceOrderStatusBadge status={order.status} />
                  </div>
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
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
              <CardHeader>
                <CardTitle>Create a support request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-7 text-muted-foreground">
                  Raise one case for order help, payment recovery, shipment issues, refund follow-up, or account support without leaving the portal.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Linked order</p>
                    <Select
                      value={supportDraft.orderId}
                      onValueChange={(value) =>
                        setSupportDraft((current) => ({ ...current, orderId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional linked order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No linked order</SelectItem>
                        {orders.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.orderNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Category</p>
                    <Select
                      value={supportDraft.category}
                      onValueChange={(value) =>
                        setSupportDraft((current) => ({
                          ...current,
                          category: value as typeof current.category,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Order</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="shipment">Shipment</SelectItem>
                        <SelectItem value="refund">Refund</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Subject</p>
                    <Input
                      value={supportDraft.subject}
                      onChange={(event) =>
                        setSupportDraft((current) => ({
                          ...current,
                          subject: event.target.value,
                        }))
                      }
                      placeholder="Short summary of the issue"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Priority</p>
                    <Select
                      value={supportDraft.priority}
                      onValueChange={(value) =>
                        setSupportDraft((current) => ({
                          ...current,
                          priority: value as typeof current.priority,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">What happened?</p>
                  <Textarea
                    rows={5}
                    value={supportDraft.message}
                    onChange={(event) =>
                      setSupportDraft((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    placeholder="Include the order context, payment issue, shipment problem, or exact account question."
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="rounded-full"
                    onClick={() => void handleCreateSupportCase()}
                    disabled={customerPortal.isSubmittingSupportCase}
                  >
                    {customerPortal.isSubmittingSupportCase ? "Submitting..." : "Submit support case"}
                  </Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to={storefrontPaths.accountSection("orders")}>Open orders</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to={storefrontPaths.trackOrder()}>Track an order</Link>
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

          <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Recent communication history</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {communicationItems.length > 0 ? (
                communicationItems.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">
                        {item.templateName ?? item.templateCode}
                      </p>
                      <Badge variant="outline" className="rounded-full text-[11px] uppercase">
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.subject}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.recipientSummary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatPortalDateTime(item.sentAt ?? item.createdAt)}
                    </p>
                    {item.errorMessage ? (
                      <p className="mt-2 text-xs text-destructive">{item.errorMessage}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No customer-facing communication messages are recorded yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Your support cases</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {customerPortal.supportCasesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading support cases...</p>
              ) : customerPortal.supportCasesQuery.error ? (
                <p className="text-sm text-destructive">
                  {customerPortal.supportCasesQuery.error instanceof Error
                    ? customerPortal.supportCasesQuery.error.message
                    : "Support cases could not be loaded."}
                </p>
              ) : supportCases.length > 0 ? (
                supportCases.map((item: StorefrontSupportCaseView) => (
                  <div
                    key={item.id}
                    className="rounded-[1.4rem] border border-border/70 bg-background/80 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">{item.caseNumber}</p>
                          <Badge variant="outline">{formatSupportCaseLabel(item.category)}</Badge>
                          <Badge variant={item.priority === "urgent" ? "destructive" : "secondary"}>
                            {item.priority}
                          </Badge>
                          <Badge variant="outline">{formatSupportCaseLabel(item.status)}</Badge>
                        </div>
                        <p className="font-medium text-foreground">{item.subject}</p>
                        <p className="text-sm leading-6 text-muted-foreground">{item.message}</p>
                        {item.adminNote ? (
                          <p className="text-sm leading-6 text-foreground">
                            Support note: {item.adminNote}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-1 text-right text-xs text-muted-foreground">
                        <p>Created {formatPortalDateTime(item.createdAt)}</p>
                        <p>Updated {formatPortalDateTime(item.updatedAt)}</p>
                        <p>Order {item.orderNumber ?? "Not linked"}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No support cases yet. Your first request will appear here after submission.
                </p>
              )}
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
