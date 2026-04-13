import { crmFoundationMigration } from "./01-crm-foundation.js"
import { crmHeadersMigration } from "./02-crm-headers.js"
import { crmFollowUpMigration } from "./03-crm-follow-up.js"
import { crmTaskAssignmentsMigration } from "./04-crm-task-assignments.js"

export const crmDatabaseMigrations = [
  crmFoundationMigration,
  crmHeadersMigration,
  crmFollowUpMigration,
  crmTaskAssignmentsMigration,
]
