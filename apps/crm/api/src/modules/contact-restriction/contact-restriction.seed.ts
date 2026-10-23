import { createHash } from "node:crypto";
import { sql } from "kysely";
import type { ContactPolicyContext } from "./contact-restriction.types.js";
export async function seedContactRestrictionPermissions(
  database: ContactPolicyContext["database"]
) {
  for (const action of ["check", "manage"]) {
    const key = "crm.contact-restrictions." + action;
    const stable = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 8);
    await sql`INSERT INTO app_permissions(uuid,\`key\`,label,description,status,is_protected) VALUES(${stable(key)},${key},${key},${key},'active',TRUE) ON DUPLICATE KEY UPDATE label=VALUES(label)`.execute(
      database
    );
    await sql`INSERT INTO app_role_permissions(uuid,role_id,permission_id,status,is_protected) SELECT ${stable("admin:" + key)},r.id,p.id,'active',TRUE FROM app_roles r JOIN app_permissions p ON p.\`key\`=${key} WHERE r.\`key\`='admin' ON DUPLICATE KEY UPDATE uuid=app_role_permissions.uuid`.execute(
      database
    );
  }
}
