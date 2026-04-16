import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"
import { cxappTableNames } from "../table-names.js"

export const coreMailboxArchiveMigration = defineDatabaseMigration({
  id: "cxapp:mailbox:08-mailbox-archive",
  appId: "cxapp",
  moduleKey: "mailbox",
  name: "Add archive state to mailbox messages",
  order: 80,
  up: async ({ database }) => {
    try {
      await database.schema
        .alterTable(cxappTableNames.mailboxMessages)
        .addColumn("archived_at", "varchar(40)")
        .execute()
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
      if (
        message.includes("duplicate column") ||
        message.includes("duplicate column name") ||
        message.includes("already exists")
      ) {
        return
      }

      throw error
    }
  },
})
