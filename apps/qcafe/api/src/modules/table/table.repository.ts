import { randomBytes } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { QCafeDatabase } from "../../cloud/runtime.js";
import type { CafeTable, CafeTableSave } from "./table.types.js";
export class TableRepository {
  constructor(private readonly database: Kysely<QCafeDatabase>) {}
  async list() {
    return (
      await sql<CafeTable>`SELECT uuid,name,seats,status FROM qcafe_table ORDER BY name`.execute(
        this.database
      )
    ).rows;
  }
  async save(input: CafeTableSave, actor: string, uuid?: string) {
    return this.database.transaction().execute(async (db) => {
      const key = uuid ?? randomBytes(4).toString("hex");
      if (uuid) {
        const current = await lockQCafeTable(db, uuid);
        if (!current) return null;
        // Capacity cannot change while orders reference seats. Deactivation only blocks new assignments.
        if (current.seats !== input.seats) {
          const occupied =
            await sql`SELECT order_uuid FROM qcafe_order_seats WHERE table_uuid=${uuid} LIMIT 1`.execute(
              db
            );
          if (occupied.rows.length)
            throw new Error("Cannot change capacity while seats are occupied.");
        }
        await sql`UPDATE qcafe_table SET name=${input.name}, seats=${input.seats},status=${input.status},updated_by=${actor} WHERE uuid=${uuid}`.execute(
          db
        );
      } else
        await sql`INSERT INTO qcafe_table(uuid,name,seats,status,created_by,updated_by) VALUES(${key},${input.name},${input.seats},${input.status},${actor},${actor})`.execute(
          db
        );
      await sql`INSERT INTO qcafe_table_activity(uuid,table_uuid,actor,action) VALUES(${randomBytes(4).toString("hex")},${key},${actor},${uuid ? "updated" : "created"})`.execute(
        db
      );
      return (
        await sql<CafeTable>`SELECT uuid,name,seats,status FROM qcafe_table WHERE uuid=${key}`.execute(
          db
        )
      ).rows[0]!;
    });
  }
}
export async function lockQCafeTable(database: Kysely<QCafeDatabase>, uuid: string) {
  return (
    (
      await sql<CafeTable>`SELECT uuid,name,seats,status FROM qcafe_table WHERE uuid=${uuid} FOR UPDATE`.execute(
        database
      )
    ).rows[0] ?? null
  );
}
