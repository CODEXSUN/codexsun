import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"
import { cxappTableNames } from "../table-names.js"

export const coreMailboxArchiveMigration = defineDatabaseMigration({
  id: "cxapp:mailbox:08-mailbox-archive",
  appId: "cxapp",
  moduleKey: "mailbox",
  name: "Add archive state to mailbox messages",
  order: 80,
  up: async ({ database }) => {
    await database.schema
      .alterTable(cxappTableNames.mailboxMessages)
      .addColumn("archived_at", "varchar(40)")
      .execute()
  },
})
