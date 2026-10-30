import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
export async function seedCredentialPermissions(database: Kysely<TconnectDatabase>) {
  for (const operation of ["view", "manage"]) {
    const key = `tconnect.credential.${operation}`;
    const uuid = createHash("sha256").update(key).digest("hex").slice(0, 8);
    await sql`INSERT INTO app_permissions(uuid,\`key\`,label,description,status,is_protected) VALUES (${uuid},${key},${`TConnect credential ${operation}`},'Staff review of company credential evidence','active',TRUE) ON DUPLICATE KEY UPDATE label=VALUES(label)`.execute(
      database
    );
  }
}
