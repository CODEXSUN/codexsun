import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import { listProducts } from "../../../core/src/services/product-service.js"
import type { StorefrontOrder } from "../../../ecommerce/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  frappeSalesOrderSyncRecordSchema,
  type FrappeSettings,
  type FrappeSalesOrderSyncLine,
  type FrappeSalesOrderSyncRecord,
} from "../../shared/index.js"

import { frappeTableNames } from "../../database/table-names.js"
import type { FrappeEnvConfig } from "../config/frappe.js"
import {
  createFrappeConnection,
  readFrappeErrorText,
} from "./connection.js"
import { recordFrappeConnectorEvent } from "./observability-service.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"
import { readStoredFrappeSettings } from "./settings-service.js"

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }

  return date.toISOString().slice(0, 10)
}

function deriveDeliveryDate(order: StorefrontOrder) {
  const etaDays =
    order.shippingMethod?.etaMaxDays != null
      ? order.shippingMethod.etaMaxDays + (order.shippingZone?.etaAdditionalDays ?? 0)
      : order.fulfillmentMethod === "store_pickup"
        ? 1
        : 3
  const deliveryDate = new Date(order.createdAt)
  deliveryDate.setUTCDate(deliveryDate.getUTCDate() + Math.max(1, etaDays))

  return formatDate(deliveryDate.toISOString())
}

function deriveCustomerCode(order: StorefrontOrder) {
  if (order.customerAccountId) {
    return `ECOM-CUSTOMER-${order.customerAccountId.replace(/[^A-Za-z0-9]+/g, "-").toUpperCase()}`
  }

  return `ECOM-CONTACT-${order.coreContactId.replace(/[^A-Za-z0-9]+/g, "-").toUpperCase()}`
}

async function readSalesOrderSyncs(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    frappeTableNames.salesOrderSyncs,
    frappeSalesOrderSyncRecordSchema
  )

  return items.sort((left, right) =>
    right.lastAttemptedAt.localeCompare(left.lastAttemptedAt)
  )
}

async function writeSalesOrderSyncs(
  database: Kysely<unknown>,
  records: FrappeSalesOrderSyncRecord[]
) {
  await replaceStorePayloads(
    database,
    frappeTableNames.salesOrderSyncs,
    records.map((record, index) => ({
      id: record.id,
      moduleKey: "sales-orders",
      sortOrder: index + 1,
      payload: record,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }))
  )
}

async function resolveSalesOrderLines(
  database: Kysely<unknown>,
  order: StorefrontOrder
): Promise<FrappeSalesOrderSyncLine[]> {
  const products = await listProducts(database)

  return order.items.map((item) => {
    const product = products.items.find((candidate) => candidate.id === item.productId)
    const itemCode = product?.code?.trim() || product?.sku?.trim() || ""

    if (!itemCode) {
      throw new ApplicationError(
        "Paid storefront order cannot be pushed because one or more items are missing an ERP item code mapping.",
        {
          orderId: order.id,
          productId: item.productId,
        },
        409
      )
    }

    return {
      itemCode,
      itemName: item.name,
      quantity: item.quantity,
      rate: item.unitPrice,
      amount: item.lineTotal,
    }
  })
}

function buildSalesOrderRequest(
  settings: FrappeSettings,
  order: StorefrontOrder,
  itemLines: FrappeSalesOrderSyncLine[]
) {
  return {
    doctype: "Sales Order",
    customer: deriveCustomerCode(order),
    customer_name: order.shippingAddress.fullName,
    company: settings.defaultCompany,
    currency: order.currency,
    transaction_date: formatDate(order.createdAt),
    delivery_date: deriveDeliveryDate(order),
    set_warehouse: settings.defaultWarehouse || undefined,
    po_no: order.orderNumber,
    po_date: formatDate(order.createdAt),
    remarks: [
      `Storefront order ${order.orderNumber}`,
      `Payment ${order.providerPaymentId ?? "manual"}`,
      order.notes?.trim() ? `Notes: ${order.notes.trim()}` : "",
      order.discountAmount > 0 ? `Discount carried locally: ${order.discountAmount.toFixed(2)} ${order.currency}` : "",
      order.shippingAmount > 0 ? `Shipping carried locally: ${order.shippingAmount.toFixed(2)} ${order.currency}` : "",
      order.handlingAmount > 0 ? `Handling carried locally: ${order.handlingAmount.toFixed(2)} ${order.currency}` : "",
    ]
      .filter(Boolean)
      .join(" | "),
    items: itemLines.map((item) => ({
      item_code: item.itemCode,
      item_name: item.itemName,
      qty: item.quantity,
      rate: item.rate,
      amount: item.amount,
      delivery_date: deriveDeliveryDate(order),
      warehouse: settings.defaultWarehouse || undefined,
    })),
  }
}

function buildFailureRecord(input: {
  existingRecord: FrappeSalesOrderSyncRecord | null
  order: StorefrontOrder
  itemLines: FrappeSalesOrderSyncLine[]
  source: string
  customerCode: string
  company: string
  attemptedAt: string
  failureMessage: string
}) {
  const createdAt = input.existingRecord?.createdAt ?? input.attemptedAt

  return frappeSalesOrderSyncRecordSchema.parse({
    id: input.existingRecord?.id ?? `frappe-sales-order-sync:${randomUUID()}`,
    storefrontOrderId: input.order.id,
    storefrontOrderNumber: input.order.orderNumber,
    providerPaymentId: input.order.providerPaymentId,
    source: input.source,
    status: "failed",
    erpSalesOrderId: input.existingRecord?.erpSalesOrderId ?? null,
    erpSalesOrderName: input.existingRecord?.erpSalesOrderName ?? null,
    customerCode: input.customerCode,
    customerName: input.order.shippingAddress.fullName,
    company: input.company,
    currency: input.order.currency,
    grandTotal: input.order.totalAmount,
    itemLines: input.itemLines,
    attemptCount: (input.existingRecord?.attemptCount ?? 0) + 1,
    lastAttemptedAt: input.attemptedAt,
    syncedAt: null,
    failureMessage: input.failureMessage,
    createdAt,
    updatedAt: input.attemptedAt,
  })
}

function buildSuccessRecord(input: {
  existingRecord: FrappeSalesOrderSyncRecord | null
  order: StorefrontOrder
  itemLines: FrappeSalesOrderSyncLine[]
  source: string
  customerCode: string
  company: string
  attemptedAt: string
  erpSalesOrderName: string
}) {
  const createdAt = input.existingRecord?.createdAt ?? input.attemptedAt

  return frappeSalesOrderSyncRecordSchema.parse({
    id: input.existingRecord?.id ?? `frappe-sales-order-sync:${randomUUID()}`,
    storefrontOrderId: input.order.id,
    storefrontOrderNumber: input.order.orderNumber,
    providerPaymentId: input.order.providerPaymentId,
    source: input.source,
    status: "synced",
    erpSalesOrderId: input.erpSalesOrderName,
    erpSalesOrderName: input.erpSalesOrderName,
    customerCode: input.customerCode,
    customerName: input.order.shippingAddress.fullName,
    company: input.company,
    currency: input.order.currency,
    grandTotal: input.order.totalAmount,
    itemLines: input.itemLines,
    attemptCount: (input.existingRecord?.attemptCount ?? 0) + 1,
    lastAttemptedAt: input.attemptedAt,
    syncedAt: input.attemptedAt,
    failureMessage: null,
    createdAt,
    updatedAt: input.attemptedAt,
  })
}

export async function pushStorefrontOrderToFrappeSalesOrder(
  database: Kysely<unknown>,
  order: StorefrontOrder,
  input?: {
    source?: "checkout_verify" | "razorpay_webhook" | "payment_reconcile" | "manual_replay"
    config?: FrappeEnvConfig
  }
) {
  const source = input?.source ?? "checkout_verify"

  if (order.paymentStatus !== "paid") {
    throw new ApplicationError(
      "Only paid storefront orders can be pushed into ERPNext Sales Order.",
      { orderId: order.id, paymentStatus: order.paymentStatus },
      409
    )
  }

  const [settings, syncs] = await Promise.all([
    readStoredFrappeSettings(database, { config: input?.config }),
    readSalesOrderSyncs(database),
  ])
  const existingRecord = syncs.find((item) => item.storefrontOrderId === order.id) ?? null

  if (
    existingRecord?.status === "synced" &&
    existingRecord.providerPaymentId === order.providerPaymentId
  ) {
    return existingRecord
  }

  const attemptedAt = new Date().toISOString()
  const customerCode = deriveCustomerCode(order)
  const company = settings.defaultCompany.trim()
  let itemLines: FrappeSalesOrderSyncLine[]

  const persistRecord = async (record: FrappeSalesOrderSyncRecord) => {
    await writeSalesOrderSyncs(database, [
      record,
      ...syncs.filter((item) => item.id !== record.id),
    ])

    return record
  }

  try {
    itemLines = await resolveSalesOrderLines(database, order)
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unable to resolve ERP item-code mapping."
    const record = await persistRecord(
      buildFailureRecord({
        existingRecord,
        order,
        itemLines: [
          {
            itemCode: "unresolved",
            itemName: order.items[0]?.name ?? "Unknown item",
            quantity: order.items[0]?.quantity ?? 1,
            rate: order.items[0]?.unitPrice ?? 0,
            amount: order.items[0]?.lineTotal ?? 0,
          },
        ],
        source,
        customerCode,
        company,
        attemptedAt,
        failureMessage: detail,
      })
    )

    await recordFrappeConnectorEvent(database, null, {
      action: "sales_orders.push",
      status: "failure",
      message: `Sales Order push failed for storefront order ${order.orderNumber} because ERP item mapping is incomplete.`,
      referenceId: order.id,
      details: {
        source,
        detail,
      },
    })

    return record
  }

  if (!settings.enabled || !settings.isConfigured) {
    const record = await persistRecord(
      buildFailureRecord({
        existingRecord,
        order,
        itemLines,
        source,
        customerCode,
        company,
        attemptedAt,
        failureMessage: "ERPNext connector is not enabled and configured for Sales Order push.",
      })
    )

    await recordFrappeConnectorEvent(database, null, {
      action: "sales_orders.push",
      status: "failure",
      message: `Sales Order push failed for storefront order ${order.orderNumber} because the ERPNext connector is not ready.`,
      referenceId: order.id,
      details: {
        source,
      },
    })

    return record
  }

  if (settings.lastVerificationStatus !== "passed") {
    const record = await persistRecord(
      buildFailureRecord({
        existingRecord,
        order,
        itemLines,
        source,
        customerCode,
        company,
        attemptedAt,
        failureMessage: "ERPNext connector must be verified successfully before pushing Sales Orders.",
      })
    )

    await recordFrappeConnectorEvent(database, null, {
      action: "sales_orders.push",
      status: "failure",
      message: `Sales Order push failed for storefront order ${order.orderNumber} because the ERPNext connector is not verified.`,
      referenceId: order.id,
      details: {
        source,
      },
    })

    return record
  }

  const requestBody = buildSalesOrderRequest(settings, order, itemLines)
  const connection = createFrappeConnection(input?.config)

  try {
    const { response } = await connection.request({
      path: "/api/resource/Sales Order",
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const detail = await readFrappeErrorText(response)
      const record = await persistRecord(
        buildFailureRecord({
          existingRecord,
          order,
          itemLines,
          source,
          customerCode,
          company,
          attemptedAt,
          failureMessage: detail,
        })
      )

      await recordFrappeConnectorEvent(database, null, {
        action: "sales_orders.push",
        status: "failure",
        message: `ERPNext rejected Sales Order push for storefront order ${order.orderNumber}.`,
        referenceId: order.id,
        details: {
          source,
          detail,
        },
      })

      return record
    }

    const payload = (await response.json().catch(() => null)) as
      | { data?: { name?: unknown } }
      | null
    const erpSalesOrderName =
      typeof payload?.data?.name === "string" && payload.data.name.trim()
        ? payload.data.name.trim()
        : `sales-order:${order.orderNumber}`
    const record = await persistRecord(
      buildSuccessRecord({
        existingRecord,
        order,
        itemLines,
        source,
        customerCode,
        company,
        attemptedAt,
        erpSalesOrderName,
      })
    )

    await recordFrappeConnectorEvent(database, null, {
      action: "sales_orders.push",
      status: "success",
      message: `Sales Order ${erpSalesOrderName} was pushed for storefront order ${order.orderNumber}.`,
      referenceId: order.id,
      details: {
        source,
        erpSalesOrderName,
      },
    })

    return record
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown ERPNext Sales Order push error."
    const record = await persistRecord(
      buildFailureRecord({
        existingRecord,
        order,
        itemLines,
        source,
        customerCode,
        company,
        attemptedAt,
        failureMessage: detail,
      })
    )

    await recordFrappeConnectorEvent(database, null, {
      action: "sales_orders.push",
      status: "failure",
      message: `Sales Order push failed for storefront order ${order.orderNumber}.`,
      referenceId: order.id,
      details: {
        source,
        detail,
      },
    })

    return record
  }
}
