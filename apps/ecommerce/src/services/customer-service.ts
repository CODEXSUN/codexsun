import type { Kysely } from "kysely"

import { listJsonStorePayloads } from "../../../framework/src/runtime/database/process/json-store.js"
import {
  customerHelpdeskDetailListResponseSchema,
  customerHelpdeskListResponseSchema,
  type CustomerHelpdeskDetail,
  type CustomerHelpdeskDetailListResponse,
  type CustomerHelpdeskListResponse,
} from "../../shared/index.js"

import { ecommerceTableNames } from "../../database/table-names.js"

async function getCustomerDetails(database: Kysely<unknown>) {
  return listJsonStorePayloads<CustomerHelpdeskDetail>(
    database,
    ecommerceTableNames.customerHelpdeskDetails
  )
}

export async function listCustomerSummaries(
  database: Kysely<unknown>
): Promise<CustomerHelpdeskListResponse> {
  const details = await getCustomerDetails(database)

  return customerHelpdeskListResponseSchema.parse({
    items: details.map((detail) => ({
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

export async function listCustomerDetails(
  database: Kysely<unknown>
): Promise<CustomerHelpdeskDetailListResponse> {
  const items = await getCustomerDetails(database)

  return customerHelpdeskDetailListResponseSchema.parse({
    items,
  })
}
