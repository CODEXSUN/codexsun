import { useEffect, useState } from "react"

import type { StorefrontOrder } from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import { storefrontApi } from "../../api/storefront-api"
import { StorefrontOrderDetailCard } from "../../components/storefront-order-detail-card"

type AdminOrderAction =
  | "cancel"
  | "mark_fulfilment_pending"
  | "mark_shipped"
  | "mark_delivered"
  | "resend_confirmation"

export function StorefrontAdminOrderOperationsDialog({
  orderId,
  open,
  onOpenChange,
  onOrderUpdated,
}: {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrderUpdated?: (order: StorefrontOrder) => void | Promise<void>
}) {
  const [selectedOrder, setSelectedOrder] = useState<StorefrontOrder | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isActionRunning, setIsActionRunning] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
  const [carrierName, setCarrierName] = useState("")
  const [trackingId, setTrackingId] = useState("")
  const [trackingUrl, setTrackingUrl] = useState("")
  const [actionNote, setActionNote] = useState("")
  useGlobalLoading(isDetailLoading || isActionRunning)

  useEffect(() => {
    if (!open || !orderId) {
      setSelectedOrder(null)
      setDetailError(null)
      setCarrierName("")
      setTrackingId("")
      setTrackingUrl("")
      setActionNote("")
      return
    }

    let cancelled = false

    async function loadOrder() {
      setSelectedOrder(null)
      setDetailError(null)
      setCarrierName("")
      setTrackingId("")
      setTrackingUrl("")
      setActionNote("")
      setIsDetailLoading(true)

      try {
        const accessToken = getStoredAccessToken()

        if (!accessToken) {
          throw new Error("Admin access token is required.")
        }

        const response = await storefrontApi.getAdminOrder(accessToken, orderId!)

        if (cancelled) {
          return
        }

        setSelectedOrder(response.item)
        setCarrierName(response.item.shipmentDetails?.carrierName ?? "")
        setTrackingId(response.item.shipmentDetails?.trackingId ?? "")
        setTrackingUrl(response.item.shipmentDetails?.trackingUrl ?? "")
        setActionNote(response.item.shipmentDetails?.note ?? "")
      } catch (loadError) {
        if (!cancelled) {
          setDetailError(
            loadError instanceof Error ? loadError.message : "Failed to load order details."
          )
        }
      } finally {
        if (!cancelled) {
          setIsDetailLoading(false)
        }
      }
    }

    void loadOrder()

    return () => {
      cancelled = true
    }
  }, [open, orderId])

  async function runOrderAction(action: AdminOrderAction) {
    if (!selectedOrder) {
      return
    }

    setIsActionRunning(true)
    setDetailError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const response = await storefrontApi.runAdminOrderAction(accessToken, {
        orderId: selectedOrder.id,
        action,
        carrierName,
        trackingId,
        trackingUrl,
        note: actionNote,
      })

      setSelectedOrder(response.item)
      await onOrderUpdated?.(response.item)

      if (action === "resend_confirmation") {
        showRecordToast({
          entity: "Order confirmation",
          action: "resent",
          recordName: response.item.orderNumber,
        })
      } else {
        showRecordToast({
          entity: "Order",
          action: "updated",
          recordName: response.item.orderNumber,
        })
      }
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Failed to apply order action."
      setDetailError(message)
      showAppToast({
        variant: "error",
        title: "Order action failed.",
        description: message,
      })
    } finally {
      setIsActionRunning(false)
      setIsCancelDialogOpen(false)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setIsCancelDialogOpen(false)
      setIsRefundDialogOpen(false)
    }

    onOpenChange(nextOpen)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Order operations</DialogTitle>
            <DialogDescription>
              Review the full order and apply lifecycle actions from the ecommerce admin workspace.
            </DialogDescription>
          </DialogHeader>

          {detailError ? (
            <Card className="border-destructive/40 bg-destructive/5 py-0">
              <CardContent className="p-4 text-sm text-destructive">{detailError}</CardContent>
            </Card>
          ) : null}

          {selectedOrder ? (
            <div className="space-y-4">
              <StorefrontOrderDetailCard order={selectedOrder} />

              <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[1.1rem] tracking-tight">Admin operations</CardTitle>
                  <CardDescription>
                    Use these controls to progress fulfilment, update shipment details, cancel an order, or resend confirmation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Carrier name</p>
                      <Input value={carrierName} onChange={(event) => setCarrierName(event.target.value)} placeholder="Delhivery, Blue Dart, DTDC" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Tracking id</p>
                      <Input value={trackingId} onChange={(event) => setTrackingId(event.target.value)} placeholder="Shipment tracking id" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Tracking URL</p>
                      <Input value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} placeholder="https://..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Operation note</p>
                    <Textarea
                      rows={3}
                      value={actionNote}
                      onChange={(event) => setActionNote(event.target.value)}
                      placeholder="Optional internal note or customer-facing shipment note"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.status === "paid" ? (
                      <Button type="button" onClick={() => void runOrderAction("mark_fulfilment_pending")} disabled={isActionRunning}>
                        Mark fulfilment ready
                      </Button>
                    ) : null}
                    {selectedOrder.status === "fulfilment_pending" && selectedOrder.fulfillmentMethod === "delivery" ? (
                      <Button type="button" onClick={() => void runOrderAction("mark_shipped")} disabled={isActionRunning}>
                        Mark shipped
                      </Button>
                    ) : null}
                    {selectedOrder.fulfillmentMethod === "store_pickup" && selectedOrder.status === "fulfilment_pending" ? (
                      <Button type="button" onClick={() => void runOrderAction("mark_delivered")} disabled={isActionRunning}>
                        Mark collected
                      </Button>
                    ) : null}
                    {selectedOrder.fulfillmentMethod === "delivery" && selectedOrder.status === "shipped" ? (
                      <Button type="button" onClick={() => void runOrderAction("mark_delivered")} disabled={isActionRunning}>
                        Mark delivered
                      </Button>
                    ) : null}
                    <Button type="button" variant="outline" onClick={() => void runOrderAction("resend_confirmation")} disabled={isActionRunning}>
                      Resend confirmation
                    </Button>
                    {selectedOrder.paymentStatus === "paid" &&
                    !["requested", "queued", "processing", "refunded"].includes(
                      selectedOrder.refund?.status ?? "none"
                    ) ? (
                      <Button type="button" variant="outline" onClick={() => setIsRefundDialogOpen(true)} disabled={isActionRunning}>
                        Request full refund
                      </Button>
                    ) : null}
                    {["created", "payment_pending", "paid", "fulfilment_pending", "shipped"].includes(selectedOrder.status) ? (
                      <Button type="button" variant="destructive" onClick={() => setIsCancelDialogOpen(true)} disabled={isActionRunning}>
                        Cancel order
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This moves the order into the cancelled state and records the action in the ecommerce timeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction onClick={() => void runOrderAction("cancel")}>
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request full refund?</AlertDialogTitle>
            <AlertDialogDescription>
              This records a full refund request for the current paid order and places it into the refund queue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!selectedOrder) {
                  return
                }

                setIsActionRunning(true)
                setDetailError(null)

                try {
                  const accessToken = getStoredAccessToken()

                  if (!accessToken) {
                    throw new Error("Admin access token is required.")
                  }

                  const response = await storefrontApi.requestRefund(accessToken, {
                    orderId: selectedOrder.id,
                    reason: actionNote,
                  })

                  setSelectedOrder(response.item)
                  await onOrderUpdated?.(response.item)
                  showRecordToast({
                    entity: "Refund",
                    action: "requested",
                    recordName: response.item.orderNumber,
                  })
                } catch (refundError) {
                  const message =
                    refundError instanceof Error ? refundError.message : "Failed to request refund."
                  setDetailError(message)
                  showAppToast({
                    variant: "error",
                    title: "Refund request failed.",
                    description: message,
                  })
                } finally {
                  setIsActionRunning(false)
                  setIsRefundDialogOpen(false)
                }
              }}
            >
              Request refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
