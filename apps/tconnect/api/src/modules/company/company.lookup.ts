import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
export async function lockActiveCompany(database: Kysely<TconnectDatabase>, uuid: string) {
  const found =
    await sql`SELECT id FROM tconnect_companies WHERE uuid=${uuid} AND status='active' FOR UPDATE`.execute(
      database
    );
  return found.rows.length > 0;
}

export async function lockCompany(database: Kysely<TconnectDatabase>, uuid: string) {
  return (
    (await sql`SELECT id FROM tconnect_companies WHERE uuid=${uuid} FOR UPDATE`.execute(database))
      .rows.length > 0
  );
}
