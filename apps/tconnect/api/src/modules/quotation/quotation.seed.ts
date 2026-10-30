import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
export async function seedQuotationPermissions(database: Kysely<TconnectDatabase>) {
  const key = "tconnect.quotation.self";
  const uuid = createHash("sha256").update(key).digest("hex").slice(0, 8);
  await sql`INSERT INTO app_permissions(uuid,\`key\`,label,description,status,is_protected) VALUES (${uuid},${key},'TConnect participant quotations','Read buyer quotations or send and withdraw owned seller quotations','active',TRUE) ON DUPLICATE KEY UPDATE label=VALUES(label)`.execute(
    database
  );
}
