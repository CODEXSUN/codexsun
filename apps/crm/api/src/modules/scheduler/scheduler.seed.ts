import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { SchedulerDatabase } from "./scheduler.types.js";

export async function seedSchedulerPermissions(database: Kysely<SchedulerDatabase>) {
  const permissions = ["view", "view-all", "create", "update-own", "manage"] as const;
  for (const action of permissions) {
    const key = `crm.schedule.${action}`;
    await sql`INSERT INTO app_permissions (uuid, \`key\`, label, description, status, is_protected)
      VALUES (${stable(key)}, ${key}, ${key}, ${`Allows ${action} CRM schedules.`}, 'active', TRUE)
      ON DUPLICATE KEY UPDATE label=VALUES(label), description=VALUES(description), status='active'`.execute(
      database
    );
    const roles =
      action === "view-all" || action === "manage"
        ? ["admin", "super-admin", "manager"]
        : ["admin", "super-admin", "manager", "user"];
    for (const role of roles) {
      await sql`INSERT INTO app_role_permissions (uuid, role_id, permission_id, status, is_protected)
        SELECT ${stable(`${role}:${key}`)}, role.id, permission.id, 'active', TRUE
        FROM app_roles role JOIN app_permissions permission ON permission.\`key\`=${key}
        WHERE role.\`key\`=${role}
        ON DUPLICATE KEY UPDATE status='active'`.execute(database);
    }
  }
}

function stable(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}
