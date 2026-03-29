import type { DatabaseFoundationSection } from "../types.js"

export const auditSupportSection: DatabaseFoundationSection = {
  key: "audit-support",
  order: 8,
  name: "Audit And Support Operations",
  purpose: "Captures audit logs, support-safe events, and system notifications.",
  tables: [
    { key: "audit_logs", name: "audit_logs", purpose: "Operational audit log records." },
    { key: "support_events", name: "support_events", purpose: "Support-facing event records." },
    { key: "system_notifications", name: "system_notifications", purpose: "System notification records." },
  ],
}
