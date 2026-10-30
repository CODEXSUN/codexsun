import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { FrappeDatabase } from "../connection/index.js";

// Retain source revisions separately from editable CRM fields, including unknown custom fields.
export class EnquirySourceRepository {
  constructor(private readonly database: Kysely<FrappeDatabase>) {}

  async retain(baseUrl: string, remoteName: string, document: unknown, enquiryId: number | null) {
    const origin = new URL(baseUrl).origin;
    const json = JSON.stringify(document);
    const key = createHash("sha256")
      .update(JSON.stringify([origin, remoteName, json]))
      .digest("hex");
    await this.database
      .insertInto("frappe_enquiry_snapshots")
      .values({
        source_key: key,
        base_url: origin,
        remote_name: remoteName,
        enquiry_id: enquiryId,
        document_json: json,
        created_at: new Date().toISOString().slice(0, 19).replace("T", " ")
      })
      .onDuplicateKeyUpdate({ enquiry_id: sql`COALESCE(VALUES(enquiry_id), enquiry_id)` })
      .execute();
  }

  revisions(enquiryId: number, page = 1) {
    return this.database
      .selectFrom("frappe_enquiry_snapshots")
      .select([
        "source_key as revision",
        "base_url as baseUrl",
        "remote_name as remoteName",
        "document_json as documentJson",
        "created_at as capturedAt"
      ])
      .where("enquiry_id", "=", enquiryId)
      .orderBy("id", "desc")
      .limit(50)
      .offset((page - 1) * 50)
      .execute();
  }

  async link(baseUrl: string, remoteName: string, enquiryId: number) {
    await this.database
      .updateTable("frappe_enquiry_snapshots")
      .set({ enquiry_id: enquiryId })
      .where("base_url", "=", new URL(baseUrl).origin)
      .where("remote_name", "=", remoteName)
      .where("enquiry_id", "is", null)
      .execute();
  }
}
