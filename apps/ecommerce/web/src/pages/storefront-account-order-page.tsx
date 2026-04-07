import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Download, List } from "lucide-react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"

import type { StorefrontOrderResponse } from "@ecommerce/shared"
import { Button } from "@/components/ui/button"
import { GlobalLoader } from "@/registry/concerns/feedback/global-loader"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { CustomerPortalLayout } from "../components/customer-portal-layout"
import { StorefrontOrderDetailCard } from "../components/storefront-order-detail-card"
import { useStorefrontCustomerPortal } from "../hooks/use-storefront-customer-portal"
import { storefrontPaths } from "../lib/storefront-routes"

function normalizeRoutedOrderId(value: string) {
  let normalizedValue = value.trim()

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const decodedValue = decodeURIComponent(normalizedValue)

      if (decodedValue === normalizedValue) {
        break
      }

      normalizedValue = decodedValue
    } catch {
      break
    }
  }

  return normalizedValue
}

export function StorefrontAccountOrderPage() {
  const { orderId = "" } = useParams()
  const navigate = useNavigate()
  const customerAuth = useStorefrontCustomerAuth()
  const customerPortal = useStorefrontCustomerPortal()
  const normalizedOrderId = useMemo(() => normalizeRoutedOrderId(orderId), [orderId])
  const [data, setData] = useState<StorefrontOrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false)
  const portalOrders = customerPortal.ordersQuery.data?.items ?? []
  const currentOrderIndex = portalOrders.findIndex((item) => item.id === normalizedOrderId)
  const previousOrder = currentOrderIndex >= 0 ? (portalOrders[currentOrderIndex + 1] ?? null) : null
  const nextOrder = currentOrderIndex > 0 ? (portalOrders[currentOrderIndex - 1] ?? null) : null

  useEffect(() => {
    if (customerAuth.isLoading) {
      return
    }

    if (!customerAuth.accessToken || !normalizedOrderId) {
      setIsLoading(false)
      return
    }

    let isCancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      const maxAttempts = 4

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          const response = await storefrontApi.getCustomerOrder(
            customerAuth.accessToken!,
            normalizedOrderId
          )

          if (!isCancelled) {
            setData(response)
            setError(null)
            setIsLoading(false)
          }
          return
        } catch (loadError) {
          const message =
            loadError instanceof Error ? loadError.message : "Failed to load order."
          const shouldRetry =
            message.includes("Storefront order could not be found.") &&
            attempt < maxAttempts - 1

          if (!shouldRetry) {
            if (!isCancelled) {
              setData(null)
              setError(message)
              setIsLoading(false)
            }
            return
          }

          await new Promise((resolve) => {
            window.setTimeout(resolve, 350)
          })

          if (isCancelled) {
            return
          }
        }
      }
    }

    void load()

    return () => {
      isCancelled = true
    }
  }, [customerAuth.accessToken, customerAuth.isLoading, normalizedOrderId])

  if (customerAuth.isLoading) {
    return (
      <CustomerPortalLayout
        activeSection="orders"
        title="Order detail"
        description="Review purchased items, order status, and delivery updates from your customer portal."
      >
        <GlobalLoader
          fullScreen={false}
          size="md"
          label="Loading order..."
          className="min-h-[48vh]"
        />
      </CustomerPortalLayout>
    )
  }

  async function handleDownloadReceipt() {
    if (!customerAuth.accessToken || !data?.item) {
      return
    }

    setIsDownloadingReceipt(true)

    try {
      const document = await storefrontApi.downloadCustomerOrderReceipt(
        customerAuth.accessToken,
        data.item.id
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
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Failed to download receipt."
      )
    } finally {
      setIsDownloadingReceipt(false)
    }
  }

  if (!customerAuth.isAuthenticated) {
    return (
      <Navigate
        to={storefrontPaths.accountLogin(storefrontPaths.accountOrder(normalizedOrderId))}
        replace
      />
    )
  }

  return (
    <CustomerPortalLayout
      activeSection="orders"
      title={data?.item.orderNumber ?? "Order detail"}
      description="Review purchased items, order status, and delivery updates from your customer portal."
    >
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {data?.item ? (
        <div className="space-y-5">
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-[1.7rem] border border-primary/14 bg-gradient-to-r from-primary/8 via-background to-background p-3 shadow-[0_16px_36px_-30px_hsl(var(--primary)/0.22)]">
            <Button asChild variant="outline" className="rounded-full">
              <Link to={storefrontPaths.accountSection("orders")}>
                <List className="size-4" />
                All orders
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                disabled={!previousOrder}
                onClick={() => {
                  if (previousOrder) {
                    void navigate(storefrontPaths.accountOrder(previousOrder.id))
                  }
                }}
              >
                <ChevronLeft className="size-4" />
                Previous order
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                disabled={!nextOrder}
                onClick={() => {
                  if (nextOrder) {
                    void navigate(storefrontPaths.accountOrder(nextOrder.id))
                  }
                }}
              >
                Next order
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </section>
          <StorefrontOrderDetailCard
            order={data.item}
            actions={
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => void handleDownloadReceipt()}
                disabled={isDownloadingReceipt}
              >
                <Download className="size-4" />
                {isDownloadingReceipt ? "Preparing receipt..." : "Download receipt"}
              </Button>
            }
          />
        </div>
      ) : (
        isLoading ? (
          <GlobalLoader
            fullScreen={false}
            size="md"
            label="Loading order..."
            className="min-h-[48vh]"
          />
        ) : (
          <div className="text-sm text-muted-foreground">Order detail is unavailable.</div>
        )
      )}
    </CustomerPortalLayout>
  )
}
