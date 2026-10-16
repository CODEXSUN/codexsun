import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { RequirementsDatabase } from "./requirements.types.js";
export async function seedRequirementsPermissions(database: Kysely<RequirementsDatabase>) {
  for (const action of ["view", "create", "update", "approve"]) {
    const key = `codexsun.requirements.${action}`;
    await sql`INSERT INTO app_permissions (uuid, \`key\`,label,description,status,is_protected) VALUES (${stable(key)},${key},${"Requirements " + action},${"Allows requirement " + action + "."},'active',TRUE) ON DUPLICATE KEY UPDATE label=VALUES(label),description=VALUES(description)`.execute(
      database
    );
    await sql`INSERT INTO app_role_permissions (uuid,role_id,permission_id,status,is_protected) SELECT ${stable("role-permission:admin:" + key)},role.id,permission.id,'active',TRUE FROM app_roles role INNER JOIN app_permissions permission ON permission.\`key\`=${key} WHERE role.\`key\`='admin' ON DUPLICATE KEY UPDATE uuid=app_role_permissions.uuid`.execute(
      database
    );
  }
}
function stable(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}
