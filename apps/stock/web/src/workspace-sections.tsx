import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"

import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { formatHttpErrorMessage } from "@cxapp/web/src/lib/http-error"
import type {
  BillingGoodsInward,
  BillingPurchaseReceipt,
  BillingStockUnit,
} from "@billing/shared"
import type { ProductListResponse } from "@core/shared"
import type {
  StockAvailability,
  StockReconciliationResponse,
  StockReservation,
  StockTransfer,
  StockVerificationSummary,
} from "../../shared/index.js"
import { VoucherInlineEditableTable } from "@/components/blocks/voucher-inline-editable-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SearchableLookupField } from "@/features/forms/searchable-lookup-field"
import { Input } from "@/components/ui/input"

type ResourceState<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
}

type PurchaseReceiptListResponse = { items: BillingPurchaseReceipt[] }
type PurchaseReceiptResponse = { item: BillingPurchaseReceipt }
type GoodsInwardListResponse = { items: BillingGoodsInward[] }
type GoodsInwardResponse = { item: BillingGoodsInward }
type GoodsInwardPostingResponse = { item: BillingGoodsInward; unitsCreated: number }
type StockUnitListResponse = { items: BillingStockUnit[] }
type BarcodeAliasListResponse = {
  items: Array<{
    id: string
    stockUnitId: string
    barcodeValue: string
    source: string
    updatedAt: string
  }>
}
type BarcodeResolutionResponse = {
  item: {
    barcodeValue: string
    resolved: boolean
    matchedSource: string | null
    warning: string | null
    stockUnit: BillingStockUnit | null
  }
}
type StickerBatchListResponse = {
  items: Array<{
    id: string
    goodsInwardId: string
    goodsInwardNumber: string
    itemCount: number
    template: string
    updatedAt: string
  }>
}
type SaleAllocationListResponse = {
  items: Array<{
    id: string
    stockUnitId: string
    barcodeValue: string
    productId: string
    warehouseId: string
    salesVoucherNumber: string | null
    status: string
    allocatedAt: string
    soldAt: string | null
  }>
}
type MovementListResponse = {
  items: Array<{
    id: string
    movementType: string
    direction: string
    warehouseId: string
    locationId: string | null
    productId: string
    variantId: string | null
    quantity: number
    referenceType: string | null
    referenceId: string | null
    updatedAt: string
  }>
}
type AvailabilityListResponse = { items: StockAvailability[] }
type TransferListResponse = { items: StockTransfer[] }
type ReservationListResponse = { items: StockReservation[] }
type LookupsResponse = {
  purchaseReceiptOptions: Array<{
    id: string
    label: string
    warehouseId: string
    warehouseName: string
    status: string
    lines: Array<{
      id: string
      productId: string
      productName: string
      variantId: string | null
      variantName: string | null
      quantity: number
      receivedQuantity: number
    }>
  }>
  goodsInwardOptions: Array<{
    id: string
    label: string
    status: string
    stockPostingStatus: string
    stockUnitCount: number
  }>
}

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

type ProductLookupItem = ProductListResponse["items"][number]
type ProductLookupOption = {
  label: string
  value: string
}

const voucherInlineInputClassName =
  "h-8 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"

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

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}

function useJsonResource<T>(path: string, deps: readonly unknown[] = []) {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    isLoading: true,
  })

  useEffect(() => {
    if (!path) {
      setState({ data: null, error: null, isLoading: false })
      return
    }

    let cancelled = false

    async function load() {
      setState({ data: null, error: null, isLoading: true })

      try {
        const data = await requestJson<T>(path)
        if (!cancelled) {
          setState({ data, error: null, isLoading: false })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : "Request failed.",
            isLoading: false,
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [path, ...deps])

  return state
}

function SectionIntro({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6">
            {description}
          </CardDescription>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </CardHeader>
    </Card>
  )
}

function LoadingCard({ message }: { message: string }) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-5 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

function StateCard({ message }: { message: string }) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-5 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40 text-left">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium text-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-border/70 align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function getPurchaseReceiptLineAmount(line: PurchaseReceiptLineForm) {
  return Number(line.quantity || 0) * Number(line.unitCost || 0)
}

function getGoodsInwardExceptionQuantity(line: GoodsInwardLineForm) {
  return Number(line.rejectedQuantity || 0) + Number(line.damagedQuantity || 0)
}

function getProductLookupOptions(products: ProductLookupItem[]): ProductLookupOption[] {
  return products
    .filter((product) => product.isActive)
    .map((product) => ({
      value: product.id,
      label: `${product.name} (${product.code})`,
    }))
}

function getPurchaseReceiptLineProductOptions(
  line: PurchaseReceiptLineForm,
  productOptions: ProductLookupOption[],
  index: number
) {
  if (line.productId && !productOptions.some((option) => option.value === line.productId)) {
    return [
      {
        value: line.productId,
        label: line.productName ? `${line.productName} (${line.productId})` : line.productId,
      },
      ...productOptions,
    ]
  }

  if (!line.productId && line.productName) {
    return [
      {
        value: `manual:${index}`,
        label: line.productName,
      },
      ...productOptions,
    ]
  }

  return productOptions
}

function createPurchaseReceiptProductPatch(
  product: ProductLookupItem,
  line: PurchaseReceiptLineForm
): Partial<PurchaseReceiptLineForm> {
  return {
    productId: product.id,
    productName: product.name,
    unitCost: product.costPrice > 0 ? String(product.costPrice) : line.unitCost,
  }
}

function normalizeInlineItemNote(note: string | null | undefined) {
  return note === "Expected inward quantity." ? "" : note ?? ""
}

function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="space-y-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}

function MetricCards({
  items,
}: {
  items: Array<{ label: string; value: string; tone?: "default" | "secondary" | "outline" }>
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="border-border/70 shadow-sm">
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {item.label}
            </p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-semibold text-foreground">{item.value}</p>
              <Badge variant={item.tone ?? "secondary"}>{item.label}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function OverviewSection() {
  const verifications = useJsonResource<StockVerificationSummary>("/internal/v1/stock/verifications")
  const movements = useJsonResource<MovementListResponse>("/internal/v1/stock/movements")

  if (verifications.isLoading || movements.isLoading) {
    return <LoadingCard message="Loading stock dashboard..." />
  }

  if (verifications.error) {
    return <StateCard message={verifications.error} />
  }

  if (!verifications.data) {
    return <StateCard message="Stock verification summary is unavailable." />
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        title="Stock control tower"
        description="Use the stock app as the operational workspace for inward, serial and barcode identity, warehouse movement, reservations, transfer send and accept, reconciliation, and verification."
      />
      <MetricCards
        items={[
          { label: "Pending verification", value: String(verifications.data.pendingVerificationCount) },
          { label: "Posted inward", value: String(verifications.data.postedInwardCount) },
          { label: "Available units", value: String(verifications.data.availableUnitCount) },
          { label: "Allocated units", value: String(verifications.data.allocatedUnitCount), tone: "outline" },
          { label: "Sold units", value: String(verifications.data.soldUnitCount), tone: "outline" },
          { label: "Tracked movements", value: String(movements.data?.items.length ?? 0) },
        ]}
      />
    </div>
  )
}

function PurchaseReceiptsSection() {
  const navigate = useNavigate()
  const { data, error, isLoading } = useJsonResource<PurchaseReceiptListResponse>(
    "/internal/v1/stock/purchase-receipts"
  )

  if (isLoading) {
    return <LoadingCard message="Loading purchase receipts..." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Purchase receipts are unavailable."} />
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        title="Purchase receipts"
        description="Supplier receipts stay document-owned by billing, while stock operations manage physical follow-through here."
        actions={
          <Button onClick={() => void navigate("/dashboard/apps/stock/purchase-receipts/new")}>
            New receipt
          </Button>
        }
      />
      <DataTable
        headers={["Receipt", "Supplier", "Posting", "Warehouse", "Status", "Actions"]}
        rows={data.items.map((item) => [
          <div key={item.id}>
            <p className="font-medium text-foreground">{item.receiptNumber}</p>
            <p className="text-xs">{item.id}</p>
          </div>,
          item.supplierName,
          item.postingDate,
          item.warehouseName,
          <Badge key={`${item.id}:status`} variant="outline">{item.status}</Badge>,
          <div key={`${item.id}:actions`} className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/apps/stock/purchase-receipts/${encodeURIComponent(item.id)}`}>Show</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/apps/stock/purchase-receipts/${encodeURIComponent(item.id)}/edit`}>Edit</Link>
            </Button>
          </div>,
        ])}
      />
    </div>
  )
}

function PurchaseReceiptShowSection({ receiptId }: { receiptId: string }) {
  const { data, error, isLoading } = useJsonResource<PurchaseReceiptResponse>(
    `/internal/v1/stock/purchase-receipt?id=${encodeURIComponent(receiptId)}`,
    [receiptId]
  )

  if (isLoading) {
    return <LoadingCard message="Loading purchase receipt..." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Purchase receipt detail is unavailable."} />
  }

  const item = data.item
  return (
    <div className="space-y-4">
      <SectionIntro
        title={item.receiptNumber}
        description={`${item.supplierName} · ${item.warehouseName} · ${item.postingDate}`}
        actions={
          <Button variant="outline" asChild>
            <Link to={`/dashboard/apps/stock/purchase-receipts/${encodeURIComponent(item.id)}/edit`}>
              Edit receipt
            </Link>
          </Button>
        }
      />
      <DataTable
        headers={["Product", "Description", "Qty", "Rate", "Amount"]}
        rows={item.lines.map((line) => [
          <div key={`${line.id}:product`}>
            <p className="font-medium text-foreground">{line.productName}</p>
            <p className="text-xs text-muted-foreground">{line.productId}</p>
          </div>,
          <div key={`${line.id}:description`}>
            <p>{line.variantName ?? "-"}</p>
            <p className="text-xs text-muted-foreground">
              Received {line.receivedQuantity.toFixed(2)} · {line.warehouseId}
            </p>
          </div>,
          `${line.quantity.toFixed(2)} ${line.unit}`,
          formatMoney(line.unitCost),
          formatMoney(line.quantity * line.unitCost),
        ])}
      />
    </div>
  )
}

function PurchaseReceiptUpsertSection({ receiptId }: { receiptId?: string }) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lines, setLines] = useState<PurchaseReceiptLineForm[]>([
    {
      productId: "",
      productName: "",
      variantId: "",
      variantName: "",
      warehouseId: "",
      quantity: "1",
      unit: "Nos",
      unitCost: "0",
      note: "",
    },
  ])
  const [form, setForm] = useState({
    receiptNumber: "",
    supplierName: "",
    supplierLedgerId: "",
    postingDate: new Date().toISOString().slice(0, 10),
    warehouseId: "",
    warehouseName: "",
    sourceVoucherId: "",
    sourceFrappeReceiptId: "",
    status: "open",
    note: "",
  })

  const detail = useJsonResource<PurchaseReceiptResponse>(
    receiptId ? `/internal/v1/stock/purchase-receipt?id=${encodeURIComponent(receiptId)}` : "",
    [receiptId]
  )
  const productLookup = useJsonResource<ProductListResponse>("/internal/v1/core/products")
  const productOptions = useMemo(
    () => getProductLookupOptions(productLookup.data?.items ?? []),
    [productLookup.data]
  )

  useEffect(() => {
    if (!receiptId || !detail.data) {
      return
    }

    setForm({
      receiptNumber: detail.data.item.receiptNumber,
      supplierName: detail.data.item.supplierName,
      supplierLedgerId: detail.data.item.supplierLedgerId ?? "",
      postingDate: detail.data.item.postingDate,
      warehouseId: detail.data.item.warehouseId,
      warehouseName: detail.data.item.warehouseName,
      sourceVoucherId: detail.data.item.sourceVoucherId ?? "",
      sourceFrappeReceiptId: detail.data.item.sourceFrappeReceiptId ?? "",
      status: detail.data.item.status,
      note: detail.data.item.note ?? "",
    })
    setLines(
      detail.data.item.lines.map((line) => ({
        productId: line.productId,
        productName: line.productName,
        variantId: line.variantId ?? "",
        variantName: line.variantName ?? "",
        warehouseId: line.warehouseId,
        quantity: String(line.quantity),
        unit: line.unit,
        unitCost: String(line.unitCost),
        note: normalizeInlineItemNote(line.note),
      }))
    )
  }, [detail.data, receiptId])

  function updatePurchaseReceiptLine(
    index: number,
    patch: Partial<PurchaseReceiptLineForm>
  ) {
    setLines((current) =>
      current.map((item, lineIndex) => (lineIndex === index ? { ...item, ...patch } : item))
    )
  }

  function selectPurchaseReceiptProduct(index: number, productId: string) {
    const selectedProduct = productLookup.data?.items.find((product) => product.id === productId)
    if (!selectedProduct) {
      return
    }

    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index
          ? { ...line, ...createPurchaseReceiptProductPatch(selectedProduct, line) }
          : line
      )
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await requestJson<PurchaseReceiptResponse>(
        receiptId
          ? `/internal/v1/stock/purchase-receipt?id=${encodeURIComponent(receiptId)}`
          : "/internal/v1/stock/purchase-receipts",
        {
          method: receiptId ? "PATCH" : "POST",
          body: JSON.stringify({
            ...form,
            supplierLedgerId: form.supplierLedgerId || null,
            sourceVoucherId: form.sourceVoucherId || null,
            sourceFrappeReceiptId: form.sourceFrappeReceiptId || null,
            note: form.note || null,
            lines: lines.map((line) => ({
              productId: line.productId,
              productName: line.productName,
              variantId: line.variantId || null,
              variantName: line.variantName || null,
              warehouseId: line.warehouseId || form.warehouseId,
              quantity: Number(line.quantity),
              unit: line.unit,
              unitCost: Number(line.unitCost),
              note: line.note,
            })),
          }),
        }
      )

      void navigate(`/dashboard/apps/stock/purchase-receipts/${encodeURIComponent(response.item.id)}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save purchase receipt.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        title={receiptId ? "Edit purchase receipt" : "New purchase receipt"}
        description="Capture supplier, warehouse, and product lines before goods inward verification begins."
      />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormGrid>
              <Field label="Receipt number"><Input value={form.receiptNumber} onChange={(event) => setForm({ ...form, receiptNumber: event.target.value })} required /></Field>
              <Field label="Supplier name"><Input value={form.supplierName} onChange={(event) => setForm({ ...form, supplierName: event.target.value })} required /></Field>
              <Field label="Posting date"><Input type="date" value={form.postingDate} onChange={(event) => setForm({ ...form, postingDate: event.target.value })} required /></Field>
              <Field label="Status">
                <select className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="open">Open</option>
                  <option value="partially_received">Partially received</option>
                  <option value="fully_received">Fully received</option>
                </select>
              </Field>
              <Field label="Warehouse id"><Input value={form.warehouseId} onChange={(event) => setForm({ ...form, warehouseId: event.target.value })} required /></Field>
              <Field label="Warehouse name"><Input value={form.warehouseName} onChange={(event) => setForm({ ...form, warehouseName: event.target.value })} required /></Field>
            </FormGrid>
            <VoucherInlineEditableTable
              title="Purchase items"
              description="Add receipt lines as purchase sub-items. Quantity and estimated value are derived from this table."
              addLabel="Add item"
              fitToContainer
              rows={lines}
              onAddRow={() =>
                setLines((current) => [
                  ...current,
                  {
                    productId: "",
                    productName: "",
                    variantId: "",
                    variantName: "",
                    warehouseId: form.warehouseId,
                    quantity: "1",
                    unit: "Nos",
                    unitCost: "0",
                    note: "",
                  },
                ])
              }
              onRemoveRow={(index) =>
                setLines((current) =>
                  current.length === 1
                    ? current
                    : current.filter((_, lineIndex) => lineIndex !== index)
                )
              }
              removeButtonLabel="Remove"
              getRowKey={(line, index) =>
                `stock-purchase-receipt-line:${index}:${line.productId}:${line.productName}`
              }
              columns={[
                {
                  id: "product",
                  header: "Product",
                  headerClassName: "w-[34%] min-w-80",
                  cellClassName: "w-[34%]",
                  renderCell: (line, index) => {
                    const rowOptions = getPurchaseReceiptLineProductOptions(
                      line,
                      productOptions,
                      index
                    )

                    return (
                      <div className="space-y-0.5">
                        <SearchableLookupField
                          emptyOptionLabel="Select product"
                          noResultsMessage="No products found."
                          onValueChange={(nextValue) => {
                            if (!nextValue || nextValue.startsWith("manual:")) {
                              return
                            }

                            selectPurchaseReceiptProduct(index, nextValue)
                          }}
                          options={rowOptions}
                          placeholder={productLookup.isLoading ? "Loading products..." : "Select product"}
                          searchPlaceholder="Search product"
                          triggerClassName="h-8 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
                          value={line.productId || (line.productName ? `manual:${index}` : "")}
                        />
                      </div>
                    )
                  },
                },
                {
                  id: "description",
                  header: "Description",
                  headerClassName: "w-[28%]",
                  cellClassName: "w-[28%] max-w-0",
                  renderCell: (line, index) => (
                    <div className="min-w-0 space-y-0.5">
                      <Input
                        aria-label="Description"
                        value={line.variantName}
                        onChange={(event) =>
                          updatePurchaseReceiptLine(index, { variantName: event.target.value })
                        }
                        className={`${voucherInlineInputClassName} truncate`}
                      />
                      <Input
                        aria-label="Line note"
                        value={line.note}
                        onChange={(event) =>
                          updatePurchaseReceiptLine(index, { note: event.target.value })
                        }
                        className="h-6 truncate rounded-none border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
                      />
                    </div>
                  ),
                },
                {
                  id: "quantity",
                  header: "Qty",
                  headerClassName: "w-[12%]",
                  cellClassName: "w-[12%]",
                  renderCell: (line, index) => (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.quantity}
                      onChange={(event) =>
                        updatePurchaseReceiptLine(index, { quantity: event.target.value })
                      }
                      className={voucherInlineInputClassName}
                      required
                    />
                  ),
                },
                {
                  id: "rate",
                  header: "Rate",
                  headerClassName: "w-[14%]",
                  cellClassName: "w-[14%]",
                  renderCell: (line, index) => (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitCost}
                      onChange={(event) =>
                        updatePurchaseReceiptLine(index, { unitCost: event.target.value })
                      }
                      className={voucherInlineInputClassName}
                      required
                    />
                  ),
                },
                {
                  id: "amount",
                  header: "Amount",
                  headerClassName: "w-[14%] text-right",
                  cellClassName: "w-[14%] text-right font-medium text-foreground",
                  renderCell: (line) => formatMoney(getPurchaseReceiptLineAmount(line)),
                },
              ]}
              footer={
                <>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Quantity
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {lines
                        .reduce((sum, line) => sum + Number(line.quantity || 0), 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Subtotal
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {formatMoney(
                        lines.reduce((sum, line) => sum + getPurchaseReceiptLineAmount(line), 0)
                      )}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Lines
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {lines.length}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Warehouse
                    </p>
                    <p className="mt-2 break-words text-sm font-medium text-foreground">
                      {form.warehouseName || "Not set"}
                    </p>
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {form.warehouseId || "Enter the warehouse id for inward posting."}
                    </p>
                  </div>
                </>
              }
            />
            {error ? <StateCard message={error} /> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save receipt"}</Button>
              <Button type="button" variant="outline" onClick={() => void navigate("/dashboard/apps/stock/purchase-receipts")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function GoodsInwardSection() {
  const navigate = useNavigate()
  const { data, error, isLoading } = useJsonResource<GoodsInwardListResponse>("/internal/v1/stock/goods-inward")

  if (isLoading) {
    return <LoadingCard message="Loading goods inward..." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Goods inward records are unavailable."} />
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        title="Goods inward"
        description="Verify accepted, rejected, and damaged quantity before real stock becomes available."
        actions={<Button onClick={() => void navigate("/dashboard/apps/stock/goods-inward/new")}>New inward</Button>}
      />
      <DataTable
        headers={["Inward", "Receipt", "Warehouse", "Status", "Posting", "Actions"]}
        rows={data.items.map((item) => [
          item.inwardNumber,
          item.purchaseReceiptNumber,
          item.warehouseName,
          <Badge key={`${item.id}:status`} variant="outline">{item.status}</Badge>,
          <Badge key={`${item.id}:posting`} variant={item.stockPostingStatus === "posted" ? "secondary" : "outline"}>{item.stockPostingStatus}</Badge>,
          <div key={`${item.id}:actions`} className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/apps/stock/goods-inward/${encodeURIComponent(item.id)}`}>Show</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/apps/stock/goods-inward/${encodeURIComponent(item.id)}/edit`}>Edit</Link>
            </Button>
          </div>,
        ])}
      />
    </div>
  )
}

function GoodsInwardShowSection({ goodsInwardId }: { goodsInwardId: string }) {
  const navigate = useNavigate()
  const { data, error, isLoading } = useJsonResource<GoodsInwardResponse>(
    `/internal/v1/stock/goods-inward-note?id=${encodeURIComponent(goodsInwardId)}`,
    [goodsInwardId]
  )
  const [postingMessage, setPostingMessage] = useState<string | null>(null)

  if (isLoading) {
    return <LoadingCard message="Loading goods inward detail..." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Goods inward detail is unavailable."} />
  }

  const item = data.item

  async function postRecord() {
    const response = await requestJson<GoodsInwardPostingResponse>(
      `/internal/v1/stock/goods-inward-note/post?id=${encodeURIComponent(item.id)}`,
      { method: "POST" }
    )
    setPostingMessage(`Posted to inventory. Units created: ${response.unitsCreated}.`)
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        title={item.inwardNumber}
        description={`${item.purchaseReceiptNumber} · ${item.warehouseName} · ${item.postingDate}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to={`/dashboard/apps/stock/goods-inward/${encodeURIComponent(item.id)}/edit`}>Edit inward</Link>
            </Button>
            <Button onClick={() => void postRecord()} disabled={item.stockPostingStatus === "posted"}>
              {item.stockPostingStatus === "posted" ? "Already posted" : "Post to stock"}
            </Button>
          </>
        }
      />
      {postingMessage ? <StateCard message={postingMessage} /> : null}
      <DataTable
        headers={["Product", "Description", "Expected", "Accepted", "Exception", "Identity"]}
        rows={item.lines.map((line) => [
          <div key={`${line.id}:product`}>
            <p className="font-medium text-foreground">{line.productName}</p>
            <p className="text-xs text-muted-foreground">{line.productId}</p>
          </div>,
          <div key={`${line.id}:description`}>
            <p>{line.variantName || "No variant"}</p>
            <p className="text-xs text-muted-foreground">
              {normalizeInlineItemNote(line.note) || `Receipt line ${line.purchaseReceiptLineId}`}
            </p>
          </div>,
          String(line.expectedQuantity),
          String(line.acceptedQuantity),
          <div key={`${line.id}:exception`}>
            <p>Rejected {line.rejectedQuantity}</p>
            <p className="text-xs text-muted-foreground">Damaged {line.damagedQuantity}</p>
          </div>,
          <div key={`${line.id}:identity`}>
            <p>{line.manufacturerBarcode || "No barcode"}</p>
            <p className="text-xs text-muted-foreground">{line.manufacturerSerial || "No serial"}</p>
          </div>,
        ])}
      />
      <Button variant="outline" onClick={() => void navigate("/dashboard/apps/stock/goods-inward")}>Back to inward list</Button>
    </div>
  )
}

function GoodsInwardUpsertSection({ goodsInwardId }: { goodsInwardId?: string }) {
  const navigate = useNavigate()
  const lookups = useJsonResource<LookupsResponse>("/internal/v1/stock/lookups")
  const detail = useJsonResource<GoodsInwardResponse>(
    goodsInwardId ? `/internal/v1/stock/goods-inward-note?id=${encodeURIComponent(goodsInwardId)}` : "",
    [goodsInwardId]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    inwardNumber: "",
    purchaseReceiptId: "",
    purchaseReceiptNumber: "",
    supplierName: "",
    postingDate: new Date().toISOString().slice(0, 10),
    warehouseId: "",
    warehouseName: "",
    status: "draft",
    note: "",
  })
  const [lines, setLines] = useState<GoodsInwardLineForm[]>([])

  useEffect(() => {
    if (goodsInwardId && detail.data) {
      setForm({
        inwardNumber: detail.data.item.inwardNumber,
        purchaseReceiptId: detail.data.item.purchaseReceiptId,
        purchaseReceiptNumber: detail.data.item.purchaseReceiptNumber,
        supplierName: detail.data.item.supplierName,
        postingDate: detail.data.item.postingDate,
        warehouseId: detail.data.item.warehouseId,
        warehouseName: detail.data.item.warehouseName,
        status: detail.data.item.status,
        note: detail.data.item.note ?? "",
      })
      setLines(
        detail.data.item.lines.map((line) => ({
          purchaseReceiptLineId: line.purchaseReceiptLineId,
          productId: line.productId,
          productName: line.productName,
          variantId: line.variantId ?? "",
          variantName: line.variantName ?? "",
          expectedQuantity: String(line.expectedQuantity),
          acceptedQuantity: String(line.acceptedQuantity),
          rejectedQuantity: String(line.rejectedQuantity),
          damagedQuantity: String(line.damagedQuantity),
          manufacturerBarcode: line.manufacturerBarcode ?? "",
          manufacturerSerial: line.manufacturerSerial ?? "",
          note: normalizeInlineItemNote(line.note),
        }))
      )
      return
    }

    if (!goodsInwardId && lookups.data && !form.purchaseReceiptId && lookups.data.purchaseReceiptOptions[0]) {
      const firstReceipt = lookups.data.purchaseReceiptOptions[0]
      setForm((current) => ({
        ...current,
        purchaseReceiptId: firstReceipt.id,
        purchaseReceiptNumber: firstReceipt.label.split(" · ")[0] ?? "",
        warehouseId: firstReceipt.warehouseId,
        warehouseName: firstReceipt.warehouseName,
      }))
      setLines(
        firstReceipt.lines.map((line) => ({
          purchaseReceiptLineId: line.id,
          productId: line.productId,
          productName: line.productName,
          variantId: line.variantId ?? "",
          variantName: line.variantName ?? "",
          expectedQuantity: String(line.quantity - line.receivedQuantity),
          acceptedQuantity: "0",
          rejectedQuantity: "0",
          damagedQuantity: "0",
          manufacturerBarcode: "",
          manufacturerSerial: "",
          note: "",
        }))
      )
    }
  }, [detail.data, form.purchaseReceiptId, goodsInwardId, lookups.data])

  function applyReceipt(receiptId: string) {
    const receipt = lookups.data?.purchaseReceiptOptions.find((item) => item.id === receiptId)
    if (!receipt) {
      return
    }

    setForm((current) => ({
      ...current,
      purchaseReceiptId: receipt.id,
      purchaseReceiptNumber: receipt.label.split(" · ")[0] ?? "",
      warehouseId: receipt.warehouseId,
      warehouseName: receipt.warehouseName,
    }))
    setLines(
      receipt.lines.map((line) => ({
        purchaseReceiptLineId: line.id,
        productId: line.productId,
        productName: line.productName,
        variantId: line.variantId ?? "",
        variantName: line.variantName ?? "",
        expectedQuantity: String(line.quantity - line.receivedQuantity),
        acceptedQuantity: "0",
        rejectedQuantity: "0",
        damagedQuantity: "0",
        manufacturerBarcode: "",
        manufacturerSerial: "",
        note: "",
      }))
    )
  }

  function updateGoodsInwardLine(
    index: number,
    patch: Partial<GoodsInwardLineForm>
  ) {
    setLines((current) =>
      current.map((item, lineIndex) => (lineIndex === index ? { ...item, ...patch } : item))
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await requestJson<GoodsInwardResponse>(
        goodsInwardId
          ? `/internal/v1/stock/goods-inward-note?id=${encodeURIComponent(goodsInwardId)}`
          : "/internal/v1/stock/goods-inward",
        {
          method: goodsInwardId ? "PATCH" : "POST",
          body: JSON.stringify({
            ...form,
            note: form.note || null,
            lines: lines.map((line) => ({
              purchaseReceiptLineId: line.purchaseReceiptLineId,
              productId: line.productId,
              productName: line.productName,
              variantId: line.variantId || null,
              variantName: line.variantName || null,
              expectedQuantity: Number(line.expectedQuantity),
              acceptedQuantity: Number(line.acceptedQuantity),
              rejectedQuantity: Number(line.rejectedQuantity),
              damagedQuantity: Number(line.damagedQuantity),
              manufacturerBarcode: line.manufacturerBarcode || null,
              manufacturerSerial: line.manufacturerSerial || null,
              note: line.note,
            })),
          }),
        }
      )
      void navigate(`/dashboard/apps/stock/goods-inward/${encodeURIComponent(response.item.id)}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save goods inward.")
    } finally {
      setSaving(false)
    }
  }

  if (lookups.isLoading && !goodsInwardId) {
    return <LoadingCard message="Loading goods inward lookups..." />
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        title={goodsInwardId ? "Edit goods inward" : "New goods inward"}
        description="Capture accepted, rejected, and damaged quantity per purchase receipt line before stock posting."
      />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormGrid>
              <Field label="Inward number"><Input value={form.inwardNumber} onChange={(event) => setForm({ ...form, inwardNumber: event.target.value })} required /></Field>
              <Field label="Supplier name"><Input value={form.supplierName} onChange={(event) => setForm({ ...form, supplierName: event.target.value })} required /></Field>
              <Field label="Purchase receipt">
                <select className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm" value={form.purchaseReceiptId} onChange={(event) => applyReceipt(event.target.value)} required>
                  <option value="">Select receipt</option>
                  {(lookups.data?.purchaseReceiptOptions ?? []).map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Posting date"><Input type="date" value={form.postingDate} onChange={(event) => setForm({ ...form, postingDate: event.target.value })} required /></Field>
              <Field label="Status">
                <select className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </Field>
            </FormGrid>
            <VoucherInlineEditableTable
              title="Inward items"
              description="Verify each purchase receipt line with expected, accepted, exception, and manufacturer identity values."
              addLabel="Add item"
              rows={lines}
              onAddRow={() =>
                setLines((current) => [
                  ...current,
                  {
                    purchaseReceiptLineId: "",
                    productId: "",
                    productName: "",
                    variantId: "",
                    variantName: "",
                    expectedQuantity: "1",
                    acceptedQuantity: "0",
                    rejectedQuantity: "0",
                    damagedQuantity: "0",
                    manufacturerBarcode: "",
                    manufacturerSerial: "",
                    note: "",
                  },
                ])
              }
              onRemoveRow={(index) =>
                setLines((current) =>
                  current.length === 1
                    ? current
                    : current.filter((_, lineIndex) => lineIndex !== index)
                )
              }
              removeButtonLabel="Remove"
              getRowKey={(line, index) =>
                `stock-goods-inward-line:${index}:${line.purchaseReceiptLineId}:${line.productId}`
              }
              columns={[
                {
                  id: "product",
                  header: "Product",
                  headerClassName: "min-w-60",
                  renderCell: (line, index) => (
                    <div className="space-y-0.5">
                      <Input
                        placeholder="Product name"
                        value={line.productName}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { productName: event.target.value })
                        }
                        className={voucherInlineInputClassName}
                        required
                      />
                      <Input
                        placeholder="Product id"
                        value={line.productId}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { productId: event.target.value })
                        }
                        className="h-6 rounded-none border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
                        required
                      />
                    </div>
                  ),
                },
                {
                  id: "description",
                  header: "Description",
                  headerClassName: "min-w-72",
                  cellClassName: "max-w-0",
                  renderCell: (line, index) => (
                    <div className="min-w-0 space-y-0.5">
                      <Input
                        aria-label="Description"
                        value={line.variantName}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { variantName: event.target.value })
                        }
                        className={`${voucherInlineInputClassName} truncate`}
                      />
                      <Input
                        aria-label="Purchase receipt line id"
                        value={line.purchaseReceiptLineId}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { purchaseReceiptLineId: event.target.value })
                        }
                        className="h-6 truncate rounded-none border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
                        required
                      />
                      <Input
                        aria-label="Line note"
                        value={line.note}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { note: event.target.value })
                        }
                        className="h-6 truncate rounded-none border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
                      />
                    </div>
                  ),
                },
                {
                  id: "expectedQuantity",
                  header: "Expected",
                  headerClassName: "w-[10%] text-right",
                  cellClassName: "w-[10%] text-right",
                  renderCell: (line, index) => (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.expectedQuantity}
                      onChange={(event) =>
                        updateGoodsInwardLine(index, { expectedQuantity: event.target.value })
                      }
                      className={voucherInlineInputClassName}
                      required
                    />
                  ),
                },
                {
                  id: "acceptedQuantity",
                  header: "Accepted",
                  headerClassName: "w-[10%] text-right",
                  cellClassName: "w-[10%] text-right",
                  renderCell: (line, index) => (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.acceptedQuantity}
                      onChange={(event) =>
                        updateGoodsInwardLine(index, { acceptedQuantity: event.target.value })
                      }
                      className={voucherInlineInputClassName}
                      required
                    />
                  ),
                },
                {
                  id: "exception",
                  header: "Exception",
                  headerClassName: "min-w-32 text-right",
                  cellClassName: "text-right",
                  renderCell: (line, index) => (
                    <div className="space-y-0.5">
                      <Input
                        aria-label="Rejected quantity"
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.rejectedQuantity}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { rejectedQuantity: event.target.value })
                        }
                        className={voucherInlineInputClassName}
                        required
                      />
                      <Input
                        aria-label="Damaged quantity"
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.damagedQuantity}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { damagedQuantity: event.target.value })
                        }
                        className="h-6 rounded-none border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
                        required
                      />
                    </div>
                  ),
                },
                {
                  id: "identity",
                  header: "Identity",
                  headerClassName: "min-w-48",
                  renderCell: (line, index) => (
                    <div className="space-y-0.5">
                      <Input
                        placeholder="Manufacturer serial"
                        value={line.manufacturerSerial}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { manufacturerSerial: event.target.value })
                        }
                        className={voucherInlineInputClassName}
                      />
                      <Input
                        placeholder="Manufacturer barcode"
                        value={line.manufacturerBarcode}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { manufacturerBarcode: event.target.value })
                        }
                        className="h-6 rounded-none border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
                      />
                    </div>
                  ),
                },
              ]}
              footer={
                <>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Line count</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{lines.length}</p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Expected total</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {lines.reduce((sum, line) => sum + Number(line.expectedQuantity || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Accepted total</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {lines.reduce((sum, line) => sum + Number(line.acceptedQuantity || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Exception total</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {lines.reduce((sum, line) => sum + getGoodsInwardExceptionQuantity(line), 0).toFixed(2)}
                    </p>
                  </div>
                </>
              }
            />
            {error ? <StateCard message={error} /> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save inward"}</Button>
              <Button type="button" variant="outline" onClick={() => void navigate("/dashboard/apps/stock/goods-inward")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function StockUnitsSection() {
  const { data, error, isLoading } = useJsonResource<StockUnitListResponse>("/internal/v1/stock/stock-units")
  if (isLoading) return <LoadingCard message="Loading stock units..." />
  if (error || !data) return <StateCard message={error ?? "Stock units are unavailable."} />

  return <DataTable headers={["Barcode", "Product", "Batch", "Serial", "Warehouse", "Status"]} rows={data.items.map((item) => [item.barcodeValue, item.productName, item.batchCode, item.serialNumber, item.warehouseName, <Badge key={item.id} variant="outline">{item.status}</Badge>])} />
}

function BarcodeSection() {
  const aliases = useJsonResource<BarcodeAliasListResponse>("/internal/v1/stock/barcode-aliases")
  const [barcodeValue, setBarcodeValue] = useState("")
  const [result, setResult] = useState<BarcodeResolutionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleResolve(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    try {
      setResult(
        await requestJson<BarcodeResolutionResponse>("/internal/v1/stock/barcode/resolve", {
          method: "POST",
          body: JSON.stringify({ barcodeValue }),
        })
      )
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Barcode resolution failed.")
    }
  }

  return (
    <div className="space-y-4">
      <SectionIntro title="Barcode and serial verification" description="Verify internal, vendor, manufacturer, batch, and serial identifiers against the current stock-unit ledger." />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <form className="flex gap-3" onSubmit={handleResolve}>
            <Input placeholder="Scan or type barcode" value={barcodeValue} onChange={(event) => setBarcodeValue(event.target.value)} />
            <Button type="submit">Verify</Button>
          </form>
        </CardContent>
      </Card>
      {error ? <StateCard message={error} /> : null}
      {result ? (
        <StateCard
          message={
            result.item.stockUnit
              ? `${result.item.barcodeValue} resolved to ${result.item.stockUnit.productName} in ${result.item.stockUnit.warehouseName}. ${result.item.warning ?? ""}`
              : result.item.warning ?? "Barcode did not resolve."
          }
        />
      ) : null}
      {aliases.data ? <DataTable headers={["Barcode", "Source", "Stock unit", "Updated"]} rows={aliases.data.items.slice(0, 50).map((item) => [item.barcodeValue, item.source, item.stockUnitId, item.updatedAt])} /> : null}
    </div>
  )
}

function StickerBatchesSection() {
  const lookups = useJsonResource<LookupsResponse>("/internal/v1/stock/lookups")
  const list = useJsonResource<StickerBatchListResponse>("/internal/v1/stock/sticker-batches")
  const [goodsInwardId, setGoodsInwardId] = useState("")
  const [stockUnitIds, setStockUnitIds] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await requestJson<{ item: { id: string; itemCount: number } }>(
      "/internal/v1/stock/sticker-batches",
      {
        method: "POST",
        body: JSON.stringify({
          goodsInwardId,
          template: "25x50mm-default",
          stockUnitIds: stockUnitIds.split(",").map((item) => item.trim()).filter(Boolean),
        }),
      }
    )
    setMessage(`Sticker batch ${response.item.id} created with ${response.item.itemCount} items.`)
  }

  return (
    <div className="space-y-4">
      <SectionIntro title="Sticker batches" description="Generate sticker print batches for posted inward stock units and barcode-ready labelling." />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <form className="grid gap-3 md:grid-cols-3" onSubmit={handleCreate}>
            <select className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm" value={goodsInwardId} onChange={(event) => setGoodsInwardId(event.target.value)} required>
              <option value="">Select goods inward</option>
              {(lookups.data?.goodsInwardOptions ?? []).map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <Input placeholder="Optional stock unit ids, comma separated" value={stockUnitIds} onChange={(event) => setStockUnitIds(event.target.value)} />
            <Button type="submit">Create sticker batch</Button>
          </form>
        </CardContent>
      </Card>
      {message ? <StateCard message={message} /> : null}
      {list.data ? <DataTable headers={["Batch", "Goods inward", "Template", "Items", "Updated"]} rows={list.data.items.map((item) => [item.id, item.goodsInwardNumber, item.template, String(item.itemCount), item.updatedAt])} /> : null}
    </div>
  )
}

function SaleAllocationsSection() {
  const list = useJsonResource<SaleAllocationListResponse>("/internal/v1/stock/sale-allocations")
  const [form, setForm] = useState({ barcodeValue: "", warehouseId: "", salesVoucherNumber: "", salesItemIndex: "0", markAsSold: true })
  const [message, setMessage] = useState<string | null>(null)

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await requestJson<{ item: { id: string; status: string } }>(
      "/internal/v1/stock/sale-allocations",
      {
        method: "POST",
        body: JSON.stringify({
          barcodeValue: form.barcodeValue,
          warehouseId: form.warehouseId || null,
          salesVoucherId: null,
          salesVoucherNumber: form.salesVoucherNumber || null,
          salesItemIndex: Number(form.salesItemIndex),
          markAsSold: form.markAsSold,
        }),
      }
    )
    setMessage(`Sale allocation ${response.item.id} saved with status ${response.item.status}.`)
  }

  return (
    <div className="space-y-4">
      <SectionIntro title="Pre-sales and issue allocations" description="Reserve or sell scanned stock units into outbound issue and pre-sales flows." />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <form className="grid gap-3 md:grid-cols-3" onSubmit={handleCreate}>
            <Input placeholder="Barcode" value={form.barcodeValue} onChange={(event) => setForm({ ...form, barcodeValue: event.target.value })} required />
            <Input placeholder="Warehouse id" value={form.warehouseId} onChange={(event) => setForm({ ...form, warehouseId: event.target.value })} />
            <Input placeholder="Sales voucher number" value={form.salesVoucherNumber} onChange={(event) => setForm({ ...form, salesVoucherNumber: event.target.value })} />
            <Button type="submit">Allocate</Button>
          </form>
        </CardContent>
      </Card>
      {message ? <StateCard message={message} /> : null}
      {list.data ? <DataTable headers={["Barcode", "Product", "Warehouse", "Voucher", "Status", "Allocated"]} rows={list.data.items.map((item) => [item.barcodeValue, item.productId, item.warehouseId, item.salesVoucherNumber ?? "-", <Badge key={item.id} variant="outline">{item.status}</Badge>, item.allocatedAt])} /> : null}
    </div>
  )
}

function MovementsSection() {
  const { data, error, isLoading } = useJsonResource<MovementListResponse>("/internal/v1/stock/movements")
  if (isLoading) return <LoadingCard message="Loading stock movements..." />
  if (error || !data) return <StateCard message={error ?? "Stock movements are unavailable."} />
  return <DataTable headers={["Type", "Direction", "Product", "Warehouse", "Qty", "Reference", "Updated"]} rows={data.items.map((item) => [item.movementType, item.direction, item.productId, item.warehouseId, String(item.quantity), `${item.referenceType ?? "-"} ${item.referenceId ?? ""}`.trim(), item.updatedAt])} />
}

function AvailabilitySection() {
  const [state, setState] = useState<ResourceState<AvailabilityListResponse>>({ data: null, error: null, isLoading: true })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await requestJson<AvailabilityListResponse>("/internal/v1/stock/availability", { method: "POST", body: JSON.stringify({}) })
        if (!cancelled) setState({ data, error: null, isLoading: false })
      } catch (error) {
        if (!cancelled) setState({ data: null, error: error instanceof Error ? error.message : "Failed to load availability.", isLoading: false })
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  if (state.isLoading) return <LoadingCard message="Loading real-time stock..." />
  if (state.error || !state.data) return <StateCard message={state.error ?? "Availability is unavailable."} />
  return <DataTable headers={["Warehouse", "Product", "On hand", "Reserved", "Allocated", "In transit", "Available"]} rows={state.data.items.map((item) => [item.warehouseId, item.productId, String(item.onHandQuantity), String(item.reservedQuantity), String(item.allocatedQuantity), String(item.inTransitQuantity), String(item.availableQuantity)])} />
}

function ReconciliationSection() {
  const { data, error, isLoading } = useJsonResource<StockReconciliationResponse>("/internal/v1/stock/reconciliation")
  if (isLoading) return <LoadingCard message="Loading reconciliation..." />
  if (error || !data) return <StateCard message={error ?? "Reconciliation is unavailable."} />
  return <DataTable headers={["Warehouse", "Product", "Engine", "Core", "Mismatch"]} rows={data.items.map((item) => [item.warehouseId, item.productId, String(item.engineOnHandQuantity), String(item.coreOnHandQuantity), <Badge key={`${item.warehouseId}:${item.productId}`} variant={item.mismatchQuantity === 0 ? "secondary" : "outline"}>{item.mismatchQuantity}</Badge>])} />
}

function TransfersSection() {
  const list = useJsonResource<TransferListResponse>("/internal/v1/stock/transfers")
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    id: `transfer:${Date.now()}`,
    status: "requested",
    sourceWarehouseId: "",
    sourceLocationId: "",
    destinationWarehouseId: "",
    destinationLocationId: "",
    requestedAt: new Date().toISOString(),
    dispatchedAt: "",
    receivedAt: "",
    referenceType: "manual_transfer",
    referenceId: "",
    notes: "",
    productId: "",
    quantity: "1",
  })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await requestJson<{ item: StockTransfer }>("/internal/v1/stock/transfers", {
      method: "POST",
      body: JSON.stringify({
        id: form.id,
        status: form.status,
        sourceWarehouseId: form.sourceWarehouseId,
        sourceLocationId: form.sourceLocationId || null,
        destinationWarehouseId: form.destinationWarehouseId,
        destinationLocationId: form.destinationLocationId || null,
        requestedAt: form.requestedAt,
        dispatchedAt: form.dispatchedAt || null,
        receivedAt: form.receivedAt || null,
        referenceType: form.referenceType || null,
        referenceId: form.referenceId || null,
        notes: form.notes || null,
        lines: [{
          id: `${form.id}:line-1`,
          productId: form.productId,
          variantId: null,
          batchId: null,
          serialId: null,
          quantity: Number(form.quantity),
          sourceLocationId: form.sourceLocationId || null,
          destinationLocationId: form.destinationLocationId || null,
        }],
      }),
    })
    setMessage(`Transfer ${response.item.id} saved as ${response.item.status}. Use status in-transit for send and received for accept.`)
  }

  return (
    <div className="space-y-4">
      <SectionIntro title="Warehouse transfers" description="Manage send, in-transit, receive, and accept flows across warehouse and rack locations." />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <form className="grid gap-3 md:grid-cols-3" onSubmit={handleSubmit}>
            <Input placeholder="Transfer id" value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} />
            <select className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="in-transit">In transit</option>
              <option value="received">Received</option>
            </select>
            <Input placeholder="Product id" value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} required />
            <Input placeholder="Source warehouse" value={form.sourceWarehouseId} onChange={(event) => setForm({ ...form, sourceWarehouseId: event.target.value })} required />
            <Input placeholder="Destination warehouse" value={form.destinationWarehouseId} onChange={(event) => setForm({ ...form, destinationWarehouseId: event.target.value })} required />
            <Input placeholder="Quantity" type="number" min="0" step="0.01" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
            <Button type="submit">Save transfer</Button>
          </form>
        </CardContent>
      </Card>
      {message ? <StateCard message={message} /> : null}
      {list.data ? <DataTable headers={["Transfer", "From", "To", "Status", "Requested", "Lines"]} rows={list.data.items.map((item) => [item.id, item.sourceWarehouseId, item.destinationWarehouseId, <Badge key={item.id} variant="outline">{item.status}</Badge>, item.requestedAt, String(item.lines.length)])} /> : null}
    </div>
  )
}

function ReservationsSection() {
  const list = useJsonResource<ReservationListResponse>("/internal/v1/stock/reservations")
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    id: `reservation:${Date.now()}`,
    warehouseId: "",
    locationId: "",
    productId: "",
    referenceType: "pre_sale",
    referenceId: "",
    quantity: "1",
    consumedQuantity: "0",
    status: "active",
    reservedAt: new Date().toISOString(),
    expiresAt: "",
    releasedAt: "",
    notes: "",
  })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await requestJson<{ item: StockReservation }>("/internal/v1/stock/reservations", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        variantId: null,
        warehouseId: form.warehouseId || null,
        locationId: form.locationId || null,
        quantity: Number(form.quantity),
        consumedQuantity: Number(form.consumedQuantity),
        expiresAt: form.expiresAt || null,
        releasedAt: form.releasedAt || null,
        notes: form.notes || null,
      }),
    })
    setMessage(`Reservation ${response.item.id} saved as ${response.item.status}.`)
  }

  return (
    <div className="space-y-4">
      <SectionIntro title="Reservations" description="Reserve inventory for pre-sales, allocation, release, and partial or final consumption." />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <form className="grid gap-3 md:grid-cols-3" onSubmit={handleSubmit}>
            <Input placeholder="Reservation id" value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} />
            <Input placeholder="Product id" value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} required />
            <Input placeholder="Warehouse id" value={form.warehouseId} onChange={(event) => setForm({ ...form, warehouseId: event.target.value })} />
            <Input placeholder="Reference id" value={form.referenceId} onChange={(event) => setForm({ ...form, referenceId: event.target.value })} required />
            <Input placeholder="Quantity" type="number" min="0" step="0.01" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
            <select className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="active">Active</option>
              <option value="allocated">Allocated</option>
              <option value="partially-consumed">Partially consumed</option>
              <option value="consumed">Consumed</option>
              <option value="released">Released</option>
            </select>
            <Button type="submit">Save reservation</Button>
          </form>
        </CardContent>
      </Card>
      {message ? <StateCard message={message} /> : null}
      {list.data ? <DataTable headers={["Reservation", "Product", "Warehouse", "Status", "Qty", "Consumed"]} rows={list.data.items.map((item) => [item.id, item.productId, item.warehouseId ?? "-", <Badge key={item.id} variant="outline">{item.status}</Badge>, String(item.quantity), String(item.consumedQuantity)])} /> : null}
    </div>
  )
}

function VerificationSection() {
  const summary = useJsonResource<StockVerificationSummary>("/internal/v1/stock/verifications")
  if (summary.isLoading) return <LoadingCard message="Loading verification posture..." />
  if (summary.error || !summary.data) return <StateCard message={summary.error ?? "Verification summary is unavailable."} />
  return <MetricCards items={[
    { label: "Pending inward", value: String(summary.data.pendingVerificationCount) },
    { label: "Posted inward", value: String(summary.data.postedInwardCount) },
    { label: "Available units", value: String(summary.data.availableUnitCount) },
    { label: "Movement count", value: String(summary.data.movementCount) },
  ]} />
}

export function StockWorkspaceSection({
  purchaseReceiptId,
  goodsInwardId,
  sectionId,
}: {
  purchaseReceiptId?: string
  goodsInwardId?: string
  sectionId?: string
}) {
  const normalizedSectionId = useMemo(() => sectionId ?? "overview", [sectionId])

  switch (normalizedSectionId) {
    case "purchase-receipts":
      return <PurchaseReceiptsSection />
    case "purchase-receipts-show":
      return purchaseReceiptId ? <PurchaseReceiptShowSection receiptId={purchaseReceiptId} /> : null
    case "purchase-receipts-upsert":
      return <PurchaseReceiptUpsertSection receiptId={purchaseReceiptId} />
    case "goods-inward":
      return <GoodsInwardSection />
    case "goods-inward-show":
      return goodsInwardId ? <GoodsInwardShowSection goodsInwardId={goodsInwardId} /> : null
    case "goods-inward-upsert":
      return <GoodsInwardUpsertSection goodsInwardId={goodsInwardId} />
    case "stock-units":
      return <StockUnitsSection />
    case "barcodes":
      return <BarcodeSection />
    case "sticker-batches":
      return <StickerBatchesSection />
    case "sale-allocations":
      return <SaleAllocationsSection />
    case "movements":
      return <MovementsSection />
    case "availability":
      return <AvailabilitySection />
    case "reconciliation":
      return <ReconciliationSection />
    case "transfers":
      return <TransfersSection />
    case "reservations":
      return <ReservationsSection />
    case "verifications":
      return <VerificationSection />
    case "overview":
    default:
      return <OverviewSection />
  }
}
