import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { MarketingDatabase } from "../../context.js";
export async function seedSubmission(database: Kysely<MarketingDatabase>) {
  for (const action of ["view", "create"]) {
    const key = "marketing.submission.record." + action;
    await sql`INSERT INTO app_permissions(uuid,\`key\`,label,description,status,is_protected) VALUES(${createHash("sha256").update(key).digest("hex").slice(0, 8)},${key},${key},${key},'active',TRUE) ON DUPLICATE KEY UPDATE label=VALUES(label)`.execute(
      database
    );
    await sql`INSERT INTO app_role_permissions(uuid,role_id,permission_id,status,is_protected) SELECT ${createHash(
      "sha256"
    )
      .update("admin:" + key)
      .digest("hex")
      .slice(
        0,
        8
      )},r.id,p.id,'active',TRUE FROM app_roles r JOIN app_permissions p ON p.\`key\`=${key} WHERE r.\`key\`='admin' ON DUPLICATE KEY UPDATE uuid=app_role_permissions.uuid`.execute(
      database
    );
  }
}
