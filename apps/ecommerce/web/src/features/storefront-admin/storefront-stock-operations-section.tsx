import { useEffect, useMemo, useState } from "react"
import {
  Barcode,
  ClipboardCheck,
  ClipboardList,
  PackageCheck,
  Printer,
  RefreshCw,
  ScanLine,
  ShoppingCart,
} from "lucide-react"

import type {
  BillingBarcodeResolutionResponse,
  BillingGoodsInward,
  BillingGoodsInwardListResponse,
  BillingGoodsInwardPostingResponse,
  BillingPurchaseReceipt,
  BillingPurchaseReceiptListResponse,
  BillingStickerPrintBatchResponse,
  BillingStockSaleAllocationListResponse,
  BillingStockSaleAllocationResponse,
  BillingStockUnit,
  BillingStockUnitListResponse,
} from "@billing/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { formatHttpErrorMessage } from "@cxapp/web/src/lib/http-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

type PurchaseReceiptLineForm = {
  productId: string
  productName: string
  variantId: string
  variantName: string
  warehouseId: string
  quantity: string
  unit: string
  unitCost: string
  note: string
}

type GoodsInwardLineForm = {
  purchaseReceiptLineId: string
  productId: string
  productName: string
  variantId: string
  variantName: string
  expectedQuantity: string
  acceptedQuantity: string
  rejectedQuantity: string
  damagedQuantity: string
  manufacturerBarcode: string
  manufacturerSerial: string
  note: string
}

type PurchaseReceiptForm = {
  receiptNumber: string
  supplierName: string
  supplierLedgerId: string
  postingDate: string
  warehouseId: string
  warehouseName: string
  note: string
  lines: PurchaseReceiptLineForm[]
}

type GoodsInwardForm = {
  inwardNumber: string
  purchaseReceiptId: string
  purchaseReceiptNumber: string
  supplierName: string
  postingDate: string
  warehouseId: string
  warehouseName: string
  status: "draft" | "pending_verification" | "verified"
  note: string
  lines: GoodsInwardLineForm[]
}

function createPurchaseReceiptLineForm(
  warehouseId = "warehouse:default"
): PurchaseReceiptLineForm {
  return {
    productId: "",
    productName: "",
    variantId: "",
    variantName: "",
    warehouseId,
    quantity: "1",
    unit: "Nos",
    unitCost: "0",
    note: "",
  }
}

function createGoodsInwardLineForm(): GoodsInwardLineForm {
  return {
    purchaseReceiptLineId: "",
    productId: "",
    productName: "",
    variantId: "",
    variantName: "",
    expectedQuantity: "1",
    acceptedQuantity: "1",
    rejectedQuantity: "0",
    damagedQuantity: "0",
    manufacturerBarcode: "",
    manufacturerSerial: "",
    note: "",
  }
}

function createPurchaseReceiptForm(): PurchaseReceiptForm {
  return {
    receiptNumber: "",
    supplierName: "",
    supplierLedgerId: "",
    postingDate: new Date().toISOString().slice(0, 10),
    warehouseId: "warehouse:default",
    warehouseName: "Default Warehouse",
    note: "",
    lines: [createPurchaseReceiptLineForm()],
  }
}

function createGoodsInwardForm(): GoodsInwardForm {
  return {
    inwardNumber: "",
    purchaseReceiptId: "",
    purchaseReceiptNumber: "",
    supplierName: "",
    postingDate: new Date().toISOString().slice(0, 10),
    warehouseId: "warehouse:default",
    warehouseName: "Default Warehouse",
    status: "verified",
    note: "",
    lines: [createGoodsInwardLineForm()],
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; message?: string; detail?: string }
      | null
    throw new Error(formatHttpErrorMessage(payload, response.status))
  }

  return (await response.json()) as T
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-"
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function formatMoney(value: number | null) {
  if (value == null) {
    return "-"
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function statusBadge(status: string) {
  return status === "posted" || status === "verified" || status === "available"
    ? "secondary"
    : "outline"
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: typeof ClipboardList
  title: string
  value: string
  description: string
}) {
  return (
    <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10">
          <Icon className="size-5 text-accent" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function printStickerBatch(batch: BillingStickerPrintBatchResponse["item"]) {
  const popup = window.open("", "_blank", "noopener,noreferrer,width=900,height=700")
  if (!popup) {
    throw new Error("Print popup was blocked by the browser.")
  }
  popup.document.open()
  popup.document.write(`
    <html>
      <head>
        <title>${batch.goodsInwardNumber} stickers</title>
        <style>
          @page { size: 50mm 25mm; margin: 0; }
          body { margin: 0; font-family: Arial, sans-serif; background: #fff; }
          .inventory-sticker { width: 50mm; height: 25mm; box-sizing: border-box; border: 1px solid #111827; padding: 2.5mm; display: flex; flex-direction: column; page-break-inside: avoid; }
          .inventory-sticker header { font-size: 8px; font-weight: 700; margin-bottom: 1mm; }
          .inventory-sticker .line { font-size: 7px; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .inventory-sticker .product, .inventory-sticker .barcode { font-weight: 700; }
        </style>
      </head>
      <body>${batch.items.map((item) => item.stickerHtml).join("")}<script>window.onload=()=>window.print();</script></body>
    </html>
  `)
  popup.document.close()
}

export function StorefrontStockOperationsSection() {
  const [purchaseReceipts, setPurchaseReceipts] = useState<BillingPurchaseReceipt[]>([])
  const [goodsInwards, setGoodsInwards] = useState<BillingGoodsInward[]>([])
  const [stockUnits, setStockUnits] = useState<BillingStockUnit[]>([])
  const [saleAllocations, setSaleAllocations] = useState<BillingStockSaleAllocationListResponse["items"]>([])
  const [purchaseReceiptForm, setPurchaseReceiptForm] = useState(createPurchaseReceiptForm())
  const [goodsInwardForm, setGoodsInwardForm] = useState(createGoodsInwardForm())
  const [selectedGoodsInwardId, setSelectedGoodsInwardId] = useState("")
  const [lastStickerBatch, setLastStickerBatch] = useState<BillingStickerPrintBatchResponse["item"] | null>(null)
  const [scanInput, setScanInput] = useState("")
  const [scanWarehouseId, setScanWarehouseId] = useState("")
  const [scanSalesVoucherId, setScanSalesVoucherId] = useState("")
  const [scanSalesVoucherNumber, setScanSalesVoucherNumber] = useState("")
  const [scanSalesItemIndex, setScanSalesItemIndex] = useState("0")
  const [lastScanResult, setLastScanResult] = useState<BillingBarcodeResolutionResponse["item"] | null>(null)
  const [lastAllocation, setLastAllocation] = useState<BillingStockSaleAllocationResponse["item"] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  useGlobalLoading(isLoading || isSubmitting)

  const postedGoodsInwards = useMemo(
    () => goodsInwards.filter((item) => item.stockPostingStatus === "posted"),
    [goodsInwards]
  )
  const availableStockUnits = useMemo(
    () => stockUnits.filter((item) => item.status === "available"),
    [stockUnits]
  )

  async function loadData() {
    setIsLoading(true)
    setError(null)
    try {
      const [purchaseReceiptResponse, goodsInwardResponse, stockUnitResponse, allocationResponse] =
        await Promise.all([
          requestJson<BillingPurchaseReceiptListResponse>("/internal/v1/billing/purchase-receipts"),
          requestJson<BillingGoodsInwardListResponse>("/internal/v1/billing/goods-inward-notes"),
          requestJson<BillingStockUnitListResponse>("/internal/v1/billing/stock-units"),
          requestJson<BillingStockSaleAllocationListResponse>("/internal/v1/billing/stock/sale-allocations"),
        ])
      setPurchaseReceipts(purchaseReceiptResponse.items)
      setGoodsInwards(goodsInwardResponse.items)
      setStockUnits(stockUnitResponse.items)
      setSaleAllocations(allocationResponse.items)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load stock operations.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function applyReceiptToGoodsInward(receiptId: string) {
    const receipt = purchaseReceipts.find((item) => item.id === receiptId)
    if (!receipt) {
      return
    }

    setGoodsInwardForm((current) => ({
      ...current,
      purchaseReceiptId: receipt.id,
      purchaseReceiptNumber: receipt.receiptNumber,
      supplierName: receipt.supplierName,
      warehouseId: receipt.warehouseId,
      warehouseName: receipt.warehouseName,
      lines: receipt.lines.map((line) => ({
        purchaseReceiptLineId: line.id,
        productId: line.productId,
        productName: line.productName,
        variantId: line.variantId ?? "",
        variantName: line.variantName ?? "",
        expectedQuantity: String(line.quantity),
        acceptedQuantity: String(Math.max(line.quantity - line.receivedQuantity, 0)),
        rejectedQuantity: "0",
        damagedQuantity: "0",
        manufacturerBarcode: "",
        manufacturerSerial: "",
        note: line.note,
      })),
    }))
  }

  async function createPurchaseReceipt() {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await requestJson("/internal/v1/billing/purchase-receipts", {
        method: "POST",
        body: JSON.stringify({
          receiptNumber: purchaseReceiptForm.receiptNumber,
          supplierName: purchaseReceiptForm.supplierName,
          supplierLedgerId: purchaseReceiptForm.supplierLedgerId || null,
          postingDate: purchaseReceiptForm.postingDate,
          warehouseId: purchaseReceiptForm.warehouseId,
          warehouseName: purchaseReceiptForm.warehouseName,
          status: "open",
          note: purchaseReceiptForm.note,
          lines: purchaseReceiptForm.lines.map((line) => ({
            productId: line.productId,
            productName: line.productName,
            variantId: line.variantId || null,
            variantName: line.variantName || null,
            warehouseId: line.warehouseId,
            quantity: Number(line.quantity || 0),
            unit: line.unit || "Nos",
            unitCost: Number(line.unitCost || 0),
            note: line.note,
          })),
        }),
      })
      setPurchaseReceiptForm(createPurchaseReceiptForm())
      setSuccess("Purchase receipt created.")
      await loadData()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create purchase receipt.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function createGoodsInward() {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await requestJson("/internal/v1/billing/goods-inward-notes", {
        method: "POST",
        body: JSON.stringify({
          inwardNumber: goodsInwardForm.inwardNumber,
          purchaseReceiptId: goodsInwardForm.purchaseReceiptId,
          purchaseReceiptNumber: goodsInwardForm.purchaseReceiptNumber,
          supplierName: goodsInwardForm.supplierName,
          postingDate: goodsInwardForm.postingDate,
          warehouseId: goodsInwardForm.warehouseId,
          warehouseName: goodsInwardForm.warehouseName,
          status: goodsInwardForm.status,
          note: goodsInwardForm.note,
          lines: goodsInwardForm.lines.map((line) => ({
            purchaseReceiptLineId: line.purchaseReceiptLineId,
            productId: line.productId,
            productName: line.productName,
            variantId: line.variantId || null,
            variantName: line.variantName || null,
            expectedQuantity: Number(line.expectedQuantity || 0),
            acceptedQuantity: Number(line.acceptedQuantity || 0),
            rejectedQuantity: Number(line.rejectedQuantity || 0),
            damagedQuantity: Number(line.damagedQuantity || 0),
            manufacturerBarcode: line.manufacturerBarcode || null,
            manufacturerSerial: line.manufacturerSerial || null,
            note: line.note,
          })),
        }),
      })
      setGoodsInwardForm(createGoodsInwardForm())
      setSuccess("Goods inward note created.")
      await loadData()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create goods inward note.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function postGoodsInward(inwardId: string) {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await requestJson<BillingGoodsInwardPostingResponse>(
        `/internal/v1/billing/goods-inward-note/post?id=${encodeURIComponent(inwardId)}`,
        { method: "POST" }
      )
      setSuccess(`${response.unitsCreated} stock unit${response.unitsCreated === 1 ? "" : "s"} created and posted to inventory.`)
      await loadData()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to post goods inward into stock.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function generateStickerBatch() {
    if (!selectedGoodsInwardId) {
      setError("Select a posted goods inward record to generate stickers.")
      return
    }
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await requestJson<BillingStickerPrintBatchResponse>(
        "/internal/v1/billing/stock/sticker-batches",
        {
          method: "POST",
          body: JSON.stringify({
            goodsInwardId: selectedGoodsInwardId,
            template: "inventory-sticker-25x50mm",
          }),
        }
      )
      setLastStickerBatch(response.item)
      setSuccess(`Sticker batch created for ${response.item.itemCount} stock units.`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create sticker batch.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function verifyBarcode() {
    if (!scanInput.trim()) {
      setError("Enter a barcode, batch, or serial value to verify.")
      return
    }
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await requestJson<BillingBarcodeResolutionResponse>(
        "/internal/v1/billing/stock/barcode/resolve",
        {
          method: "POST",
          body: JSON.stringify({
            barcodeValue: scanInput,
            expectedWarehouseId: scanWarehouseId || null,
          }),
        }
      )
      setLastScanResult(response.item)
      setSuccess(response.item.resolved ? "Barcode resolved." : "Barcode did not resolve.")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to resolve barcode.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function issueStockToSale() {
    if (!scanInput.trim()) {
      setError("Enter a barcode value before issuing stock to sale.")
      return
    }
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await requestJson<BillingStockSaleAllocationResponse>(
        "/internal/v1/billing/stock/sale-allocations",
        {
          method: "POST",
          body: JSON.stringify({
            barcodeValue: scanInput,
            salesVoucherId: scanSalesVoucherId || null,
            salesVoucherNumber: scanSalesVoucherNumber || null,
            salesItemIndex: Number(scanSalesItemIndex || 0),
            warehouseId: scanWarehouseId || null,
            markAsSold: true,
          }),
        }
      )
      setLastAllocation(response.item)
      setSuccess("Stock unit issued into sales flow.")
      await loadData()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to issue scanned stock to sale.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs: AnimatedContentTab[] = [
    {
      value: "overview",
      label: "Overview",
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard icon={ClipboardList} title="Purchase receipts" value={String(purchaseReceipts.length)} description="Inbound buying documents tracked inside the ecommerce stock workflow." />
            <SummaryCard icon={ClipboardCheck} title="Goods inward" value={String(goodsInwards.length)} description="Verification records prepared before stock becomes available for sale." />
            <SummaryCard icon={PackageCheck} title="Available stock units" value={String(availableStockUnits.length)} description="Individually identified units ready for scanning and sales issue." />
            <SummaryCard icon={ShoppingCart} title="Sale allocations" value={String(saleAllocations.length)} description="Scan-based stock issue records already mapped into the sales lifecycle." />
          </div>
          <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Runtime coverage</CardTitle>
              <CardDescription>
                This workspace covers purchase receipt, goods inward, inward posting, stock-unit identity, barcode verification, sticker print payloads, and scan-based sales issue.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">Create purchase receipts before physical stock arrives.</div>
              <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">Verify goods inward and capture manufacturer barcode or serial values.</div>
              <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">Post inward stock to create sellable stock units and update aggregate warehouse stock.</div>
              <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">Print stickers, scan products, and issue them into the sales flow.</div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      value: "purchase",
      label: `Purchase (${purchaseReceipts.length})`,
      content: (
        <div className="space-y-4">
          <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Purchase receipt</CardTitle>
              <CardDescription>Capture incoming supplier stock before goods inward verification starts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2"><Label>Receipt Number</Label><Input value={purchaseReceiptForm.receiptNumber} onChange={(event) => setPurchaseReceiptForm((current) => ({ ...current, receiptNumber: event.target.value }))} /></div>
                <div className="space-y-2"><Label>Supplier Name</Label><Input value={purchaseReceiptForm.supplierName} onChange={(event) => setPurchaseReceiptForm((current) => ({ ...current, supplierName: event.target.value }))} /></div>
                <div className="space-y-2"><Label>Posting Date</Label><Input type="date" value={purchaseReceiptForm.postingDate} onChange={(event) => setPurchaseReceiptForm((current) => ({ ...current, postingDate: event.target.value }))} /></div>
                <div className="space-y-2"><Label>Warehouse ID</Label><Input value={purchaseReceiptForm.warehouseId} onChange={(event) => setPurchaseReceiptForm((current) => ({ ...current, warehouseId: event.target.value }))} /></div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2"><Label>Warehouse Name</Label><Input value={purchaseReceiptForm.warehouseName} onChange={(event) => setPurchaseReceiptForm((current) => ({ ...current, warehouseName: event.target.value }))} /></div>
                <div className="space-y-2"><Label>Note</Label><Textarea value={purchaseReceiptForm.note} onChange={(event) => setPurchaseReceiptForm((current) => ({ ...current, note: event.target.value }))} /></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Receipt lines</p>
                  <Button type="button" variant="outline" onClick={() => setPurchaseReceiptForm((current) => ({ ...current, lines: [...current.lines, createPurchaseReceiptLineForm(current.warehouseId)] }))}>Add line</Button>
                </div>
                {purchaseReceiptForm.lines.map((line, index) => (
                  <div key={`purchase-line-${index}`} className="grid gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 xl:grid-cols-8">
                    <Input value={line.productId} onChange={(event) => setPurchaseReceiptForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, productId: event.target.value } : item) }))} placeholder="Product ID" />
                    <Input value={line.productName} onChange={(event) => setPurchaseReceiptForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, productName: event.target.value } : item) }))} placeholder="Product name" />
                    <Input value={line.variantId} onChange={(event) => setPurchaseReceiptForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, variantId: event.target.value } : item) }))} placeholder="Variant ID" />
                    <Input value={line.variantName} onChange={(event) => setPurchaseReceiptForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, variantName: event.target.value } : item) }))} placeholder="Variant name" />
                    <Input value={line.quantity} onChange={(event) => setPurchaseReceiptForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: event.target.value } : item) }))} placeholder="Qty" />
                    <Input value={line.unitCost} onChange={(event) => setPurchaseReceiptForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, unitCost: event.target.value } : item) }))} placeholder="Unit cost" />
                    <Input value={line.unit} onChange={(event) => setPurchaseReceiptForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, unit: event.target.value } : item) }))} placeholder="Unit" />
                    <Button type="button" variant="ghost" onClick={() => setPurchaseReceiptForm((current) => ({ ...current, lines: current.lines.length === 1 ? current.lines : current.lines.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</Button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={() => void createPurchaseReceipt()}>Save purchase receipt</Button>
                <Button type="button" variant="outline" onClick={() => setPurchaseReceiptForm(createPurchaseReceiptForm())}>Reset</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
            <CardHeader><CardTitle>Recent purchase receipts</CardTitle></CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Supplier</TableHead><TableHead>Warehouse</TableHead><TableHead>Status</TableHead><TableHead>Lines</TableHead></TableRow></TableHeader><TableBody>
                {purchaseReceipts.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><div><p className="font-medium text-foreground">{item.receiptNumber}</p><p className="text-xs text-muted-foreground">{item.postingDate}</p></div></TableCell>
                    <TableCell>{item.supplierName}</TableCell>
                    <TableCell>{item.warehouseName}</TableCell>
                    <TableCell><Badge variant={statusBadge(item.status)}>{item.status}</Badge></TableCell>
                    <TableCell>{item.lines.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody></Table>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      value: "inward",
      label: `Inward (${goodsInwards.length})`,
      content: (
        <div className="space-y-4">
          <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Goods inward verification</CardTitle>
              <CardDescription>Bind a purchase receipt to physical inward, accepted quantity, and manufacturer identity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-2"><Label>Inward Number</Label><Input value={goodsInwardForm.inwardNumber} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, inwardNumber: event.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>Purchase Receipt</Label>
                  <Select value={goodsInwardForm.purchaseReceiptId} onValueChange={(value) => applyReceiptToGoodsInward(value)}>
                    <SelectTrigger><SelectValue placeholder="Select receipt" /></SelectTrigger>
                    <SelectContent>{purchaseReceipts.map((item) => <SelectItem key={item.id} value={item.id}>{item.receiptNumber}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Posting Date</Label><Input type="date" value={goodsInwardForm.postingDate} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, postingDate: event.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={goodsInwardForm.status} onValueChange={(value) => setGoodsInwardForm((current) => ({ ...current, status: value as GoodsInwardForm["status"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_verification">Pending verification</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Supplier</Label><Input value={goodsInwardForm.supplierName} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, supplierName: event.target.value }))} /></div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2"><Label>Warehouse</Label><Input value={goodsInwardForm.warehouseName} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, warehouseName: event.target.value }))} /></div>
                <div className="space-y-2"><Label>Note</Label><Textarea value={goodsInwardForm.note} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, note: event.target.value }))} /></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Verified inward lines</p>
                  <Button type="button" variant="outline" onClick={() => setGoodsInwardForm((current) => ({ ...current, lines: [...current.lines, createGoodsInwardLineForm()] }))}>Add line</Button>
                </div>
                {goodsInwardForm.lines.map((line, index) => (
                  <div key={`inward-line-${index}`} className="grid gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 xl:grid-cols-6">
                    <Input value={line.purchaseReceiptLineId} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, purchaseReceiptLineId: event.target.value } : item) }))} placeholder="Receipt line ID" />
                    <Input value={line.productId} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, productId: event.target.value } : item) }))} placeholder="Product ID" />
                    <Input value={line.productName} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, productName: event.target.value } : item) }))} placeholder="Product name" />
                    <Input value={line.expectedQuantity} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, expectedQuantity: event.target.value } : item) }))} placeholder="Expected" />
                    <Input value={line.acceptedQuantity} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, acceptedQuantity: event.target.value } : item) }))} placeholder="Accepted" />
                    <Input value={line.manufacturerSerial} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, manufacturerSerial: event.target.value } : item) }))} placeholder="Manufacturer serial" />
                    <Input value={line.manufacturerBarcode} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, manufacturerBarcode: event.target.value } : item) }))} placeholder="Manufacturer barcode" />
                    <Input value={line.rejectedQuantity} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, rejectedQuantity: event.target.value } : item) }))} placeholder="Rejected" />
                    <Input value={line.damagedQuantity} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, damagedQuantity: event.target.value } : item) }))} placeholder="Damaged" />
                    <Input value={line.variantId} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, variantId: event.target.value } : item) }))} placeholder="Variant ID" />
                    <Input value={line.variantName} onChange={(event) => setGoodsInwardForm((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? { ...item, variantName: event.target.value } : item) }))} placeholder="Variant name" />
                    <Button type="button" variant="ghost" onClick={() => setGoodsInwardForm((current) => ({ ...current, lines: current.lines.length === 1 ? current.lines : current.lines.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</Button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={() => void createGoodsInward()}>Save goods inward</Button>
                <Button type="button" variant="outline" onClick={() => setGoodsInwardForm(createGoodsInwardForm())}>Reset</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
            <CardHeader><CardTitle>Goods inward queue</CardTitle></CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Inward</TableHead><TableHead>Supplier</TableHead><TableHead>Status</TableHead><TableHead>Posting</TableHead><TableHead>Accepted</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>
                {goodsInwards.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><div><p className="font-medium text-foreground">{item.inwardNumber}</p><p className="text-xs text-muted-foreground">{item.purchaseReceiptNumber}</p></div></TableCell>
                    <TableCell>{item.supplierName}</TableCell>
                    <TableCell><Badge variant={statusBadge(item.status)}>{item.status}</Badge></TableCell>
                    <TableCell><Badge variant={statusBadge(item.stockPostingStatus)}>{item.stockPostingStatus}</Badge></TableCell>
                    <TableCell>{item.lines.reduce((sum, line) => sum + line.acceptedQuantity, 0)}</TableCell>
                    <TableCell className="text-right"><Button type="button" size="sm" variant="outline" disabled={isSubmitting || item.status !== "verified" || item.stockPostingStatus === "posted"} onClick={() => void postGoodsInward(item.id)}>Post to stock</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody></Table>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      value: "stock-units",
      label: `Stock Units (${stockUnits.length})`,
      content: (
        <div className="space-y-4">
          <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
            <CardHeader><CardTitle>Sticker generation</CardTitle><CardDescription>Create a `25 x 50 mm` stock sticker batch from posted goods inward stock units.</CardDescription></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
              <Select value={selectedGoodsInwardId} onValueChange={setSelectedGoodsInwardId}>
                <SelectTrigger><SelectValue placeholder="Select posted goods inward" /></SelectTrigger>
                <SelectContent>{postedGoodsInwards.map((item) => <SelectItem key={item.id} value={item.id}>{item.inwardNumber}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={() => void generateStickerBatch()}><Printer className="mr-2 size-4" />Generate stickers</Button>
              <Button type="button" variant="outline" onClick={() => void loadData()}><RefreshCw className="mr-2 size-4" />Refresh</Button>
            </CardContent>
          </Card>
          {lastStickerBatch ? (
            <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><CardTitle>Sticker batch preview</CardTitle><CardDescription>{lastStickerBatch.itemCount} sticker(s) generated for {lastStickerBatch.goodsInwardNumber}.</CardDescription></div>
                  <Button type="button" onClick={() => printStickerBatch(lastStickerBatch)}><Printer className="mr-2 size-4" />Print sticker batch</Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {lastStickerBatch.items.slice(0, 12).map((item) => <div key={item.stockUnitId} className="rounded-xl border border-border/70 bg-card/70 p-3" dangerouslySetInnerHTML={{ __html: item.stickerHtml }} />)}
              </CardContent>
            </Card>
          ) : null}
          <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
            <CardHeader><CardTitle>Available stock units</CardTitle></CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Warehouse</TableHead><TableHead>Barcode</TableHead><TableHead>Batch / Serial</TableHead><TableHead>Pricing</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
                {stockUnits.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><div><p className="font-medium text-foreground">{item.productName}</p><p className="text-xs text-muted-foreground">{item.productCode}{item.variantName ? ` | ${item.variantName}` : ""}</p></div></TableCell>
                    <TableCell>{item.warehouseName}</TableCell>
                    <TableCell className="font-mono text-xs">{item.barcodeValue}</TableCell>
                    <TableCell className="text-xs text-muted-foreground"><div>{item.batchCode}</div><div>{item.serialNumber}</div></TableCell>
                    <TableCell><div className="text-xs text-muted-foreground"><div>MRP: {formatMoney(item.mrp)}</div><div>Selling: {formatMoney(item.sellingPrice)}</div></div></TableCell>
                    <TableCell><Badge variant={statusBadge(item.status)}>{item.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody></Table>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      value: "scan-issue",
      label: `Scan & Issue (${saleAllocations.length})`,
      content: (
        <div className="space-y-4">
          <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
            <CardHeader><CardTitle>Scan verify and sales issue</CardTitle><CardDescription>Verify any barcode, batch, serial, or manufacturer identity, then issue the resolved unit into a sale.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-2 xl:col-span-2"><Label>Barcode or serial</Label><Input value={scanInput} onChange={(event) => setScanInput(event.target.value)} /></div>
                <div className="space-y-2"><Label>Warehouse ID</Label><Input value={scanWarehouseId} onChange={(event) => setScanWarehouseId(event.target.value)} /></div>
                <div className="space-y-2"><Label>Sales Voucher ID</Label><Input value={scanSalesVoucherId} onChange={(event) => setScanSalesVoucherId(event.target.value)} /></div>
                <div className="space-y-2"><Label>Sales Voucher Number</Label><Input value={scanSalesVoucherNumber} onChange={(event) => setScanSalesVoucherNumber(event.target.value)} /></div>
              </div>
              <div className="grid gap-3 md:grid-cols-[140px_auto_auto]">
                <div className="space-y-2"><Label>Sales Item Index</Label><Input value={scanSalesItemIndex} onChange={(event) => setScanSalesItemIndex(event.target.value)} /></div>
                <div className="flex items-end"><Button type="button" variant="outline" onClick={() => void verifyBarcode()}><ScanLine className="mr-2 size-4" />Verify scan</Button></div>
                <div className="flex items-end"><Button type="button" onClick={() => void issueStockToSale()}><ShoppingCart className="mr-2 size-4" />Issue to sale</Button></div>
              </div>
            </CardContent>
          </Card>
          {lastScanResult ? (
            <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
              <CardHeader><CardTitle>Scan result</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Resolved</p><p className="mt-2 font-medium text-foreground">{lastScanResult.resolved ? "Yes" : "No"}</p></div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Source</p><p className="mt-2 font-medium text-foreground">{lastScanResult.matchedSource ?? "-"}</p></div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Product</p><p className="mt-2 font-medium text-foreground">{lastScanResult.stockUnit?.productName ?? "-"}</p></div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</p><p className="mt-2 font-medium text-foreground">{lastScanResult.stockUnit?.status ?? "-"}</p></div>
                {lastScanResult.warning ? <div className="md:col-span-2 xl:col-span-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800">{lastScanResult.warning}</div> : null}
              </CardContent>
            </Card>
          ) : null}
          {lastAllocation ? (
            <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
              <CardHeader><CardTitle>Last sales issue allocation</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">Barcode: <span className="font-mono text-foreground">{lastAllocation.barcodeValue}</span></div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">Warehouse: <span className="text-foreground">{lastAllocation.warehouseId}</span></div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">Voucher: <span className="text-foreground">{lastAllocation.salesVoucherNumber ?? "-"}</span></div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">Status: <span className="text-foreground">{lastAllocation.status}</span></div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">Issued: <span className="text-foreground">{formatDateTime(lastAllocation.soldAt)}</span></div>
              </CardContent>
            </Card>
          ) : null}
          <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
            <CardHeader><CardTitle>Sales issue history</CardTitle></CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Barcode</TableHead><TableHead>Product</TableHead><TableHead>Voucher</TableHead><TableHead>Status</TableHead><TableHead>Allocated</TableHead></TableRow></TableHeader><TableBody>
                {saleAllocations.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.barcodeValue}</TableCell>
                    <TableCell>{item.productId}</TableCell>
                    <TableCell>{item.salesVoucherNumber ?? "-"}</TableCell>
                    <TableCell><Badge variant={statusBadge(item.status)}>{item.status}</Badge></TableCell>
                    <TableCell>{formatDateTime(item.allocatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody></Table>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {error ? <Card className="border-amber-500/40 bg-amber-500/5 py-0"><CardContent className="p-4 text-sm text-amber-800">{error}</CardContent></Card> : null}
      {success ? <Card className="border-emerald-500/40 bg-emerald-500/5 py-0"><CardContent className="p-4 text-sm text-emerald-700">{success}</CardContent></Card> : null}
      <Card className="border border-border/70 bg-background/90 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <Barcode className="size-3.5" />
            Stock operations
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <CardTitle>Ecommerce stock inward to sales issue</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-7">Run purchase receipt, goods inward, inward posting, barcode, sticker, and scan-based selling operations from one ecommerce-owned stock workspace.</CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={() => void loadData()}><RefreshCw className="mr-2 size-4" />Refresh stock workspace</Button>
          </div>
        </CardHeader>
      </Card>
      {!isLoading ? <AnimatedTabs defaultTabValue="overview" tabs={tabs} /> : null}
    </div>
  )
}
