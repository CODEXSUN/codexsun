import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { TenantDatabase } from "../../database/schema.js";
export async function grantPortalRolePermissions(
  database: Kysely<TenantDatabase>,
  roleId: number,
  keys: readonly string[]
) {
  for (const key of keys) {
    if (!/^[a-z0-9-]+\.[a-z0-9-]+\.self$/.test(key))
      throw AppError.forbidden("Portal roles accept only ownership-scoped permissions.");
    const uuid = createHash("sha256").update(`portal:${roleId}:${key}`).digest("hex").slice(0, 8);
    await sql`INSERT INTO app_role_permissions (uuid,role_id,permission_id,status,is_protected)
    SELECT ${uuid},${roleId},p.id,'active',TRUE FROM app_permissions p WHERE p.\`key\`=${key} AND p.status='active'
    ON DUPLICATE KEY UPDATE app_role_permissions.uuid=app_role_permissions.uuid`.execute(database);
  }
}
