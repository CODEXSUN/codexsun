import type { DatabaseSync } from "node:sqlite";
import type { EnquiryInput, EnquiryQuery, EnquiryStatus } from "./enquiry.types.js";
import { enquiryRecordSchema, enquiryActivitySchema } from "./enquiry.schema.js";
import { AppError } from "@codexsun/framework/errors";
import { randomBytes } from "node:crypto";
export class EnquiryRepository {
  constructor(private readonly database: DatabaseSync) {}
  marketingPending(now: number) {
    return this.database
      .prepare(
        "SELECT e.reference,e.name,e.email,e.phone,e.message,e.consented_at FROM sites_marketing_outbox o JOIN sites_enquiries e ON e.reference=o.reference WHERE o.status='pending' AND o.attempts<8 AND o.available_at<=? AND e.deleted_at IS NULL ORDER BY e.created_at LIMIT 20"
      )
      .all(now)
      .map((row) => ({
        reference: String(row.reference),
        name: String(row.name),
        email: String(row.email),
        phone: String(row.phone),
        message: String(row.message),
        consented_at: String(row.consented_at)
      }));
  }
  marketingDelivered(reference: string, receipt: string) {
    this.database
      .prepare("UPDATE sites_marketing_outbox SET status='delivered',receipt=? WHERE reference=?")
      .run(receipt, reference);
  }
  marketingFailed(reference: string, now: number) {
    this.database
      .prepare(
        "UPDATE sites_marketing_outbox SET attempts=attempts+1,available_at=? WHERE reference=? AND status='pending'"
      )
      .run(now + 60000, reference);
  }
  secret() {
    this.database
      .prepare("INSERT OR IGNORE INTO sites_enquiry_settings VALUES('rate-secret',?)")
      .run(randomBytes(32).toString("hex"));
    return this.database
      .prepare("SELECT value FROM sites_enquiry_settings WHERE key='rate-secret'")
      .get()!.value as string;
  }
  find(key: string) {
    return this.database
      .prepare("SELECT reference,payload_hash FROM sites_enquiries WHERE request_key=?")
      .get(key);
  }
  receive(
    input: EnquiryInput,
    key: string,
    hash: string,
    rateKey: string,
    reference: string,
    now: number
  ) {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database
        .prepare(
          "DELETE FROM sites_enquiry_activity WHERE reference IN (SELECT reference FROM sites_enquiries WHERE created_at < ?)"
        )
        .run(now - 90 * 86400000);
      this.database
        .prepare(
          "DELETE FROM sites_marketing_outbox WHERE reference IN (SELECT reference FROM sites_enquiries WHERE created_at < ?)"
        )
        .run(now - 90 * 86400000);
      this.database
        .prepare("DELETE FROM sites_enquiries WHERE created_at < ?")
        .run(now - 90 * 86400000);
      this.database.prepare("DELETE FROM sites_enquiry_limits WHERE expires_at < ?").run(now);
      const rate = this.database
        .prepare("SELECT hits FROM sites_enquiry_limits WHERE key=?")
        .get(rateKey);
      if (rate && Number(rate.hits) >= 10)
        throw Object.assign(new Error("Too many enquiries. Please try again later."), {
          status: 429
        });
      this.database
        .prepare(
          "INSERT INTO sites_enquiry_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1"
        )
        .run(rateKey, now + 3600000);
      this.database
        .prepare(
          "INSERT INTO sites_enquiries(reference,request_key,payload_hash,name,email,company,phone,message,consented_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)"
        )
        .run(
          reference,
          key,
          hash,
          input.name,
          input.email,
          input.company,
          input.phone,
          input.message,
          new Date(now).toISOString(),
          now
        );
      this.database
        .prepare("INSERT INTO sites_enquiry_activity(reference,action,actor,at) VALUES(?,?,?,?)")
        .run(reference, "received", "website", new Date(now).toISOString());
      this.database.exec("COMMIT");
      return { reference, received: true };
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
  list(limit = 50) {
    return this.database
      .prepare(
        "SELECT reference,name,email,company,phone,message,consented_at FROM sites_enquiries WHERE created_at>=? AND deleted_at IS NULL ORDER BY id DESC LIMIT ?"
      )
      .all(Date.now() - 90 * 86400000, Math.min(100, Math.max(1, limit)));
  }

  inbox(query: EnquiryQuery) {
    const since = Date.now() - 90 * 86400000;
    const search = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
    const where = `created_at>=? AND deleted_at IS ${query.trash === "yes" ? "NOT " : ""}NULL AND (?='all' OR status=?) AND (name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\' OR message LIKE ? ESCAPE '\\')`;
    const args = [since, query.status, query.status, search, search, search, search];
    const total = Number(
      this.database
        .prepare(`SELECT COUNT(*) AS total FROM sites_enquiries WHERE ${where}`)
        .get(...args)!.total
    );
    const records = this.database
      .prepare(
        `SELECT ${projection} FROM sites_enquiries WHERE ${where} ORDER BY id DESC LIMIT 20 OFFSET ?`
      )
      .all(...args, (query.page - 1) * 20)
      .map((row) => enquiryRecordSchema.parse(row));
    return { records, total, page: query.page, pageSize: 20 };
  }
  show(reference: string) {
    const row = this.database
      .prepare(`SELECT ${projection} FROM sites_enquiries WHERE reference=? AND created_at>=?`)
      .get(reference, Date.now() - 90 * 86400000);
    if (!row) throw AppError.notFound("Enquiry not found for this client.");
    return {
      ...enquiryRecordSchema.parse(row),
      activity: this.database
        .prepare(
          "SELECT action,actor,at FROM sites_enquiry_activity WHERE reference=? ORDER BY id DESC LIMIT 100"
        )
        .all(reference)
        .map((row) => enquiryActivitySchema.parse(row))
    };
  }
  transaction<T>(work: () => T): T {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const result = work();
      this.database.exec("COMMIT");
      return result;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
  writeChange(
    reference: string,
    status: EnquiryStatus,
    deletedAt: string | null,
    actor: string,
    action: string,
    at: string
  ) {
    this.database
      .prepare(
        "UPDATE sites_enquiries SET status=?,deleted_at=?,revision=revision+1,updated_at=? WHERE reference=?"
      )
      .run(status, deletedAt, at, reference);
    this.database
      .prepare("INSERT INTO sites_enquiry_activity(reference,action,actor,at) VALUES(?,?,?,?)")
      .run(reference, action, actor, at);
  }
  expire(now = Date.now()) {
    this.transaction(() => {
      this.database
        .prepare(
          "DELETE FROM sites_marketing_outbox WHERE reference IN (SELECT reference FROM sites_enquiries WHERE created_at < ?)"
        )
        .run(now - 90 * 86400000);
      this.database
        .prepare(
          "DELETE FROM sites_enquiry_activity WHERE reference IN (SELECT reference FROM sites_enquiries WHERE created_at < ?)"
        )
        .run(now - 90 * 86400000);
      this.database
        .prepare("DELETE FROM sites_enquiries WHERE created_at < ?")
        .run(now - 90 * 86400000);
      this.database.prepare("DELETE FROM sites_enquiry_limits WHERE expires_at < ?").run(now);
    });
  }
}
const projection =
  "reference,name,email,company,phone,message,consented_at AS consentedAt,created_at AS createdAt,COALESCE(NULLIF(updated_at,''),consented_at) AS updatedAt,status,revision,deleted_at AS deletedAt";
