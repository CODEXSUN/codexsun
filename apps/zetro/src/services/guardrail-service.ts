import type { Kysely } from "kysely"

import { zetroTableNames } from "../../database/table-names.js"
import type { ZetroGuardrailTemplate } from "../../shared/index.js"
import { listStorePayloads } from "../data/query-database.js"

export async function listZetroGuardrails(database: Kysely<unknown>) {
  return listStorePayloads<ZetroGuardrailTemplate>(
    database,
    zetroTableNames.guardrails
  )
}
