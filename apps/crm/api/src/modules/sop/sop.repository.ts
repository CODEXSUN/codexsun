import { randomUUID } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { SopInput, SopRecord, SelectedSopRow } from "./sop.types.js";
import type { SopItemDatabase } from "../sop-item/sop-item.types.js";
import { enqueueCrmFrappeSync } from "../frappe-sync/index.js";
import type { CrmFrappeSyncDatabase } from "../frappe-sync/index.js";

export class SopRepository {
  constructor(private readonly database: Kysely<SopItemDatabase>) {}

  async list(search = "") {
    let query = this.database.selectFrom("crm_sops").selectAll();
    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.where((eb) => eb.or([eb("code", "like", term), eb("title", "like", term)]));
    }
    return (await query.orderBy("title").execute()).map(mapSop);
  }

  async get(id: number) {
    const row = await this.database.selectFrom("crm_sops").selectAll().where("id", "=", id).executeTakeFirst();
    return row ? mapSop(row) : null;
  }

  async create(input: SopInput, actor: string, ownerUserId: number | null) {
    const result = await this.database.insertInto("crm_sops").values({
      uuid: randomUUID(), code: input.code, title: input.title, purpose: input.purpose,
      status: "active", owner_user_id: ownerUserId, created_by: actor, updated_by: actor
    }).executeTakeFirstOrThrow();
    return this.get(Number(result.insertId));
  }

  async update(id: number, input: SopInput, actor: string) {
    await this.database.transaction().execute(async (trx) => {
      await trx.updateTable("crm_sops").set({
        code: input.code, title: input.title, purpose: input.purpose, updated_by: actor,
        updated_at: sql`UTC_TIMESTAMP()`
      }).where("id", "=", id).execute();
      const publishedItems = await trx.selectFrom("crm_sop_items as item")
        .innerJoin("crm_sop_item_revisions as revision", "revision.sop_item_id", "item.id")
        .select("item.id").where("item.sop_id", "=", id).where("revision.status", "=", "published")
        .groupBy("item.id").execute();
      for (const item of publishedItems) await enqueueCrmFrappeSync(trx as unknown as Kysely<CrmFrappeSyncDatabase>, "sop-item", item.id, actor);
    });
    return this.get(id);
  }

  async setActive(id: number, active: boolean, actor: string) {
    await this.database.updateTable("crm_sops").set({
      status: active ? "active" : "inactive", updated_by: actor, updated_at: sql`UTC_TIMESTAMP()`
    }).where("id", "=", id).execute();
    return this.get(id);
  }

}

function mapSop(row: SelectedSopRow): SopRecord {
  return {
    id: row.id, uuid: row.uuid, code: row.code, title: row.title, purpose: row.purpose,
    status: row.status, ownerUserId: row.owner_user_id, createdBy: row.created_by,
    updatedBy: row.updated_by, createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}
