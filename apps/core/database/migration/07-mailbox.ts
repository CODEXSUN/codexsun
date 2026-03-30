import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { asQueryDatabase } from "../../src/data/query-database.js"

import { coreTableNames } from "../table-names.js"

export const coreMailboxMigration = defineDatabaseMigration({
  id: "core:mailbox:07-mailbox",
  appId: "core",
  moduleKey: "mailbox",
  name: "Create mailbox templates, messages, and recipients tables",
  order: 70,
  up: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    await queryDatabase.schema
      .createTable(coreTableNames.mailboxTemplates)
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("code", "text", (column) => column.notNull().unique())
      .addColumn("name", "text", (column) => column.notNull())
      .addColumn("category", "text", (column) => column.notNull())
      .addColumn("description", "text")
      .addColumn("subject_template", "text", (column) => column.notNull())
      .addColumn("html_template", "text")
      .addColumn("text_template", "text")
      .addColumn("sample_data", "text")
      .addColumn("is_system", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("is_active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "text", (column) => column.notNull())
      .addColumn("updated_at", "text", (column) => column.notNull())
      .execute()

    await queryDatabase.schema
      .createTable(coreTableNames.mailboxMessages)
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("template_id", "text")
      .addColumn("template_code", "text")
      .addColumn("reference_type", "text")
      .addColumn("reference_id", "text")
      .addColumn("subject", "text", (column) => column.notNull())
      .addColumn("html_body", "text")
      .addColumn("text_body", "text")
      .addColumn("from_email", "text", (column) => column.notNull())
      .addColumn("from_name", "text")
      .addColumn("reply_to", "text")
      .addColumn("status", "text", (column) => column.notNull())
      .addColumn("provider", "text")
      .addColumn("provider_message_id", "text")
      .addColumn("metadata", "text")
      .addColumn("error_message", "text")
      .addColumn("sent_at", "text")
      .addColumn("failed_at", "text")
      .addColumn("created_at", "text", (column) => column.notNull())
      .addColumn("updated_at", "text", (column) => column.notNull())
      .addForeignKeyConstraint(
        "mailbox_messages_template_fk",
        ["template_id"],
        coreTableNames.mailboxTemplates,
        ["id"]
      )
      .execute()

    await queryDatabase.schema
      .createTable(coreTableNames.mailboxMessageRecipients)
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("message_id", "text", (column) => column.notNull())
      .addColumn("recipient_type", "text", (column) => column.notNull())
      .addColumn("email", "text", (column) => column.notNull())
      .addColumn("name", "text")
      .addColumn("created_at", "text", (column) => column.notNull())
      .addForeignKeyConstraint(
        "mailbox_message_recipients_message_fk",
        ["message_id"],
        coreTableNames.mailboxMessages,
        ["id"]
      )
      .execute()
  },
})
