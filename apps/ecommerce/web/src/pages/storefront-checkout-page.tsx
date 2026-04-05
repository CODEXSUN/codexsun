import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CommercePrice } from "@/components/ux/commerce-price"
import { CommerceQuantityStepper } from "@/components/ux/commerce-quantity-stepper"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontLayout } from "../components/storefront-layout"
import { storefrontPaths } from "../lib/storefront-routes"
import { loadRazorpayCheckoutScript } from "../lib/load-razorpay"

type CheckoutAddressState = {
  fullName: string
  email: string
  phoneNumber: string
  line1: string
  line2: string
  city: string
  state: string
  country: string
  pincode: string
}

function createEmptyAddress(): CheckoutAddressState {
  return {
    fullName: "",
    email: "",
    phoneNumber: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  }
}

export function StorefrontCheckoutPage() {
  const navigate = useNavigate()
  const cart = useStorefrontCart()
  const customerAuth = useStorefrontCustomerAuth()
  const [shippingAddress, setShippingAddress] = useState<CheckoutAddressState>(
    createEmptyAddress
  )
  const [billingAddress, setBillingAddress] = useState<CheckoutAddressState>(
    createEmptyAddress
  )
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const address = customerAuth.customer?.addresses[0]

    if (!customerAuth.customer) {
      return
    }

    const nextAddress = {
      fullName: customerAuth.customer.displayName,
      email: customerAuth.customer.email,
      phoneNumber: customerAuth.customer.phoneNumber,
      line1: address?.addressLine1 ?? "",
      line2: address?.addressLine2 ?? "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    }

    setShippingAddress(nextAddress)
    setBillingAddress(nextAddress)
  }, [customerAuth.customer])

  const shippingAmount = useMemo(
    () => (cart.subtotalAmount >= 3999 ? 0 : cart.items.length > 0 ? 149 : 0),
    [cart.items.length, cart.subtotalAmount]
  )
  const totalAmount = cart.subtotalAmount + shippingAmount

  async function handlePlaceOrder() {
    setIsSubmitting(true)
    setError(null)

    try {
      const checkout = await storefrontApi.createCheckout(
        customerAuth.accessToken,
        {
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress: {
            ...shippingAddress,
            line2: shippingAddress.line2 || null,
          },
          billingAddress: {
            ...(useShippingAsBilling ? shippingAddress : billingAddress),
            line2:
              (useShippingAsBilling ? shippingAddress.line2 : billingAddress.line2) ||
              null,
          },
          notes: null,
        }
      )

      if (checkout.payment.mode === "mock") {
        const verified = await storefrontApi.verifyCheckoutPayment({
          orderId: checkout.order.id,
          providerOrderId: checkout.payment.providerOrderId ?? "",
          providerPaymentId: `mock_payment_${Date.now()}`,
          signature: "mock_signature",
        })

        cart.clear()
        if (customerAuth.isAuthenticated) {
          await customerAuth.refresh()
          void navigate(storefrontPaths.accountOrder(verified.item.id))
        } else {
          void navigate(
            storefrontPaths.trackOrder({
              orderNumber: verified.item.orderNumber,
              email: verified.item.shippingAddress.email,
            })
          )
        }
        return
      }

      await loadRazorpayCheckoutScript()

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout could not be initialized.")
      }

      const razorpay = new window.Razorpay({
        key: checkout.payment.keyId,
        amount: checkout.payment.amount,
        currency: checkout.payment.currency,
        name: "Codexsun Store",
        description: checkout.order.orderNumber,
        order_id: checkout.payment.providerOrderId,
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          const verified = await storefrontApi.verifyCheckoutPayment({
            orderId: checkout.order.id,
            providerOrderId: response.razorpay_order_id,
            providerPaymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          })

          cart.clear()
          if (customerAuth.isAuthenticated) {
            await customerAuth.refresh()
            void navigate(storefrontPaths.accountOrder(verified.item.id))
          } else {
            void navigate(
              storefrontPaths.trackOrder({
                orderNumber: verified.item.orderNumber,
                email: verified.item.shippingAddress.email,
              })
            )
          }
        },
        prefill: {
          name: shippingAddress.fullName,
          email: shippingAddress.email,
          contact: shippingAddress.phoneNumber,
        },
        theme: {
          color: "#2d211b",
        },
      })

      razorpay.open()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to place the order."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <StorefrontLayout>
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Checkout
            </p>
            <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">
              Complete your order
            </h1>
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Checkout failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Shipping details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {(
                [
                  ["fullName", "Full name"],
                  ["email", "Email"],
                  ["phoneNumber", "Phone number"],
                  ["line1", "Address line 1"],
                  ["line2", "Address line 2"],
                  ["city", "City"],
                  ["state", "State"],
                  ["country", "Country"],
                  ["pincode", "Pincode"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className={key === "line1" || key === "line2" ? "md:col-span-2" : ""}>
                  <Label>{label}</Label>
                  <Input
                    value={shippingAddress[key]}
                    onChange={(event) =>
                      setShippingAddress((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Billing details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="same-as-shipping"
                  checked={useShippingAsBilling}
                  onCheckedChange={(value) => setUseShippingAsBilling(Boolean(value))}
                />
                <Label htmlFor="same-as-shipping">Use shipping details as billing details</Label>
              </div>
              {!useShippingAsBilling ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {(
                    [
                      ["fullName", "Full name"],
                      ["email", "Email"],
                      ["phoneNumber", "Phone number"],
                      ["line1", "Address line 1"],
                      ["line2", "Address line 2"],
                      ["city", "City"],
                      ["state", "State"],
                      ["country", "Country"],
                      ["pincode", "Pincode"],
                    ] as const
                  ).map(([key, label]) => (
                    <div
                      key={key}
                      className={key === "line1" || key === "line2" ? "md:col-span-2" : ""}
                    >
                      <Label>{label}</Label>
                      <Input
                        value={billingAddress[key]}
                        onChange={(event) =>
                          setBillingAddress((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex gap-4 rounded-[1.3rem] border border-border/70 bg-background/80 p-4">
                  <img
                    src={
                      item.imageUrl ??
                      "https://placehold.co/320x400/e8ddd1/2d211b?text=Item"
                    }
                    alt={item.name}
                    className="h-20 w-16 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1 space-y-3">
                    <p className="line-clamp-2 font-medium">{item.name}</p>
                    <div className="flex items-center justify-between gap-3">
                      <CommerceQuantityStepper
                        value={item.quantity}
                        onChange={(value) =>
                          cart.updateQuantity(item.productId, value)
                        }
                      />
                      <CommercePrice
                        amount={item.unitPrice * item.quantity}
                        compareAtAmount={item.mrp * item.quantity}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="space-y-2 border-t border-border/60 pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <CommercePrice amount={cart.subtotalAmount} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <CommercePrice amount={shippingAmount} />
                </div>
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <CommercePrice amount={totalAmount} />
                </div>
              </div>
              <Button
                className="w-full rounded-full"
                size="lg"
                disabled={cart.items.length === 0 || isSubmitting}
                onClick={() => void handlePlaceOrder()}
              >
                {isSubmitting ? "Processing..." : "Pay with Razorpay"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </StorefrontLayout>
  )
}
