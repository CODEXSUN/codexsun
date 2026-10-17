import type { Kysely } from "kysely";
import type { PublicationDatabase } from "./publication.types.js";
import type { DeliveryPayload } from "./publication.schema.js";
export class PublicationRepository {
  constructor(private readonly db: Kysely<PublicationDatabase>) {}
  async create(siteId: number, payload: DeliveryPayload, checksum: string, actor: string) {
    // A fresh sequence also permits intentional rollback to previously approved content.
    const createdAt = new Date().toISOString();
    const result = await this.db
      .insertInto("sites_publications")
      .values({
        site_id: siteId,
        checksum,
        payload_json: JSON.stringify(payload),
        actor,
        created_at: createdAt
      })
      .executeTakeFirstOrThrow();
    return { ...payload, sequence: Number(result.insertId), publishedAt: createdAt, checksum };
  }
  async exists(siteId: number) {
    return Boolean(
      await this.db
        .selectFrom("sites_publications")
        .select("id")
        .where("site_id", "=", siteId)
        .executeTakeFirst()
    );
  }
}
