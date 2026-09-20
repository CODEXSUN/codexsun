import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type {
  ActivityEventInput,
  ActivityRecorder,
  CommandContext,
} from "../contracts/activity.contract.js";
import type { QcafeFoundationDatabase } from "../persistence/qcafe-foundation.database.js";

export class ActivityRepository implements ActivityRecorder {
  constructor(
    private readonly database: Kysely<QcafeFoundationDatabase>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async record(context: CommandContext, event: ActivityEventInput): Promise<void> {
    await this.database
      .insertInto("qcafe_activity_events")
      .values({
        actor_id: context.actorId,
        correlation_id: context.correlationId,
        event_type: event.eventType,
        id: randomUUID(),
        occurred_at: this.now().toISOString(),
        outcome: event.outcome ?? "success",
        payload_json: event.payload ? JSON.stringify(event.payload) : null,
        subject_id: event.subjectId,
        subject_type: event.subjectType,
      })
      .execute();
  }
}
