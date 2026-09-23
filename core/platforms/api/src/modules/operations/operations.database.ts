import type { DatabaseJobQueueSchema, DatabaseNotificationSchema, DatabaseOutboxSchema } from "@codexsun/platform-core";

export interface OperationsDatabase extends DatabaseJobQueueSchema, DatabaseNotificationSchema, DatabaseOutboxSchema {
  platform_audit_entries: {
    id: string;
    module: string;
    action: string;
    actor_id: string | null;
    target: string;
    outcome: "success" | "failure";
    occurred_at: string;
    correlation_id: string;
  };
}
