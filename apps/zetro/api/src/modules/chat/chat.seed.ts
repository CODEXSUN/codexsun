import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { ZetroDatabase } from "./chat.types.js";
import { ZETRO_QUERY_PATTERNS, ZETRO_REVIEW_PATTERNS } from "./chat.patterns.js";

export async function seedZetroChatPermissions(database: Kysely<ZetroDatabase>) {
  await seedZetroQueryPatterns(database);
  const key = "zetro.chat.use";
  const permissionUuid = createHash("sha256").update(key).digest("hex").slice(0, 8);
  await sql`INSERT INTO app_permissions (uuid, \`key\`, label, description, status, is_protected)
    VALUES (${permissionUuid}, ${key}, 'Use Zetro', 'Create and read your own Zetro chats.', 'active', TRUE)
    ON DUPLICATE KEY UPDATE label=VALUES(label), description=VALUES(description), status='active'`.execute(
    database
  );
  for (const roleKey of ["admin", "super-admin", "user"]) {
    const roleUuid = createHash("sha256")
      .update(`role-permission:${roleKey}:${key}`)
      .digest("hex")
      .slice(0, 8);
    await sql`INSERT INTO app_role_permissions (uuid, role_id, permission_id, status, is_protected)
      SELECT ${roleUuid}, role.id, permission.id, 'active', TRUE
      FROM app_roles role INNER JOIN app_permissions permission ON permission.\`key\`=${key}
      WHERE role.\`key\`=${roleKey}
      ON DUPLICATE KEY UPDATE status='active'`.execute(database);
  }
}

async function seedZetroQueryPatterns(database: Kysely<ZetroDatabase>) {
  for (const pattern of ZETRO_QUERY_PATTERNS) {
    await sql`INSERT IGNORE INTO zetro_query_patterns
      (uuid, serial_no, intent_key, question_pattern, query_pattern, limitation, extra, status)
      VALUES (${pattern.uuid}, ${pattern.serialNo}, ${pattern.intent}, ${pattern.questionPattern},
        ${pattern.queryPattern}, ${pattern.limitation}, ${pattern.extra}, 'active')`.execute(
      database
    );
    const recorded = await sql<{
      serial_no: number;
      query_pattern: string;
      status: string;
    }>`SELECT serial_no, query_pattern, status
      FROM zetro_query_patterns WHERE uuid=${pattern.uuid} LIMIT 1`.execute(database);
    if (
      Number(recorded.rows[0]?.serial_no) !== pattern.serialNo ||
      recorded.rows[0]?.query_pattern !== pattern.queryPattern ||
      recorded.rows[0]?.status !== "active"
    ) {
      throw new Error(`Zetro catalog entry #${pattern.serialNo} conflicts with a tenant pattern.`);
    }
    await sql`UPDATE zetro_query_patterns SET intent_key=${pattern.intent}
      WHERE uuid=${pattern.uuid} AND (intent_key IS NULL OR intent_key<>${pattern.intent})`.execute(
      database
    );
  }
  for (const pattern of ZETRO_REVIEW_PATTERNS) {
    await sql`INSERT IGNORE INTO zetro_query_patterns
      (uuid, serial_no, intent_key, question_pattern, query_pattern, limitation, extra, status)
      VALUES (${pattern.uuid}, ${pattern.serialNo}, NULL, ${pattern.questionPattern},
        ${pattern.queryPattern}, ${pattern.limitation}, ${pattern.extra}, 'draft')`.execute(
      database
    );
    const recorded = await sql<{ uuid: string; query_pattern: string; status: string }>`
      SELECT uuid, query_pattern, status FROM zetro_query_patterns
      WHERE serial_no=${pattern.serialNo} LIMIT 1`.execute(database);
    if (
      recorded.rows[0]?.uuid !== pattern.uuid ||
      recorded.rows[0]?.query_pattern !== pattern.queryPattern ||
      recorded.rows[0]?.status !== "draft"
    ) {
      throw new Error(`Zetro review pattern #${pattern.serialNo} conflicts with a tenant pattern.`);
    }
  }
}
