import { type ReactNode, useEffect, useState } from "react"
import {
  ArrowRight,
  LogIn,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
  UserPlus,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import type { StorefrontSettings } from "@ecommerce/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CommercePrice } from "@/components/ux/commerce-price"
import { CommerceQuantityStepper } from "@/components/ux/commerce-quantity-stepper"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontLayout } from "../components/storefront-layout"
import { setStorefrontPostAuthRedirect } from "../lib/storefront-auth-redirect"
import {
  handleStorefrontImageError,
  resolveStorefrontImageUrl,
} from "../lib/storefront-image"
import { calculateStorefrontChargeTotals } from "../lib/storefront-shipping"
import { storefrontPaths } from "../lib/storefront-routes"

type CartViewVariant = "editorial" | "compact"

const cartViewVariantStorageKey = "codexsun.storefront.cart.view-variant"
const fallbackStorefrontSettings: Pick<
  StorefrontSettings,
  "freeShippingThreshold" | "defaultShippingAmount" | "defaultHandlingAmount"
> = {
  freeShippingThreshold: 3999,
  defaultShippingAmount: 149,
  defaultHandlingAmount: 99,
}
const cartViewOptions: Array<{
  value: CartViewVariant
  label: string
  description: string
}> = [
  {
    value: "editorial",
    label: "Editorial",
    description: "Spacious product cards with a showcase feel.",
  },
  {
    value: "compact",
    label: "Compact",
    description: "Denser cart rows for quicker scanning.",
  },
]

function getStoredCartViewVariant(): CartViewVariant {
  if (typeof window === "undefined") {
    return "editorial"
  }

  const storedVariant = window.localStorage.getItem(cartViewVariantStorageKey)

  return storedVariant === "compact" ? "compact" : "editorial"
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function CartSummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string
  value: ReactNode
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

function CartItemCard({
  item,
  viewVariant,
  onUpdateQuantity,
  onRemove,
}: {
  item: ReturnType<typeof useStorefrontCart>["items"][number]
  viewVariant: CartViewVariant
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
}) {
  const lineAmount = item.unitPrice * item.quantity
  const lineCompareAmount = item.mrp * item.quantity
  const savingsAmount = Math.max(0, lineCompareAmount - lineAmount)

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[2rem] border-[#e4d7c9] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(251,247,242,0.92))] py-0 shadow-[0_24px_60px_-44px_rgba(48,31,19,0.24)] backdrop-blur",
        viewVariant === "compact" && "rounded-[1.7rem]"
      )}
    >
      <CardContent className={cn("p-4 sm:p-5", viewVariant === "compact" && "p-4")}>
        <article
          className={cn(
            "grid gap-4",
            viewVariant === "editorial"
              ? "sm:grid-cols-[160px_minmax(0,1fr)]"
              : "grid-cols-[92px_minmax(0,1fr)] sm:grid-cols-[110px_minmax(0,1fr)_auto]"
          )}
        >
          <div
            className={cn(
              "rounded-[1.55rem] border border-[#e6d8c8] bg-[linear-gradient(180deg,#f8f1e9,#fcf8f3)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]",
              viewVariant === "editorial" ? "sm:h-full" : "self-start rounded-[1.35rem]"
            )}
          >
            <div className="overflow-hidden rounded-[1.2rem] border border-white/90 bg-white shadow-[inset_0_0_0_1px_rgba(223,208,192,0.8)]">
              <img
                src={resolveStorefrontImageUrl(item.imageUrl, item.name)}
                alt={item.name}
                className={cn(
                  "w-full object-cover",
                  viewVariant === "editorial"
                    ? "aspect-[4/4.8] h-full"
                    : "aspect-[4/4.6] min-h-[120px]"
                )}
                onError={(event) => handleStorefrontImageError(event, item.name)}
              />
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <div
              className={cn(
                "flex flex-wrap items-start justify-between gap-4",
                viewVariant === "compact" && "sm:items-center"
              )}
            >
              <div className="min-w-0 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {viewVariant === "editorial" ? "Selected style" : "Bag item"}
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
                    Unit {formatCurrency(item.unitPrice)}
                  </Badge>
                  {savingsAmount > 0 ? (
                    <Badge
                      className="border-transparent bg-[#e4f4e8] px-3 py-1 text-[11px] tracking-[0.14em] uppercase text-[#2f7a46] shadow-[inset_0_0_0_1px_rgba(72,136,92,0.12)]"
                    >
                      Save {formatCurrency(savingsAmount)}
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
                  {viewVariant === "editorial"
                    ? "Price locked until checkout review."
                    : "Totals refresh instantly."}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-[1.45rem] border border-[#e7dacb] bg-[linear-gradient(180deg,#fffdf9,#faf5ef)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
                viewVariant === "compact" && "bg-transparent p-0"
              )}
            >
              <CommerceQuantityStepper
                value={item.quantity}
                onChange={onUpdateQuantity}
                className="border-[#d8c8b8] bg-white shadow-[0_10px_22px_-18px_rgba(48,31,19,0.28)]"
              />
              <Button
                type="button"
                variant="ghost"
                aria-label={`Remove ${item.name} from cart`}
                className="rounded-full px-3 text-[#3a2b22] hover:bg-[#f4ede5]"
                onClick={onRemove}
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
}

function CheckoutAccessDialog({
  open,
  onOpenChange,
  viewVariant,
  onContinueAsGuest,
  onExistingCustomer,
  onRegisterNew,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewVariant: CartViewVariant
  onContinueAsGuest: () => void
  onExistingCustomer: () => void
  onRegisterNew: () => void
}) {
  const isEditorial = viewVariant === "editorial"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[min(92vw,29rem)] gap-0 overflow-hidden rounded-[2rem] border-[#e2d4c5] p-0 shadow-[0_36px_90px_-52px_rgba(48,31,19,0.28)]",
          isEditorial
            ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(251,247,242,0.96))]"
            : "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,244,237,0.97))]"
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(222,196,165,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.68),transparent_24%)]" />
        <DialogHeader className="relative border-b border-[#efe4d8] px-5 pt-5 pb-4">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="w-fit border-[#cfb9a0] bg-[#fffdf9] px-3 py-1 text-[11px] font-semibold tracking-[0.22em] uppercase text-[#2f2118]"
            >
              Checkout access
            </Badge>
            <DialogTitle className="text-[1.55rem] tracking-tight text-foreground">
              Choose how to continue.
            </DialogTitle>
            <DialogDescription className="max-w-md text-sm leading-6">
              Continue as a guest for a faster purchase, or sign in first if you want
              order history and saved address reuse in your customer account.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div
          className={cn(
            "relative grid gap-3 p-4",
            isEditorial ? "sm:p-5" : "p-4"
          )}
        >
          <button
            type="button"
            className="flex items-start gap-3 rounded-[1.35rem] border border-[#d7c7b6] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,244,237,0.96))] px-4 py-4 text-left transition hover:border-[#ccb9a6] hover:bg-white"
            onClick={onContinueAsGuest}
          >
            <span className="rounded-full bg-[#f4ece2] p-2 text-[#6c5544]">
              <ArrowRight className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold tracking-tight text-foreground">
                Continue as guest
              </span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                Go straight to checkout. Delivery details apply to this order only.
              </span>
            </span>
          </button>

          <button
            type="button"
            className={cn(
              "flex items-start gap-3 rounded-[1.35rem] border px-4 py-4 text-left transition",
              isEditorial
                ? "border-[#d0baa4] bg-[#fffdfa] shadow-[0_18px_34px_-28px_rgba(48,31,19,0.16)]"
                : "border-[#ddcdbd] bg-[#fffdfa]"
            )}
            onClick={onExistingCustomer}
          >
            <span className="rounded-full bg-[#f2e4d1] p-2 text-[#8b5e34]">
              <LogIn className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold tracking-tight text-foreground">
                Existing customer
              </span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                Sign in and continue straight to delivery address review.
              </span>
            </span>
          </button>

          <button
            type="button"
            className="flex items-start gap-3 rounded-[1.35rem] border border-[#e1d4c6] bg-[#fcfaf7] px-4 py-4 text-left transition hover:border-[#d5c4b3] hover:bg-white"
            onClick={onRegisterNew}
          >
            <span className="rounded-full bg-[#eef2f7] p-2 text-[#4e5f78]">
              <UserPlus className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold tracking-tight text-foreground">
                Register new
              </span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                Create a customer account first, then return into the same checkout flow.
              </span>
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function StorefrontCartPage() {
  const navigate = useNavigate()
  const cart = useStorefrontCart()
  const customerAuth = useStorefrontCustomerAuth()
  const [storefrontSettings, setStorefrontSettings] = useState(fallbackStorefrontSettings)
  const [viewVariant, setViewVariant] = useState<CartViewVariant>(() =>
    getStoredCartViewVariant()
  )
  const [isCheckoutAccessDialogOpen, setIsCheckoutAccessDialogOpen] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(cartViewVariantStorageKey, viewVariant)
  }, [viewVariant])

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      try {
        const settings = await storefrontApi.getPublicStorefrontSettings()

        if (!cancelled) {
          setStorefrontSettings({
            freeShippingThreshold: settings.freeShippingThreshold,
            defaultShippingAmount: settings.defaultShippingAmount,
            defaultHandlingAmount: settings.defaultHandlingAmount,
          })
        }
      } catch {
        if (!cancelled) {
          setStorefrontSettings(fallbackStorefrontSettings)
        }
      }
    }

    void loadSettings()

    return () => {
      cancelled = true
    }
  }, [])

  const { shippingAmount: estimatedShipping, handlingAmount: estimatedHandling } =
    calculateStorefrontChargeTotals(cart.items, storefrontSettings, cart.subtotalAmount)
  const estimatedTotal = cart.subtotalAmount + estimatedShipping + estimatedHandling
  const totalSavings = cart.items.reduce(
    (sum, item) => sum + Math.max(0, (item.mrp - item.unitPrice) * item.quantity),
    0
  )

  function handleProceedToCheckout() {
    if (cart.items.length === 0) {
      return
    }

    if (customerAuth.isAuthenticated) {
      void navigate(storefrontPaths.checkout())
      return
    }

    setIsCheckoutAccessDialogOpen(true)
  }

  function handleExistingCustomerCheckout() {
    setStorefrontPostAuthRedirect(storefrontPaths.checkout())
    setIsCheckoutAccessDialogOpen(false)
    void navigate("/login", {
      state: { postAuthPath: storefrontPaths.checkout() },
    })
  }

  function handleRegisterCheckout() {
    setStorefrontPostAuthRedirect(storefrontPaths.checkout())
    setIsCheckoutAccessDialogOpen(false)
    void navigate(storefrontPaths.accountRegister(), {
      state: { postAuthPath: storefrontPaths.checkout() },
    })
  }

  function handleGuestCheckout() {
    setIsCheckoutAccessDialogOpen(false)
    void navigate(storefrontPaths.checkout())
  }

  return (
    <StorefrontLayout showCategoryMenu={false}>
      <div className="mx-auto grid w-full max-w-[96rem] gap-7 px-4 pt-8 pb-12 sm:px-6 lg:px-8 2xl:px-10">
        <Card className="relative overflow-hidden rounded-[2.4rem] border-[#e3d5c6] bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(252,247,241,0.96)_34%,rgba(247,237,225,0.92)_100%)] py-0 shadow-[0_28px_70px_-46px_rgba(48,31,19,0.18)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(213,183,150,0.18),transparent_24%),radial-gradient(circle_at_74%_28%,rgba(255,255,255,0.72),transparent_22%),radial-gradient(circle_at_88%_82%,rgba(176,131,88,0.12),transparent_18%),linear-gradient(120deg,rgba(255,255,255,0.3),transparent_48%)]" />
          <div className="pointer-events-none absolute -left-10 top-10 h-40 w-40 rounded-full bg-[#f4e3cf]/35 blur-3xl" />
          <div className="pointer-events-none absolute right-10 bottom-0 h-32 w-44 rounded-full bg-[#ead3bb]/30 blur-3xl" />
          <CardContent className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="space-y-4">
              <Badge
                variant="outline"
                className="border-[#cfb9a0] bg-[#fffdf9] px-4 py-1 text-[11px] font-semibold tracking-[0.24em] uppercase text-[#2f2118]"
              >
                Shopping bag
              </Badge>
              <div className="space-y-3">
                <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  Review your selected styles.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                  A cleaner cart layout with more breathing room, softer surfaces, and a
                  storefront-ready summary that stays aligned with the active theme.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:justify-items-end">
              <Button asChild variant="outline" className="rounded-full border-[#ddd1c2] bg-white/82 px-5 text-[#2f241d] hover:border-[#d0c0ae] hover:bg-white">
                <Link to={storefrontPaths.catalog()}>Continue shopping</Link>
              </Button>
              <div className="w-full max-w-sm rounded-[1.7rem] border border-[#dacabb] bg-[linear-gradient(180deg,#fdfaf6,#fbf7f2)] p-3 shadow-[0_18px_34px_-28px_rgba(48,31,19,0.12)]">
                <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6c5544]">
                  Cart view
                </p>
                <RadioGroup
                  value={viewVariant}
                  onValueChange={(value) => setViewVariant(value as CartViewVariant)}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {cartViewOptions.map((option) => {
                    const isActive = option.value === viewVariant

                    return (
                      <label
                        key={option.value}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-[1.2rem] border px-3 py-3 text-left transition",
                          isActive
                            ? "border-[#ceb9a3] bg-[#fffdf9] text-[#1f1813] shadow-[0_14px_26px_-22px_rgba(48,31,19,0.14)]"
                            : "border-[#e1d4c6] bg-[#fcfaf7] text-[#2b241f] hover:border-[#d5c4b3] hover:bg-white"
                        )}
                      >
                        <RadioGroupItem
                          value={option.value}
                          className={cn(
                            "mt-0.5 size-4 border-[#ccb8a5] bg-white text-white data-checked:border-[#8b5e34] data-checked:bg-[#8b5e34]"
                          )}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold tracking-tight">
                            {option.label}
                          </div>
                          <div className="mt-1 text-xs leading-5 text-[#6e5a4d]">
                            {option.description}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </RadioGroup>
              </div>
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
                      Start with the live catalog, then come back here to review quantities,
                      savings, and checkout totals in the same storefront flow.
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
              cart.items.map((item) => (
                <CartItemCard
                  key={item.productId}
                  item={item}
                  viewVariant={viewVariant}
                  onUpdateQuantity={(quantity) =>
                    cart.updateQuantity(item.productId, quantity)
                  }
                  onRemove={() => cart.removeItem(item.productId)}
                />
              ))
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
                    Estimated totals stay visible while final shipping and taxes are confirmed
                    during checkout.
                  </p>
                </div>

                {totalSavings > 0 ? (
                  <div className="rounded-[1.5rem] border border-[#cde6d3] bg-[#e7f5ea] px-4 py-3 text-sm text-[#2f7a46]">
                    You are currently saving {formatCurrency(totalSavings)} on this bag.
                  </div>
                ) : null}

                <div className="space-y-4">
                  <CartSummaryRow
                    label="Items"
                    value={<span className="font-medium">{cart.itemCount}</span>}
                  />
                  <CartSummaryRow
                    label="Subtotal"
                    value={<CommercePrice amount={cart.subtotalAmount} className="justify-end" />}
                  />
                  <CartSummaryRow
                    label="Shipping"
                    value={
                      estimatedShipping === 0 ? (
                        <span className="font-medium">Free</span>
                      ) : (
                        <CommercePrice amount={estimatedShipping} className="justify-end" />
                      )
                    }
                  />
                  <CartSummaryRow
                    label="Handling"
                    value={<CommercePrice amount={estimatedHandling} className="justify-end" />}
                  />
                  <CartSummaryRow
                    label="Total"
                    emphasized
                    value={<CommercePrice amount={estimatedTotal} className="justify-end" />}
                  />
                </div>

                {cart.items.length === 0 ? (
                  <Button
                    className="h-12 w-full rounded-full bg-[#201712] text-white hover:bg-[#31231b]"
                    size="lg"
                    disabled
                  >
                    Proceed to checkout
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    className="h-12 w-full rounded-full bg-[#201712] text-white hover:bg-[#31231b]"
                    size="lg"
                    onClick={handleProceedToCheckout}
                  >
                    Proceed to checkout
                    <ArrowRight className="size-4" />
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,240,231,0.68))] py-0 shadow-[0_20px_50px_-42px_rgba(48,31,19,0.16)]">
              <CardContent className="grid gap-4 p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    Bag notes
                  </h3>
                </div>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-start gap-3 rounded-[1.2rem] border border-[#e8ddd2] bg-[#fcfaf7] p-3">
                    <Truck className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Delivery estimate</p>
                      <p className="mt-1 leading-6 text-muted-foreground">
                        Free shipping unlocks above {formatCurrency(storefrontSettings.freeShippingThreshold)}.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-[1.2rem] border border-[#e8ddd2] bg-[#fcfaf7] p-3">
                    <ShieldCheck className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Checkout security</p>
                      <p className="mt-1 leading-6 text-muted-foreground">
                        Address, payment, and final order confirmation remain inside the secure
                        checkout flow.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <CheckoutAccessDialog
        open={isCheckoutAccessDialogOpen}
        onOpenChange={setIsCheckoutAccessDialogOpen}
        viewVariant={viewVariant}
        onContinueAsGuest={handleGuestCheckout}
        onExistingCustomer={handleExistingCustomerCheckout}
        onRegisterNew={handleRegisterCheckout}
      />
    </StorefrontLayout>
  )
}
