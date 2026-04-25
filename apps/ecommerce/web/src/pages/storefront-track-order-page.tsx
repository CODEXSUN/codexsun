import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import type { StorefrontOrderResponse } from "@ecommerce/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { storefrontApi } from "../api/storefront-api"
import { StorefrontOrderDetailCard } from "../components/storefront-order-detail-card"
import { StorefrontLayout } from "../components/storefront-layout"
import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontTrackOrderPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(searchParams.get("orderNumber") ?? "")
  const [email, setEmail] = useState(searchParams.get("email") ?? "")
  const [data, setData] = useState<StorefrontOrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const currentOrderNumber = searchParams.get("orderNumber")
    const currentEmail = searchParams.get("email")

    if (!currentOrderNumber || !currentEmail) {
      return
    }

    const resolvedOrderNumber = currentOrderNumber
    const resolvedEmail = currentEmail

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        setData(await storefrontApi.trackOrder(resolvedOrderNumber, resolvedEmail))
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Failed to track order."
        )
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [searchParams])

  return (
    <StorefrontLayout showCategoryMenu={false}>
      <div className="grid w-full max-w-none gap-8 px-5 pt-8 lg:px-10 xl:px-16 2xl:px-20">
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Order tracking
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            Track your order
          </h1>
          <div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to={storefrontPaths.catalog()}>Back to catalog</Link>
            </Button>
          </div>
        </section>
        <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
          <CardContent className="p-5">
            <form
              className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
              onSubmit={(event) => {
                event.preventDefault()
                const next = new URLSearchParams()
                next.set("orderNumber", orderNumber)
                next.set("email", email)
                setSearchParams(next)
              }}
            >
              <div>
                <Label htmlFor="track-order-number">Order number</Label>
                <Input
                  id="track-order-number"
                  value={orderNumber}
                  onChange={(event) => setOrderNumber(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="track-order-email">Email</Label>
                <Input
                  id="track-order-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-full self-end rounded-full md:w-auto">
                Track
              </Button>
            </form>
          </CardContent>
        </Card>
        {isLoading ? (
          <div aria-live="polite" className="text-sm text-muted-foreground">
            Looking up order...
          </div>
        ) : null}
        {error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}
        {data?.item ? (
          <StorefrontOrderDetailCard order={data.item} />
        ) : null}
      </div>
    </StorefrontLayout>
  )
}
