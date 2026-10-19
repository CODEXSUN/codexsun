import { randomBytes } from "node:crypto";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import type { EnquiryPayload, EnquiryRecord } from "./enquiry.types.js";

export class EnquiryRepository {
  constructor(private readonly db: Kysely<SportsclubDatabase>) {}

  async list(): Promise<EnquiryRecord[]> {
    const rows = await this.db
      .selectFrom("sportsclub_enquiries")
      .selectAll()
      .where("status", "!=", "trash")
      .orderBy("created_at", "desc")
      .execute();
    return rows.map(toRecord);
  }

  async find(uuid: string): Promise<EnquiryRecord | undefined> {
    const row = await this.db
      .selectFrom("sportsclub_enquiries")
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    return row ? toRecord(row) : undefined;
  }

  async save(uuid: string | null, value: EnquiryPayload): Promise<EnquiryRecord> {
    const key = uuid ?? randomBytes(4).toString("hex");
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const data = {
      name: value.name.trim(),
      email: value.email.trim().toLowerCase(),
      phone: value.phone.trim(),
      interest: value.interest.trim(),
      message: value.message.trim(),
      consent: value.consent ? 1 : 0,
      status: value.status,
      notes: value.notes.trim(),
      revision: value.revision + 1,
      updated_at: now
    };

    const current = uuid ? await this.find(uuid) : undefined;

    if (current) {
      const result = await this.db
        .updateTable("sportsclub_enquiries")
        .set(data)
        .where("uuid", "=", uuid)
        .where("revision", "=", value.revision)
        .executeTakeFirst();

      if (!Number(result.numUpdatedRows)) {
        throw AppError.conflict("This enquiry changed. Reload before saving.");
      }
    } else {
      await this.db
        .insertInto("sportsclub_enquiries")
        .values({
          ...data,
          uuid: key,
          created_at: now
        })
        .execute();
    }

    return (await this.find(key))!;
  }

  async forceDelete(uuid: string): Promise<void> {
    const result = await this.db
      .deleteFrom("sportsclub_enquiries")
      .where("uuid", "=", uuid)
      .executeTakeFirst();

    if (!Number(result.numDeletedRows)) {
      throw AppError.notFound("Enquiry not found.");
    }
  }
}

function toRecord(row: {
  uuid: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  consent: number;
  status: "new" | "in_progress" | "resolved" | "spam" | "trash";
  notes: string;
  revision: number;
  created_at: string;
  updated_at: string;
}): EnquiryRecord {
  return {
    uuid: row.uuid,
    name: row.name,
    email: row.email,
    phone: row.phone,
    interest: row.interest,
    message: row.message,
    consent: Boolean(row.consent),
    status: row.status,
    notes: row.notes,
    revision: row.revision,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}
