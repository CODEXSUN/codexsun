import { sql, type Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

async function tryAddColumn(
  database: Kysely<unknown>,
  columnName: string,
  columnType: string
) {
  try {
    await asQueryDatabase(database).schema
      .alterTable(billingTableNames.voucherHeaders)
      .addColumn(columnName, sql.raw(columnType))
      .execute()
  } catch {
    // Existing installs may already carry the column from an updated base migration.
  }
}

export const billingAccountingControlsMigration = defineDatabaseMigration({
  id: "billing:vouchers:07-accounting-controls",
  appId: "billing",
  moduleKey: "voucher-headers",
  name: "Add billing accounting-control dimensions and review metadata",
  order: 70,
  up: async ({ database }) => {
    await tryAddColumn(database, "dimension_branch", "varchar(191)")
    await tryAddColumn(database, "dimension_project", "varchar(191)")
    await tryAddColumn(database, "dimension_cost_center", "varchar(191)")
    await tryAddColumn(database, "review_approval_policy", "varchar(40)")
    await tryAddColumn(database, "review_requested_by_user_id", "varchar(191)")
    await tryAddColumn(database, "review_maker_checker_required", "integer")
  },
})
