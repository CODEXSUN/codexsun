import { randomBytes } from "node:crypto";
import { sql, type Kysely } from "kysely";
import { getEcommerceDatabase, type EcommerceDatabase } from "../../database/ecommerce-database.js";
import type {
  StorefrontAnnouncementInput,
  StorefrontAnnouncementRecord
} from "./storefront-announcement.types.js";

type Row = Record<string, unknown>;

export class StorefrontAnnouncementRepository {
  async list() {
    const result = await sql<Row>`${selectAnnouncements()} ORDER BY announcement.id DESC`.execute(
      getEcommerceDatabase()
    );
    return result.rows.map(toRecord);
  }

  async find(id: number) {
    const result =
      await sql<Row>`${selectAnnouncements()} WHERE announcement.id=${id} LIMIT 1`.execute(
        getEcommerceDatabase()
      );
    return result.rows[0] ? toRecord(result.rows[0]) : null;
  }

  async active() {
    const result = await sql<Row>`${selectAnnouncements()}
      WHERE announcement.status='active' AND announcement.starts_at<=CURRENT_TIMESTAMP
      AND (announcement.ends_at IS NULL OR announcement.ends_at>CURRENT_TIMESTAMP)
      ORDER BY announcement.id DESC LIMIT 1`.execute(getEcommerceDatabase());
    return result.rows[0] ? toRecord(result.rows[0]) : null;
  }

  async create(input: Required<StorefrontAnnouncementInput>) {
    const database = getEcommerceDatabase();
    return database.transaction().execute(async (transaction) => {
      if (input.status === "active") await deactivateAll(transaction);
      const result = await sql`INSERT INTO ecommerce_storefront_announcements
        (event_key,message,display_duration_ms,starts_at,ends_at,status)
        VALUES (${eventKey()},${input.message},${input.displayDurationMs},${input.startsAt},${input.endsAt},${input.status})`.execute(
        transaction
      );
      return findWith(transaction, Number(result.insertId));
    });
  }

  async update(id: number, input: Required<StorefrontAnnouncementInput>) {
    const database = getEcommerceDatabase();
    return database.transaction().execute(async (transaction) => {
      if (input.status === "active") await deactivateAll(transaction);
      await sql`UPDATE ecommerce_storefront_announcements SET message=${input.message},
        display_duration_ms=${input.displayDurationMs},starts_at=${input.startsAt},ends_at=${input.endsAt},
        status=${input.status},updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(transaction);
      return findWith(transaction, id);
    });
  }

  async setActive(id: number, active: boolean) {
    const database = getEcommerceDatabase();
    return database.transaction().execute(async (transaction) => {
      if (active) await deactivateAll(transaction);
      await sql`UPDATE ecommerce_storefront_announcements SET status=${active ? "active" : "inactive"},
        updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(transaction);
      return findWith(transaction, id);
    });
  }

  async forceDelete(id: number) {
    const existing = await this.find(id);
    if (!existing) return null;
    await sql`DELETE FROM ecommerce_storefront_announcements WHERE id=${id}`.execute(
      getEcommerceDatabase()
    );
    return existing;
  }
}

function selectAnnouncements() {
  return sql`SELECT announcement.* FROM ecommerce_storefront_announcements announcement`;
}

async function findWith(database: Kysely<EcommerceDatabase>, id: number) {
  const result =
    await sql<Row>`${selectAnnouncements()} WHERE announcement.id=${id} LIMIT 1`.execute(database);
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}

function deactivateAll(database: Kysely<EcommerceDatabase>) {
  return sql`UPDATE ecommerce_storefront_announcements SET status='inactive',updated_at=CURRENT_TIMESTAMP
    WHERE status='active'`.execute(database);
}

function eventKey() {
  return `${Date.now().toString(36)}-${randomBytes(5).toString("hex")}`;
}

function toRecord(row: Row): StorefrontAnnouncementRecord {
  return {
    createdAt: dateText(row.created_at),
    displayDurationMs: Number(row.display_duration_ms),
    endsAt: row.ends_at ? dateText(row.ends_at) : null,
    eventKey: String(row.event_key),
    id: Number(row.id),
    message: String(row.message),
    startsAt: dateText(row.starts_at),
    status: row.status === "active" ? "active" : "inactive",
    updatedAt: dateText(row.updated_at)
  };
}

function dateText(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value);
}
