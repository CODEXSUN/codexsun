import type { Kysely } from "kysely"

import { listJsonStorePayloads } from "../../../framework/src/runtime/database/process/json-store.js"
import {
  commerceOrderListResponseSchema,
  commerceOrderWorkflowListResponseSchema,
  type CommerceOrderListResponse,
  type CommerceOrderWorkflow,
  type CommerceOrderWorkflowListResponse,
} from "../../shared/index.js"

import { ecommerceTableNames } from "../../database/table-names.js"

async function getOrderWorkflows(database: Kysely<unknown>) {
  return listJsonStorePayloads<CommerceOrderWorkflow>(
    database,
    ecommerceTableNames.orderWorkflows
  )
}

export async function listOrderSummaries(
  database: Kysely<unknown>
): Promise<CommerceOrderListResponse> {
  const workflows = await getOrderWorkflows(database)

  return commerceOrderListResponseSchema.parse({
    items: workflows.map((workflow) => ({
      orderId: workflow.order.id,
      orderNumber: workflow.order.orderNumber,
      customerName: `${workflow.order.firstName} ${workflow.order.lastName}`.trim(),
      status: workflow.events.at(-1)?.statusAfter ?? "placed",
      paymentStatus: workflow.order.paymentStatus,
      shipmentStatus: workflow.shipment?.status ?? null,
      invoiceStatus: workflow.invoice?.status ?? null,
      totalAmount: workflow.order.totalAmount,
      currency: workflow.order.currency,
      createdAt: workflow.order.createdAt,
    })),
  })
}

export async function listOrderWorkflows(
  database: Kysely<unknown>
): Promise<CommerceOrderWorkflowListResponse> {
  const items = await getOrderWorkflows(database)

  return commerceOrderWorkflowListResponseSchema.parse({
    items,
  })
}
