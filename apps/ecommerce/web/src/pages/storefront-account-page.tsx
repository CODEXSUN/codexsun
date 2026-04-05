import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import type { StorefrontOrderListResponse } from "@ecommerce/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CommerceOrderStatusBadge } from "@/components/ux/commerce-order-status-badge"
import { CommercePrice } from "@/components/ux/commerce-price"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { StorefrontLayout } from "../components/storefront-layout"
import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontAccountPage() {
  const navigate = useNavigate()
  const customerAuth = useStorefrontCustomerAuth()
  const [orders, setOrders] = useState<StorefrontOrderListResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formState, setFormState] = useState({
    displayName: customerAuth.customer?.displayName ?? "",
    phoneNumber: customerAuth.customer?.phoneNumber ?? "",
    companyName: customerAuth.customer?.companyName ?? "",
    gstin: customerAuth.customer?.gstin ?? "",
    addressLine1: customerAuth.customer?.addresses[0]?.addressLine1 ?? "",
    addressLine2: customerAuth.customer?.addresses[0]?.addressLine2 ?? "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  })

  useEffect(() => {
    if (!customerAuth.accessToken) {
      return
    }

    async function load() {
      try {
        setOrders(await storefrontApi.listCustomerOrders(customerAuth.accessToken!))
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load orders."
        )
      }
    }

    void load()
  }, [customerAuth.accessToken])

  useEffect(() => {
    if (!customerAuth.customer) {
      return
    }

    setFormState({
      displayName: customerAuth.customer.displayName,
      phoneNumber: customerAuth.customer.phoneNumber,
      companyName: customerAuth.customer.companyName ?? "",
      gstin: customerAuth.customer.gstin ?? "",
      addressLine1: customerAuth.customer.addresses[0]?.addressLine1 ?? "",
      addressLine2: customerAuth.customer.addresses[0]?.addressLine2 ?? "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    })
  }, [customerAuth.customer])

  async function handleSaveProfile() {
    setIsSaving(true)
    setError(null)

    try {
      await customerAuth.updateProfile({
        displayName: formState.displayName,
        phoneNumber: formState.phoneNumber,
        companyName: formState.companyName || null,
        gstin: formState.gstin || null,
        addressLine1: formState.addressLine1,
        addressLine2: formState.addressLine2 || null,
        city: formState.city || "City",
        state: formState.state || "State",
        country: formState.country || "India",
        pincode: formState.pincode || "000000",
      })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save profile.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <StorefrontLayout>
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 pt-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Customer portal
              </p>
              <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">
                {customerAuth.customer?.displayName ?? "Your account"}
              </h1>
            </div>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() =>
                void customerAuth.logout().then(() => navigate(storefrontPaths.home()))
              }
            >
              Sign out
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {(
                [
                  ["displayName", "Full name"],
                  ["phoneNumber", "Phone number"],
                  ["companyName", "Company name"],
                  ["gstin", "GSTIN"],
                  ["addressLine1", "Address line 1"],
                  ["addressLine2", "Address line 2"],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  className={
                    key === "addressLine1" || key === "addressLine2" ? "md:col-span-2" : ""
                  }
                >
                  <Label>{label}</Label>
                  <Input
                    value={formState[key]}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <Button className="rounded-full" onClick={() => void handleSaveProfile()} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Orders
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
              Order history
            </h2>
          </div>
          <div className="grid gap-4">
            {(orders?.items ?? []).map((order) => (
              <Card key={order.id} className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
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
            ))}
            {(orders?.items.length ?? 0) === 0 ? (
              <Card className="rounded-[1.6rem] border-dashed border-border/70 py-0 shadow-sm">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Orders will appear here after your first checkout.
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  )
}
