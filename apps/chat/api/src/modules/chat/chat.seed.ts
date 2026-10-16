import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";

export async function seedChatModule(database: Kysely<Record<string, Record<string, unknown>>>) {
  const key = "chat.manage";
  await sql`
    INSERT INTO app_permissions (uuid, \`key\`, label, description, status, is_protected)
    VALUES (${stable(key)}, ${key}, 'Chat manage', 'Allows tenant team channels and messages.', 'active', TRUE)
    ON DUPLICATE KEY UPDATE label=VALUES(label), description=VALUES(description), status='active', is_protected=TRUE
  `.execute(database);
  await sql`
    INSERT INTO app_role_permissions (uuid, role_id, permission_id, status, is_protected)
    SELECT ${stable(`role-permission:admin:${key}`)}, role.id, permission.id, 'active', TRUE
    FROM app_roles role INNER JOIN app_permissions permission ON permission.\`key\`=${key}
    WHERE role.\`key\`='admin'
    ON DUPLICATE KEY UPDATE status='active', is_protected=TRUE
  `.execute(database);
  return { seeded: 1 };
}

function stable(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}
