import type { Kysely } from "kysely"

import { getFirstJsonStorePayload } from "../../../framework/src/runtime/database/process/json-store.js"
import { bootstrapSnapshotSchema, type BootstrapSnapshot } from "../../shared/index.js"

import { cxappTableNames } from "../../database/table-names.js"

export async function getBootstrapSnapshot(
  database: Kysely<unknown>
): Promise<BootstrapSnapshot> {
  const snapshot = await getFirstJsonStorePayload<BootstrapSnapshot>(
    database,
    cxappTableNames.bootstrapSnapshots
  )

  if (!snapshot) {
    throw new Error("CxApp bootstrap snapshot has not been seeded yet.")
  }

  return bootstrapSnapshotSchema.parse(snapshot)
}
