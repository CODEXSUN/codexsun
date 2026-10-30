import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { TaskDatabase } from "./task.types.js";
export async function seedTaskPermissions(db: Kysely<TaskDatabase>) {
  const permissions = [
    "view",
    "view-all",
    "create",
    "update",
    "respond",
    "work",
    "closure.review"
  ] as const;
  for (const action of permissions) {
    const key = `crm.task.${action}`;
    await sql`INSERT INTO app_permissions (uuid, \`key\`, label, description, status, is_protected) VALUES (${stable(key)}, ${key}, ${key}, ${`Allows ${action} CRM tasks.`}, 'active', TRUE) ON DUPLICATE KEY UPDATE label=VALUES(label), description=VALUES(description), status='active'`.execute(
      db
    );
    const roles =
      action === "view" || action === "respond" || action === "work"
        ? ["admin", "super-admin", "manager", "team-head", "user"]
        : action === "view-all"
          ? ["admin", "super-admin"]
          : ["admin", "super-admin", "manager", "team-head"];
    for (const role of roles)
      await sql`INSERT INTO app_role_permissions (uuid, role_id, permission_id, status, is_protected) SELECT ${stable(`${role}:${key}`)}, r.id, p.id, 'active', TRUE FROM app_roles r JOIN app_permissions p ON p.\`key\`=${key} WHERE r.\`key\`=${role} ON DUPLICATE KEY UPDATE status='active'`.execute(
        db
      );
    if (action === "view-all")
      await sql`UPDATE app_role_permissions rp
        JOIN app_roles r ON r.id=rp.role_id
        JOIN app_permissions p ON p.id=rp.permission_id
        SET rp.status='inactive'
        WHERE p.\`key\`=${key} AND r.\`key\` NOT IN ('admin','super-admin')`.execute(db);
  }
}
function stable(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}
