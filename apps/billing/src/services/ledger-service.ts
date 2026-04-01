import type { Kysely } from "kysely"

import {
  billingLedgerListResponseSchema,
  billingLedgerSchema,
} from "../../shared/index.js"

import { billingTableNames } from "../../database/table-names.js"

import { listStorePayloads } from "./store.js"

export async function listBillingLedgers(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    billingTableNames.ledgers,
    billingLedgerSchema
  )

  return billingLedgerListResponseSchema.parse({
    items,
  })
}
