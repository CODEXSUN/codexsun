import {
  customerHelpdeskDetailListResponseSchema,
  customerHelpdeskListResponseSchema,
  type CustomerHelpdeskDetailListResponse,
  type CustomerHelpdeskListResponse,
} from "../../shared/index.js"

import { customerHelpdeskDetails } from "../data/ecommerce-seed.js"

export function listCustomerSummaries(): CustomerHelpdeskListResponse {
  return customerHelpdeskListResponseSchema.parse({
    items: customerHelpdeskDetails.map((detail) => ({
      id: detail.customer.id,
      displayName: detail.customer.displayName,
      email: detail.customer.email,
      phoneNumber: detail.customer.phoneNumber,
      isActive: detail.customer.isActive,
      deletionRequestedAt: detail.customer.deletionRequestedAt,
      purgeAfterAt: detail.customer.purgeAfterAt,
      orderCount: detail.customer.orderCount,
      totalSpent: detail.customer.totalSpent,
      lastOrderAt: detail.customer.lastOrderAt,
      lastOrderNumber: detail.customer.lastOrderNumber,
      lastOrderStatus: detail.customer.lastOrderStatus,
      defaultAddressSummary: detail.customer.defaultAddressSummary,
      issueCount: detail.issues.length,
    })),
  })
}

export function listCustomerDetails(): CustomerHelpdeskDetailListResponse {
  return customerHelpdeskDetailListResponseSchema.parse({
    items: customerHelpdeskDetails,
  })
}
