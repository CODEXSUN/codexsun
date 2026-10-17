import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
export async function seedMemberPermissions(database: Kysely<TconnectDatabase>) {
  for (const key of [
    "tconnect.company.self",
    "tconnect.product.self",
    "tconnect.inquiry.self",
    "tconnect.member.manage",
    "tconnect.product.view",
    "tconnect.product.manage"
  ]) {
    const uuid = createHash("sha256").update(key).digest("hex").slice(0, 8);
    await sql`INSERT INTO app_permissions (uuid,\`key\`,label,description,status,is_protected) VALUES (${uuid},${key},${key},${key},'active',TRUE) ON DUPLICATE KEY UPDATE label=VALUES(label)`.execute(
      database
    );
    if (key.endsWith(".self")) continue;
    const grant = createHash("sha256").update(`admin:${key}`).digest("hex").slice(0, 8);
    await sql`INSERT INTO app_role_permissions (uuid,role_id,permission_id,status,is_protected) SELECT ${grant},r.id,p.id,'active',TRUE FROM app_roles r INNER JOIN app_permissions p ON p.\`key\`=${key} WHERE r.\`key\`='admin' ON DUPLICATE KEY UPDATE app_role_permissions.uuid=app_role_permissions.uuid`.execute(
      database
    );
  }
}
