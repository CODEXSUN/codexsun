import { sql } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"
import { asQueryDatabase } from "../../src/data/query-database.js"
import { cxappTableNames } from "../table-names.js"

export const coreMailboxArchiveMigration = defineDatabaseMigration({
  id: "cxapp:mailbox:08-mailbox-archive",
  appId: "cxapp",
  moduleKey: "mailbox",
  name: "Add archive state to mailbox messages",
  order: 80,
  up: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    await sql`
      ALTER TABLE ${sql.table(cxappTableNames.mailboxMessages)}
      ADD COLUMN IF NOT EXISTS archived_at varchar(40) NULL
    `.execute(queryDatabase)
  },
})
