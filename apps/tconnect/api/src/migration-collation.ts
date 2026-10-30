import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "./context.js";

export async function referenceCollation(database: Kysely<TconnectDatabase>, table: string) {
  const result = await sql<{ charset: string | null; collation: string | null }>`
    SELECT CHARACTER_SET_NAME AS charset, COLLATION_NAME AS collation
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table} AND COLUMN_NAME = 'uuid'
  `.execute(database);
  const column = result.rows[0];
  if (
    !column?.charset ||
    !column.collation ||
    !/^[a-z0-9_]+$/i.test(column.charset) ||
    !/^[a-z0-9_]+$/i.test(column.collation)
  ) {
    throw new Error(
      `Tconnect migration cannot resolve the character set and collation of ${table}.uuid.`
    );
  }
  return `CHARACTER SET ${column.charset} COLLATE ${column.collation}`;
}
