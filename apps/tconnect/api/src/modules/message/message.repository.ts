import { sql, type Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectDatabase } from "../../context.js";
import type { MessageRecord } from "./message.types.js";
export class MessageRepository {
  constructor(private database: Kysely<TconnectDatabase>) {}
  async messages(uuid: string, before?: string) {
    let cursor: number | null = null;
    if (before) {
      const row = (
        await sql<{
          id: number;
        }>`SELECT id FROM tconnect_messages WHERE uuid=${before} AND conversation_uuid=${uuid}`.execute(
          this.database
        )
      ).rows[0];
      if (!row) throw AppError.notFound("Message cursor was not found.");
      cursor = row.id;
    }
    const rows = (
      await sql<MessageRecord>`SELECT uuid,body,sender_side AS senderSide,DATE_FORMAT(created_at,'%Y-%m-%dT%H:%i:%sZ') AS createdAt FROM tconnect_messages WHERE conversation_uuid=${uuid} AND (${cursor} IS NULL OR id<${cursor}) ORDER BY id DESC LIMIT 101`.execute(
        this.database
      )
    ).rows;
    const visible = rows.slice(0, 100).reverse();
    return { messages: visible, nextBefore: rows.length > 100 ? visible[0]!.uuid : null };
  }
  async countRecent(userUuid: string) {
    return Number(
      (
        await sql<{
          total: number;
        }>`SELECT COUNT(*) AS total FROM tconnect_messages WHERE sender_user_uuid=${userUuid} AND created_at>DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 HOUR)`.execute(
          this.database
        )
      ).rows[0]?.total ?? 0
    );
  }
  async send(uuid: string, userUuid: string, side: "buyer" | "seller", body: string) {
    const key = randomBytes(4).toString("hex");
    await sql`INSERT INTO tconnect_messages(uuid,conversation_uuid,sender_user_uuid,sender_side,body) VALUES (${key},${uuid},${userUuid},${side},${body})`.execute(
      this.database
    );
    return (
      await sql<MessageRecord>`SELECT uuid,body,sender_side AS senderSide,DATE_FORMAT(created_at,'%Y-%m-%dT%H:%i:%sZ') AS createdAt FROM tconnect_messages WHERE uuid=${key}`.execute(
        this.database
      )
    ).rows[0]!;
  }
}
