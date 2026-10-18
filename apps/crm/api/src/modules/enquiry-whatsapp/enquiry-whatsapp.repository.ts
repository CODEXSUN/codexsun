import { AppError } from "@codexsun/framework/errors";
import { sql } from "kysely";
import type { WhatsAppContext } from "./enquiry-whatsapp.types.js";
export class EnquiryWhatsAppRepository {
  constructor(private readonly context: WhatsAppContext) {}
  list(id: number) {
    return this.context.database
      .selectFrom("crm_enquiry_whatsapp_messages as w")
      .leftJoin("app_users as u", "u.email", "w.created_by")
      .select([
        "w.id",
        "w.enquiry_id as enquiryId",
        "w.recipient",
        "w.message",
        "w.created_by as createdBy",
        "u.name as userName",
        "w.created_at as createdAt"
      ])
      .where("w.enquiry_id", "=", id)
      .orderBy("w.id", "desc")
      .execute();
  }
  async create(enquiryId: number, recipient: string, message: string, requestId: string) {
    return this.context.database.transaction().execute(async (db) => {
      const inserted = await db
        .insertInto("crm_enquiry_whatsapp_messages")
        .values({
          enquiry_id: enquiryId,
          recipient,
          message,
          request_id: requestId,
          created_by: this.context.actorEmail,
          created_at: sql`UTC_TIMESTAMP()`
        })
        .ignore()
        .executeTakeFirstOrThrow();
      const saved = await db
        .selectFrom("crm_enquiry_whatsapp_messages")
        .selectAll()
        .where("created_by", "=", this.context.actorEmail)
        .where("request_id", "=", requestId)
        .executeTakeFirstOrThrow();
      if (
        saved.enquiry_id !== enquiryId ||
        saved.message !== message ||
        saved.recipient !== recipient
      )
        throw AppError.conflict("This WhatsApp retry key was already used.");
      if (inserted.numInsertedOrUpdatedRows === 1n)
        await this.context.recordHandoff?.(db, enquiryId, message);
      return saved;
    });
  }
}
