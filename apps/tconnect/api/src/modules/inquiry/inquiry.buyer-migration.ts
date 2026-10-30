import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
export async function migrateBuyerInquiries(database: Kysely<TconnectDatabase>) {
  await sql
    .raw(
      `ALTER TABLE tconnect_inquiries ADD COLUMN IF NOT EXISTS buyer_uuid CHAR(8) NULL, ADD COLUMN IF NOT EXISTS product_uuid CHAR(8) NULL, ADD COLUMN IF NOT EXISTS requirement_uuid CHAR(8) NULL, ADD INDEX IF NOT EXISTS idx_tconnect_buyer (buyer_uuid)`
    )
    .execute(database);
}
