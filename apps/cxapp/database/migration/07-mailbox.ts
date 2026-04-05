import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { asQueryDatabase } from "../../src/data/query-database.js"

import { cxappTableNames } from "../table-names.js"

export const coreMailboxMigration = defineDatabaseMigration({
  id: "cxapp:mailbox:07-mailbox",
  appId: "cxapp",
  moduleKey: "mailbox",
  name: "Create mailbox templates, messages, and recipients tables",
  order: 70,
  up: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    await queryDatabase.schema
      .createTable(cxappTableNames.mailboxTemplates)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("code", "varchar(191)", (column) => column.notNull().unique())
      .addColumn("name", "varchar(255)", (column) => column.notNull())
      .addColumn("category", "varchar(100)", (column) => column.notNull())
      .addColumn("description", "text")
      .addColumn("subject_template", "text", (column) => column.notNull())
      .addColumn("html_template", "text")
      .addColumn("text_template", "text")
      .addColumn("sample_data", "text")
      .addColumn("is_system", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("is_active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute()

    await queryDatabase.schema
      .createTable(cxappTableNames.mailboxMessages)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("template_id", "varchar(191)")
      .addColumn("template_code", "varchar(191)")
      .addColumn("reference_type", "varchar(100)")
      .addColumn("reference_id", "varchar(191)")
      .addColumn("subject", "text", (column) => column.notNull())
      .addColumn("html_body", "text")
      .addColumn("text_body", "text")
      .addColumn("from_email", "varchar(255)", (column) => column.notNull())
      .addColumn("from_name", "varchar(255)")
      .addColumn("reply_to", "varchar(255)")
      .addColumn("status", "varchar(64)", (column) => column.notNull())
      .addColumn("provider", "varchar(100)")
      .addColumn("provider_message_id", "varchar(191)")
      .addColumn("metadata", "text")
      .addColumn("error_message", "text")
      .addColumn("sent_at", "varchar(40)")
      .addColumn("failed_at", "varchar(40)")
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addForeignKeyConstraint(
        "cxapp_mailbox_messages_template_fk",
        ["template_id"],
        cxappTableNames.mailboxTemplates,
        ["id"]
      )
      .execute()

    await queryDatabase.schema
      .createTable(cxappTableNames.mailboxMessageRecipients)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("message_id", "varchar(191)", (column) => column.notNull())
      .addColumn("recipient_type", "varchar(32)", (column) => column.notNull())
      .addColumn("email", "varchar(255)", (column) => column.notNull())
      .addColumn("name", "varchar(255)")
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addForeignKeyConstraint(
        "cxapp_mailbox_message_recipients_message_fk",
        ["message_id"],
        cxappTableNames.mailboxMessages,
        ["id"]
      )
      .execute()
  },
})
