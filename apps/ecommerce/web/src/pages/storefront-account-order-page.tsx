import { useEffect, useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  LifeBuoy,
  List,
  RefreshCcw,
  RotateCcw,
  XCircle,
} from "lucide-react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"

import type {
  StorefrontCommunicationLogItem,
  StorefrontOrderRequestView,
  StorefrontOrderResponse,
  StorefrontSupportCaseView,
} from "@ecommerce/shared"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { GlobalLoader } from "@/registry/concerns/feedback/global-loader"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { useStorefrontCart } from "../cart/storefront-cart"
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
  const cart = useStorefrontCart()
  const normalizedOrderId = useMemo(() => normalizeRoutedOrderId(orderId), [orderId])
  const [data, setData] = useState<StorefrontOrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false)
  const [orderRequests, setOrderRequests] = useState<StorefrontOrderRequestView[]>([])
  const [communications, setCommunications] = useState<StorefrontCommunicationLogItem[]>([])
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const [requestType, setRequestType] = useState<"cancellation" | "return">("cancellation")
  const [requestOrderItemId, setRequestOrderItemId] = useState("none")
  const [requestReason, setRequestReason] = useState("")
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false)
  const [supportCategory, setSupportCategory] = useState<
    "order" | "payment" | "shipment" | "refund" | "account" | "other"
  >("order")
  const [supportPriority, setSupportPriority] = useState<"low" | "normal" | "high" | "urgent">(
    "normal"
  )
  const [supportSubject, setSupportSubject] = useState("")
  const [supportMessage, setSupportMessage] = useState("")
  const portalOrders = customerPortal.ordersQuery.data?.items ?? []
  const linkedSupportCases = useMemo(
    () =>
      (customerPortal.supportCasesQuery.data?.items ?? []).filter(
        (item: StorefrontSupportCaseView) => item.orderId === normalizedOrderId
      ),
    [customerPortal.supportCasesQuery.data?.items, normalizedOrderId]
  )
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
          const requestsResponse = await storefrontApi.getCustomerOrderRequests(
            customerAuth.accessToken!,
            normalizedOrderId
          )
          const communicationsResponse = await storefrontApi.getCustomerCommunicationLog(
            customerAuth.accessToken!,
            {
              orderId: normalizedOrderId,
            }
          )

          if (!isCancelled) {
            setData(response)
            setOrderRequests(requestsResponse.items)
            setCommunications(communicationsResponse.items)
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

  async function handleSubmitOrderRequest() {
    if (!customerAuth.accessToken || !data?.item) {
      return
    }

    setIsSubmittingRequest(true)

    try {
      const response = await storefrontApi.createCustomerOrderRequest(customerAuth.accessToken, {
        orderId: data.item.id,
        type: requestType,
        orderItemId: requestType === "return" && requestOrderItemId !== "none" ? requestOrderItemId : null,
        reason: requestReason,
      })

      setOrderRequests((current) => [response.item, ...current])
      setIsRequestDialogOpen(false)
      setRequestReason("")
      setRequestOrderItemId("none")
      showRecordToast({
        entity: requestType === "return" ? "Return request" : "Cancellation request",
        action: "created",
        recordName: response.item.requestNumber,
      })
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Failed to submit request."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Order request failed.",
        description: message,
      })
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  async function handleSubmitSupportCase() {
    if (!customerAuth.accessToken || !data?.item) {
      return
    }

    try {
      const response = await customerPortal.createSupportCase({
        orderId: data.item.id,
        category: supportCategory,
        priority: supportPriority,
        subject: supportSubject.trim() || `Order ${data.item.orderNumber} support request`,
        message: supportMessage,
      })

      setIsSupportDialogOpen(false)
      setSupportCategory("order")
      setSupportPriority("normal")
      setSupportSubject("")
      setSupportMessage("")
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

  function handleRepeatOrder() {
    if (!data?.item) {
      return
    }

    data.item.items.forEach((item) => {
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
      recordName: data.item.orderNumber,
    })
    void navigate(storefrontPaths.accountSection("cart"))
  }

  if (!customerAuth.isAuthenticated) {
    return (
      <Navigate
        to={storefrontPaths.accountLogin(storefrontPaths.accountOrder(normalizedOrderId))}
        replace
      />
    )
  }

  const canRequestCancellation = data?.item
    ? ["created", "payment_pending", "paid", "fulfilment_pending"].includes(data.item.status)
    : false
  const canRequestReturn = data?.item?.status === "delivered"

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
              <>
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
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={handleRepeatOrder}
                >
                  <RefreshCcw className="size-4" />
                  Reorder
                </Button>
                {canRequestCancellation ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      setRequestType("cancellation")
                      setIsRequestDialogOpen(true)
                    }}
                  >
                    <XCircle className="size-4" />
                    Request cancellation
                  </Button>
                ) : null}
                {canRequestReturn ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      setRequestType("return")
                      setIsRequestDialogOpen(true)
                    }}
                  >
                    <RotateCcw className="size-4" />
                    Request return
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setSupportSubject(
                      data.item ? `Help with order ${data.item.orderNumber}` : "Support request"
                    )
                    setIsSupportDialogOpen(true)
                  }}
                >
                  <LifeBuoy className="size-4" />
                  Contact support
                </Button>
              </>
            }
          />
          <Card className="rounded-[1.7rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[1.1rem] tracking-tight">
                Return and cancellation requests
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {orderRequests.length > 0 ? (
                orderRequests.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{item.requestNumber}</p>
                      <Badge variant="outline" className="rounded-full text-[11px] uppercase">
                        {item.type}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full text-[11px] uppercase">
                        {item.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
                    {item.itemName ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground/80">
                        Item: {item.itemName}
                      </p>
                    ) : null}
                    {item.adminNote ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Admin note: {item.adminNote}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No return or cancellation requests have been raised for this order.
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-[1.7rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[1.1rem] tracking-tight">Communication history</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {communications.length > 0 ? (
                communications.map((item) => (
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
                    <p className="mt-1 text-xs text-muted-foreground">
                      Recipients: {item.recipientSummary}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created: {new Intl.DateTimeFormat("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.createdAt))}
                    </p>
                    {item.errorMessage ? (
                      <p className="mt-2 text-xs text-destructive">{item.errorMessage}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No customer communication entries are recorded for this order yet.
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-[1.7rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[1.1rem] tracking-tight">
                Support cases for this order
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {linkedSupportCases.length > 0 ? (
                linkedSupportCases.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{item.caseNumber}</p>
                      <Badge variant="outline" className="rounded-full text-[11px] uppercase">
                        {item.category}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full text-[11px] uppercase">
                        {item.status.replaceAll("_", " ")}
                      </Badge>
                      <Badge variant="outline" className="rounded-full text-[11px] uppercase">
                        {item.priority}
                      </Badge>
                    </div>
                    <p className="mt-2 font-medium text-foreground">{item.subject}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.message}</p>
                    {item.adminNote ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Admin note: {item.adminNote}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No support cases are linked to this order yet.
                </p>
              )}
            </CardContent>
          </Card>
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

      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {requestType === "return" ? "Request a return" : "Request cancellation"}
            </DialogTitle>
            <DialogDescription>
              Submit the reason here. Operations will review the request against the current order state.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {requestType === "return" && data?.item ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Returned item</p>
                <Select value={requestOrderItemId} onValueChange={setRequestOrderItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Whole order</SelectItem>
                    {data.item.items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Reason</p>
              <Textarea
                rows={5}
                value={requestReason}
                onChange={(event) => setRequestReason(event.target.value)}
                placeholder={
                  requestType === "return"
                    ? "Describe the return reason, condition, or wrong-item issue."
                    : "Explain why you need to cancel this order."
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void handleSubmitOrderRequest()}
                disabled={isSubmittingRequest}
              >
                {isSubmittingRequest ? "Submitting..." : "Submit request"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRequestDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isSupportDialogOpen} onOpenChange={setIsSupportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact support for this order</DialogTitle>
            <DialogDescription>
              This request is linked directly to {data?.item?.orderNumber ?? "the selected order"} so
              the support desk can review the exact payment, fulfilment, and delivery context.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Category</p>
                <Select
                  value={supportCategory}
                  onValueChange={(value) =>
                    setSupportCategory(value as typeof supportCategory)
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
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Priority</p>
                <Select
                  value={supportPriority}
                  onValueChange={(value) =>
                    setSupportPriority(value as typeof supportPriority)
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
              <p className="text-sm font-medium text-foreground">Subject</p>
              <Input
                value={supportSubject}
                onChange={(event) => setSupportSubject(event.target.value)}
                placeholder={`Help with order ${data?.item?.orderNumber ?? ""}`}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">What do you need help with?</p>
              <Textarea
                rows={5}
                value={supportMessage}
                onChange={(event) => setSupportMessage(event.target.value)}
                placeholder="Describe the payment issue, shipment concern, damaged parcel, return follow-up, or any other order-specific help needed."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void handleSubmitSupportCase()}
                disabled={customerPortal.isSubmittingSupportCase}
              >
                {customerPortal.isSubmittingSupportCase ? "Submitting..." : "Submit support case"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSupportDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CustomerPortalLayout>
  )
}
