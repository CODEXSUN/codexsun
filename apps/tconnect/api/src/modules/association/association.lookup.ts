import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
export async function lockActiveAssociation(database: Kysely<TconnectDatabase>, uuid: string) {
  const found =
    await sql`SELECT id FROM tconnect_associations WHERE uuid=${uuid} AND status='active' FOR UPDATE`.execute(
      database
    );
  return found.rows.length > 0;
}
