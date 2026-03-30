import type { Kysely } from "kysely"

type DynamicDatabase = Record<string, Record<string, unknown>>

export function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}
