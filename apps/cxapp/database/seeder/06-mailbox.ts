import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { mailboxTemplates } from "../../src/data/auth-seed.js"
import { asQueryDatabase } from "../../src/data/query-database.js"

import { cxappTableNames } from "../table-names.js"

export const coreMailboxSeeder = defineDatabaseSeeder({
  id: "cxapp:mailbox:06-mailbox",
  appId: "cxapp",
  moduleKey: "mailbox",
  name: "Seed mailbox templates",
  order: 60,
  run: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    await queryDatabase.deleteFrom(cxappTableNames.mailboxMessageRecipients).execute()
    await queryDatabase.deleteFrom(cxappTableNames.mailboxMessages).execute()
    await queryDatabase.deleteFrom(cxappTableNames.mailboxTemplates).execute()

    await queryDatabase
      .insertInto(cxappTableNames.mailboxTemplates)
      .values(
        mailboxTemplates.map((template) => ({
          id: template.id,
          code: template.code,
          name: template.name,
          category: template.category,
          description: template.description,
          subject_template: template.subjectTemplate,
          html_template: template.htmlTemplate,
          text_template: template.textTemplate,
          sample_data: template.sampleData
            ? JSON.stringify(template.sampleData)
            : null,
          is_system: template.isSystem ? 1 : 0,
          is_active: template.isActive ? 1 : 0,
          created_at: template.createdAt,
          updated_at: template.updatedAt,
        }))
      )
      .execute()
  },
})
