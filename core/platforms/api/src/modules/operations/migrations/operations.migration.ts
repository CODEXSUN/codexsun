import type { Kysely } from "kysely";
import type { OperationsDatabase } from "../operations.database.js";

export const operationsMigration = {
  id: "operations.001",
  owner: "core/platforms/api/modules/operations",
  async apply(database: Kysely<OperationsDatabase>): Promise<void> {
    await database.schema
      .createTable("platform_outbox_messages")
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("owner", "text", (column) => column.notNull())
      .addColumn("event_type", "text", (column) => column.notNull())
      .addColumn("payload", "text", (column) => column.notNull())
      .addColumn("correlation_id", "text")
      .addColumn("state", "text", (column) => column.notNull())
      .addColumn("attempts", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("available_at", "text", (column) => column.notNull())
      .addColumn("locked_at", "text")
      .addColumn("completed_at", "text")
      .addColumn("failure_code", "text")
      .execute();
    await database.schema
      .createTable("platform_event_consumptions")
      .ifNotExists()
      .addColumn("consumer_id", "text", (column) => column.notNull())
      .addColumn("message_id", "text", (column) => column.notNull())
      .addColumn("completed_at", "text", (column) => column.notNull())
      .addPrimaryKeyConstraint("platform_event_consumptions_key", ["consumer_id", "message_id"])
      .execute();
    await database.schema
      .createTable("platform_jobs")
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("owner", "text", (column) => column.notNull())
      .addColumn("name", "text", (column) => column.notNull())
      .addColumn("payload", "text", (column) => column.notNull())
      .addColumn("correlation_id", "text")
      .addColumn("state", "text", (column) => column.notNull())
      .addColumn("attempts", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("available_at", "text", (column) => column.notNull())
      .addColumn("locked_at", "text")
      .addColumn("completed_at", "text")
      .addColumn("failure_code", "text")
      .execute();
    await database.schema
      .createTable("platform_notifications")
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("recipient_id", "text", (column) => column.notNull())
      .addColumn("application_id", "text")
      .addColumn("title", "text", (column) => column.notNull())
      .addColumn("description", "text")
      .addColumn("severity", "text", (column) => column.notNull())
      .addColumn("source_event_id", "text")
      .addColumn("created_at", "text", (column) => column.notNull())
      .addColumn("read_at", "text")
      .addUniqueConstraint("platform_notifications_event_key", ["recipient_id", "source_event_id"])
      .execute();
    await database.schema
      .createTable("platform_audit_entries")
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("module", "text", (column) => column.notNull())
      .addColumn("action", "text", (column) => column.notNull())
      .addColumn("actor_id", "text")
      .addColumn("target", "text", (column) => column.notNull())
      .addColumn("outcome", "text", (column) => column.notNull())
      .addColumn("occurred_at", "text", (column) => column.notNull())
      .addColumn("correlation_id", "text", (column) => column.notNull())
      .execute();
  },
};
