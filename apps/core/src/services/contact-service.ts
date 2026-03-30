import type { Kysely } from "kysely"

import { listJsonStorePayloads } from "../../../framework/src/runtime/database/process/json-store.js"
import {
  contactListResponseSchema,
  type Contact,
  type ContactListResponse,
} from "../../shared/index.js"

import { coreTableNames } from "../../database/table-names.js"

export async function listContacts(
  database: Kysely<unknown>
): Promise<ContactListResponse> {
  const items = await listJsonStorePayloads<Contact>(
    database,
    coreTableNames.contacts
  )

  return contactListResponseSchema.parse({
    items,
  })
}
