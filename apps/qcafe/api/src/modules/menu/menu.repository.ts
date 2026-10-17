import { randomBytes } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { QCafeDatabase } from "../../cloud/runtime.js";
import type { MenuItem, MenuSave } from "./menu.types.js";

export class MenuRepository {
  constructor(private readonly database: Kysely<QCafeDatabase>) {}

  async find(uuid: string) {
    const row = (
      await sql<MenuRow>`SELECT uuid,code,name,category,image_url AS imageUrl,special_prices AS specialPricesJson,price,status FROM qcafe_menu WHERE uuid=${uuid}`.execute(
        this.database
      )
    ).rows[0];
    return row ? menuItem(row) : null;
  }
  async list() {
    return (
      await sql<MenuRow>`SELECT uuid, code, name, category, image_url AS imageUrl, special_prices AS specialPricesJson, price, status
      FROM qcafe_menu ORDER BY category, name LIMIT 1000`.execute(this.database)
    ).rows.map(menuItem);
  }

  async importDemo(items: MenuSave[], actor: string) {
    return this.database.transaction().execute(async (db) => {
      let added = 0;
      for (const item of items) {
        const uuid = randomBytes(4).toString("hex");
        const result =
          await sql`INSERT IGNORE INTO qcafe_menu(uuid,code,name,category,image_url,special_prices,price,status,created_by,updated_by) VALUES(${uuid},${item.code},${item.name},${item.category},${item.imageUrl ?? ""},'[]',${item.price},'active',${actor},${actor})`.execute(
            db
          );
        if (Number(result.numAffectedRows)) {
          added++;
          await sql`INSERT INTO qcafe_menu_activity(uuid,menu_id,actor,action) SELECT ${randomBytes(4).toString("hex")},id,${actor},'demo-imported' FROM qcafe_menu WHERE uuid=${uuid}`.execute(
            db
          );
        }
      }
      return added;
    });
  }

  async save(input: MenuSave, actor: string, uuid?: string) {
    return this.database.transaction().execute(async (transaction) => {
      const key = uuid ?? randomBytes(4).toString("hex");
      if (uuid) {
        const result = await sql`UPDATE qcafe_menu SET code=${input.code}, name=${input.name},
          category=${input.category}, image_url=${input.imageUrl ?? ""}, special_prices=COALESCE(${input.specialPrices ? JSON.stringify(input.specialPrices) : null},special_prices), price=${input.price}, status=${input.status}, updated_by=${actor}
          WHERE uuid=${uuid}`.execute(transaction);
        if (!Number(result.numAffectedRows)) return null;
      } else {
        await sql`INSERT INTO qcafe_menu (uuid, code, name, category, image_url, special_prices, price, status, created_by, updated_by)
          VALUES (${key}, ${input.code}, ${input.name}, ${input.category}, ${input.imageUrl ?? ""}, ${JSON.stringify(input.specialPrices ?? [])}, ${input.price}, ${input.status}, ${actor}, ${actor})`.execute(
          transaction
        );
      }
      await sql`INSERT INTO qcafe_menu_activity (uuid, menu_id, actor, action)
        SELECT ${randomBytes(4).toString("hex")}, id, ${actor}, ${uuid ? "updated" : "created"}
        FROM qcafe_menu WHERE uuid=${key}`.execute(transaction);
      const row =
        (
          await sql<MenuRow>`SELECT uuid, code, name, category, image_url AS imageUrl, special_prices AS specialPricesJson, price, status
        FROM qcafe_menu WHERE uuid=${key}`.execute(transaction)
        ).rows[0] ?? null;
      return row ? menuItem(row) : null;
    });
  }
}

export async function lookupQCafeMenu(database: Kysely<QCafeDatabase>, uuids: string[]) {
  if (!uuids.length) return [];
  return (
    await sql<MenuRow>`SELECT uuid, code, name, category, image_url AS imageUrl, special_prices AS specialPricesJson, price, status
    FROM qcafe_menu WHERE uuid IN (${sql.join(uuids)}) AND status='active'`.execute(database)
  ).rows.map(menuItem);
}

type MenuRow = Omit<MenuItem, "specialPrices"> & {
  specialPricesJson: string | MenuItem["specialPrices"];
};
function menuItem(row: MenuRow): MenuItem {
  const { specialPricesJson, ...item } = row;
  return {
    ...item,
    specialPrices:
      typeof specialPricesJson === "string" ? JSON.parse(specialPricesJson) : specialPricesJson
  };
}
