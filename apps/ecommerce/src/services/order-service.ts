import {
  commerceOrderListResponseSchema,
  commerceOrderWorkflowListResponseSchema,
  type CommerceOrderListResponse,
  type CommerceOrderWorkflowListResponse,
} from "../../shared/index.js"

import { orderWorkflows } from "../data/ecommerce-seed.js"

export function listOrderSummaries(): CommerceOrderListResponse {
  return commerceOrderListResponseSchema.parse({
    items: orderWorkflows.map((workflow) => ({
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

export function listOrderWorkflows(): CommerceOrderWorkflowListResponse {
  return commerceOrderWorkflowListResponseSchema.parse({
    items: orderWorkflows,
  })
}
