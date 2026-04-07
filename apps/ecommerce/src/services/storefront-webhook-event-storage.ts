import type { Kysely } from "kysely"

import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import {
  storefrontPaymentWebhookEventSchema,
  type StorefrontPaymentWebhookEvent,
} from "../../shared/index.js"

import { ecommerceTableNames } from "../../database/table-names.js"

export async function readStorefrontPaymentWebhookEvents(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<unknown>(
    database,
    ecommerceTableNames.paymentWebhookEvents
  )

  return items.map((item) => storefrontPaymentWebhookEventSchema.parse(item))
}

export async function writeStorefrontPaymentWebhookEvents(
  database: Kysely<unknown>,
  items: StorefrontPaymentWebhookEvent[]
) {
  await replaceJsonStoreRecords(
    database,
    ecommerceTableNames.paymentWebhookEvents,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "storefront-payment-webhook-event",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.receivedAt,
      updatedAt: item.updatedAt,
    }))
  )
}
