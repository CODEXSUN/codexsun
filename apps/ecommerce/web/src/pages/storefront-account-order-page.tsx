import { useEffect, useState } from "react"
import { Navigate, useParams } from "react-router-dom"

import type { StorefrontOrderResponse } from "@ecommerce/shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CommerceOrderStatusBadge } from "@/components/ux/commerce-order-status-badge"
import { CommercePrice } from "@/components/ux/commerce-price"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { StorefrontLayout } from "../components/storefront-layout"
import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontAccountOrderPage() {
  const { orderId = "" } = useParams()
  const customerAuth = useStorefrontCustomerAuth()
  const [data, setData] = useState<StorefrontOrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!customerAuth.accessToken) {
      return
    }

    async function load() {
      try {
        setData(
          await storefrontApi.getCustomerOrder(customerAuth.accessToken!, orderId)
        )
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load order."
        )
      }
    }

    void load()
  }, [customerAuth.accessToken, orderId])

  if (!customerAuth.isAuthenticated) {
    return (
      <Navigate
        to={storefrontPaths.accountLogin(storefrontPaths.accountOrder(orderId))}
        replace
      />
    )
  }

  return (
    <StorefrontLayout>
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-5 pt-8 lg:px-8">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {data?.item ? (
          <>
            <section className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Order detail
                </p>
                <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">
                  {data.item.orderNumber}
                </h1>
              </div>
              <CommerceOrderStatusBadge status={data.item.status} />
            </section>
            <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {data.item.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-[1.3rem] border border-border/70 bg-background/80 p-4">
                    <div className="space-y-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.quantity} x {item.unitPrice}</p>
                    </div>
                    <CommercePrice amount={item.lineTotal} compareAtAmount={item.mrp * item.quantity} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {data.item.timeline.map((entry) => (
                  <div key={entry.id} className="rounded-[1.3rem] border border-border/70 bg-background/80 p-4">
                    <p className="font-medium">{entry.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{entry.summary}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">Loading order...</div>
        )}
      </div>
    </StorefrontLayout>
  )
}
