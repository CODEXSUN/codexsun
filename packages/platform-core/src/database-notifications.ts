import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";

export type NotificationSeverity = "info" | "success" | "warning" | "error";

export interface PlatformNotification {
  readonly id: string;
  readonly recipientId: string;
  readonly applicationId?: string;
  readonly title: string;
  readonly description?: string;
  readonly severity: NotificationSeverity;
  readonly sourceEventId?: string;
  readonly createdAt: string;
  readonly readAt?: string;
}

export interface DatabaseNotificationSchema {
  platform_notifications: {
    id: string;
    recipient_id: string;
    application_id: string | null;
    title: string;
    description: string | null;
    severity: NotificationSeverity;
    source_event_id: string | null;
    created_at: string;
    read_at: string | null;
  };
}

export interface NotificationListOptions {
  readonly applicationId?: string;
  readonly includeRead?: boolean;
  readonly limit?: number;
}

/** Stores user notifications with event-level idempotency. */
export class DatabaseNotificationStore {
  constructor(private readonly database: Kysely<DatabaseNotificationSchema>) {}

  async create(input: Omit<PlatformNotification, "id" | "createdAt" | "readAt"> & { createdAt?: string }): Promise<PlatformNotification> {
    validateNotification(input);
    const notification: PlatformNotification = {
      ...input,
      createdAt: input.createdAt ?? new Date().toISOString(),
      id: randomUUID(),
    };
    let insert = this.database
      .insertInto("platform_notifications")
      .values({
        id: notification.id,
        recipient_id: notification.recipientId,
        application_id: notification.applicationId ?? null,
        title: notification.title,
        description: notification.description ?? null,
        severity: notification.severity,
        source_event_id: notification.sourceEventId ?? null,
        created_at: notification.createdAt,
        read_at: null,
      });
    if (input.sourceEventId) {
      insert = insert.onConflict((conflict) => conflict.columns(["recipient_id", "source_event_id"]).doNothing());
    }
    const result = await insert.executeTakeFirst();
    if (input.sourceEventId && Number(result.numInsertedOrUpdatedRows) !== 1) {
      const existing = await this.database
        .selectFrom("platform_notifications")
        .selectAll()
        .where("recipient_id", "=", input.recipientId)
        .where("source_event_id", "=", input.sourceEventId)
        .executeTakeFirst();
      if (existing) return toNotification(existing);
    }
    return notification;
  }

  async list(recipientId: string, options: NotificationListOptions = {}): Promise<PlatformNotification[]> {
    if (!recipientId.trim()) throw new Error("Notification recipient is required.");
    const limit = options.limit ?? 50;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("Notification limit must be between one and one hundred.");
    let query = this.database
      .selectFrom("platform_notifications")
      .selectAll()
      .where("recipient_id", "=", recipientId)
      .orderBy("created_at", "desc")
      .limit(limit);
    if (options.applicationId) query = query.where("application_id", "=", options.applicationId);
    if (!options.includeRead) query = query.where("read_at", "is", null);
    return (await query.execute()).map(toNotification);
  }

  async markRead(recipientId: string, notificationId: string, readAt = new Date().toISOString()): Promise<boolean> {
    const result = await this.database
      .updateTable("platform_notifications")
      .set({ read_at: readAt })
      .where("id", "=", notificationId)
      .where("recipient_id", "=", recipientId)
      .where("read_at", "is", null)
      .executeTakeFirst();
    return Number(result.numUpdatedRows) === 1;
  }

  async markAllRead(recipientId: string, applicationId?: string, readAt = new Date().toISOString()): Promise<number> {
    let query = this.database
      .updateTable("platform_notifications")
      .set({ read_at: readAt })
      .where("recipient_id", "=", recipientId)
      .where("read_at", "is", null);
    if (applicationId) query = query.where("application_id", "=", applicationId);
    const result = await query.executeTakeFirst();
    return Number(result.numUpdatedRows);
  }
}

function validateNotification(input: Omit<PlatformNotification, "id" | "createdAt" | "readAt"> & { createdAt?: string }): void {
  if (!input.recipientId.trim()) throw new Error("Notification recipient is required.");
  if (!input.title.trim()) throw new Error("Notification title is required.");
  if (!input.applicationId?.trim() && input.applicationId !== undefined) throw new Error("Notification application is invalid.");
}

function toNotification(row: DatabaseNotificationSchema["platform_notifications"]): PlatformNotification {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    applicationId: row.application_id ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    severity: row.severity,
    sourceEventId: row.source_event_id ?? undefined,
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
  };
}
