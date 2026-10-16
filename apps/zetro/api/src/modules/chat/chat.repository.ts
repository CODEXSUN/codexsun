import { randomBytes } from "node:crypto";
import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { ZetroConversation, ZetroDatabase, ZetroMessage } from "./chat.types.js";
import type { ZetroRecordCapability } from "./chat.patterns.js";

export type ZetroInteraction = {
  intent: ZetroDatabase["zetro_interaction_logs"]["intent"];
  skillKey: string | null;
  skillDecision: ZetroDatabase["zetro_interaction_logs"]["skill_decision"];
  rulesHash: string;
  patternUuid: string | null;
};

export type ZetroToolEvent = {
  capabilityKey: ZetroRecordCapability | "docs.developer.read";
  decision: "allowed" | "denied" | "failed";
  request: unknown;
  result?: unknown;
};

export class ZetroChatRepository {
  constructor(private readonly database: Kysely<ZetroDatabase>) {}

  async list(ownerEmail: string): Promise<ZetroConversation[]> {
    const rows = await this.database
      .selectFrom("zetro_conversations")
      .select(["id", "uuid", "title", "created_at", "updated_at"])
      .where("owner_email", "=", ownerEmail)
      .where("deleted_at", "is", null)
      .orderBy("updated_at", "desc")
      .limit(100)
      .execute();
    return rows.map(conversationRecord);
  }

  async get(id: number, ownerEmail: string): Promise<ZetroConversation> {
    const row = await this.database
      .selectFrom("zetro_conversations")
      .select(["id", "uuid", "title", "created_at", "updated_at"])
      .where("id", "=", id)
      .where("owner_email", "=", ownerEmail)
      .where("deleted_at", "is", null)
      .executeTakeFirst();
    if (!row) throw AppError.notFound("Conversation was not found.");
    return conversationRecord(row);
  }

  async messages(conversationId: number): Promise<ZetroMessage[]> {
    const rows = await this.database
      .selectFrom("zetro_messages")
      .select(["id", "uuid", "role", "content", "created_at"])
      .where("conversation_id", "=", conversationId)
      .orderBy("id", "asc")
      .execute();
    return rows.map((row) => ({
      id: row.id,
      uuid: row.uuid,
      role: row.role,
      content: row.content,
      createdAt: timestamp(row.created_at)
    }));
  }

  async allowedCapabilities(conversationId: number) {
    const [events, interactions] = await Promise.all([
      this.database
        .selectFrom("zetro_tool_events")
        .select("capability_key")
        .where("conversation_id", "=", conversationId)
        .where("decision", "=", "allowed")
        .distinct()
        .execute(),
      this.database
        .selectFrom("zetro_interaction_logs")
        .select("skill_key")
        .where("conversation_id", "=", conversationId)
        .where("skill_decision", "=", "allowed")
        .where("skill_key", "is not", null)
        .distinct()
        .execute()
    ]);
    return [
      ...new Set([
        ...events.map((event) => event.capability_key),
        ...interactions.flatMap((item) => (item.skill_key ? [item.skill_key] : []))
      ])
    ];
  }

  async recentUserPrompts(conversationId: number): Promise<string[]> {
    const rows = await this.database
      .selectFrom("zetro_messages")
      .select("content")
      .where("conversation_id", "=", conversationId)
      .where("role", "=", "user")
      .orderBy("id", "desc")
      .limit(6)
      .execute();
    return rows.reverse().map((row) => row.content.slice(0, 2_000));
  }

  async saveReply(
    ownerEmail: string,
    conversationId: number | null,
    prompt: string,
    reply: string,
    interaction: ZetroInteraction,
    event: ZetroToolEvent | null = null
  ) {
    return this.database.transaction().execute(async (transaction) => {
      let id = conversationId;
      if (id === null) {
        const created = await transaction
          .insertInto("zetro_conversations")
          .values({
            uuid: randomBytes(4).toString("hex"),
            owner_email: ownerEmail,
            title: prompt.slice(0, 100)
          })
          .executeTakeFirstOrThrow();
        id = Number(created.insertId);
      } else {
        const owner = await transaction
          .selectFrom("zetro_conversations")
          .select("id")
          .where("id", "=", id)
          .where("owner_email", "=", ownerEmail)
          .where("deleted_at", "is", null)
          .executeTakeFirst();
        if (!owner) throw AppError.notFound("Conversation was not found.");
      }
      await transaction
        .insertInto("zetro_messages")
        .values([
          {
            uuid: randomBytes(4).toString("hex"),
            conversation_id: id,
            role: "user",
            content: prompt
          },
          {
            uuid: randomBytes(4).toString("hex"),
            conversation_id: id,
            role: "assistant",
            content: reply
          }
        ])
        .execute();
      await transaction
        .insertInto("zetro_interaction_logs")
        .values({
          uuid: randomBytes(4).toString("hex"),
          conversation_id: id,
          actor_email: ownerEmail,
          prompt_text: prompt,
          response_text: reply,
          intent: interaction.intent,
          skill_key: interaction.skillKey,
          skill_decision: interaction.skillDecision,
          outcome: "completed",
          error_code: null,
          rules_hash: interaction.rulesHash,
          pattern_uuid: interaction.patternUuid
        })
        .execute();
      if (event) {
        await transaction
          .insertInto("zetro_tool_events")
          .values({
            uuid: randomBytes(4).toString("hex"),
            actor_email: ownerEmail,
            conversation_id: id,
            capability_key: event.capabilityKey,
            decision: event.decision,
            request_json: JSON.stringify(event.request),
            result_json: event.result === undefined ? null : JSON.stringify(event.result)
          })
          .execute();
        if (event.decision === "denied") {
          await transaction
            .insertInto("zetro_approval_requests")
            .values({
              uuid: randomBytes(4).toString("hex"),
              actor_email: ownerEmail,
              conversation_id: id,
              capability_key: event.capabilityKey,
              status: "pending",
              request_json: JSON.stringify(event.request),
              decided_by: null,
              decision_note: null,
              decided_at: null
            })
            .execute();
        }
      }
      await transaction
        .updateTable("zetro_conversations")
        .set({ updated_at: sql`CURRENT_TIMESTAMP` })
        .where("id", "=", id)
        .execute();
      return id;
    });
  }

  async logFailed(
    ownerEmail: string,
    prompt: string,
    interaction: ZetroInteraction,
    errorCode: string
  ) {
    await this.database
      .insertInto("zetro_interaction_logs")
      .values({
        uuid: randomBytes(4).toString("hex"),
        conversation_id: null,
        actor_email: ownerEmail,
        prompt_text: prompt,
        response_text: null,
        intent: interaction.intent,
        skill_key: interaction.skillKey,
        skill_decision: interaction.skillDecision,
        outcome: "failed",
        error_code: errorCode,
        rules_hash: interaction.rulesHash,
        pattern_uuid: interaction.patternUuid
      })
      .execute();
  }

  async delete(id: number, ownerEmail: string) {
    const result = await this.database
      .updateTable("zetro_conversations")
      .set({ deleted_at: sql`CURRENT_TIMESTAMP` })
      .where("id", "=", id)
      .where("owner_email", "=", ownerEmail)
      .where("deleted_at", "is", null)
      .executeTakeFirst();
    if (!Number(result.numUpdatedRows)) throw AppError.notFound("Conversation was not found.");
  }
}

function timestamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function conversationRecord(row: {
  id: number;
  uuid: string;
  title: string;
  created_at: string | Date;
  updated_at: string | Date;
}): ZetroConversation {
  return {
    id: row.id,
    uuid: row.uuid,
    title: row.title,
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at)
  };
}
