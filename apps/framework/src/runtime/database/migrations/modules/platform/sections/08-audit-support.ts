import type { DatabaseMigrationSection } from "../../../types.js"

export const auditSupportMigrationSection: DatabaseMigrationSection = {
  key: "platform-08-audit-support",
  order: 8,
  moduleKey: "platform",
  schemaSectionKey: "audit-support",
  name: "Audit And Support Operations",
  tableNames: [
    "audit_logs",
    "support_events",
    "system_notifications",
  ],
}
