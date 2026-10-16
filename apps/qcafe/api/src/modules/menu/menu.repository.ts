import { randomBytes } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { QCafeDatabase } from "../../cloud/runtime.js";
import type { MenuItem, MenuSave } from "./menu.types.js";

export class MenuRepository {
  constructor(private readonly database: Kysely<QCafeDatabase>) {}

  async list() {
    return (
      await sql<MenuItem>`SELECT uuid, code, name, category, image_url AS imageUrl, price, status
      FROM qcafe_menu ORDER BY category, name LIMIT 1000`.execute(this.database)
    ).rows;
  }

  async save(input: MenuSave, actor: string, uuid?: string) {
    return this.database.transaction().execute(async (transaction) => {
      const key = uuid ?? randomBytes(4).toString("hex");
      if (uuid) {
        const result = await sql`UPDATE qcafe_menu SET code=${input.code}, name=${input.name},
          category=${input.category}, image_url=${input.imageUrl ?? ""}, price=${input.price}, status=${input.status}, updated_by=${actor}
          WHERE uuid=${uuid}`.execute(transaction);
        if (!Number(result.numAffectedRows)) return null;
      } else {
        await sql`INSERT INTO qcafe_menu (uuid, code, name, category, image_url, price, status, created_by, updated_by)
          VALUES (${key}, ${input.code}, ${input.name}, ${input.category}, ${input.imageUrl ?? ""}, ${input.price}, ${input.status}, ${actor}, ${actor})`.execute(
          transaction
        );
      }
      await sql`INSERT INTO qcafe_menu_activity (uuid, menu_id, actor, action)
        SELECT ${randomBytes(4).toString("hex")}, id, ${actor}, ${uuid ? "updated" : "created"}
        FROM qcafe_menu WHERE uuid=${key}`.execute(transaction);
      return (
        (
          await sql<MenuItem>`SELECT uuid, code, name, category, image_url AS imageUrl, price, status
        FROM qcafe_menu WHERE uuid=${key}`.execute(transaction)
        ).rows[0] ?? null
      );
    });
  }
}

export async function lookupQCafeMenu(database: Kysely<QCafeDatabase>, uuids: string[]) {
  if (!uuids.length) return [];
  return (
    await sql<MenuItem>`SELECT uuid, code, name, category, image_url AS imageUrl, price, status
    FROM qcafe_menu WHERE uuid IN (${sql.join(uuids)}) AND status='active'`.execute(database)
  ).rows;
}
