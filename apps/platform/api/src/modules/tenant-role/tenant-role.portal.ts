import { createHash } from "node:crypto";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { TenantDatabase } from "../../database/schema.js";
export async function ensurePortalRole(
  database: Kysely<TenantDatabase>,
  key: string,
  label: string
) {
  if (!/^portal\.[a-z0-9-]+$/.test(key)) throw AppError.validation("Invalid portal role key.");
  await database
    .insertInto("app_roles")
    .values({
      uuid: createHash("sha256").update(key).digest("hex").slice(0, 8),
      key,
      label,
      description: "Restricted public portal account. Access requires per-record ownership.",
      status: "active",
      is_protected: true
    })
    .onDuplicateKeyUpdate({ label })
    .execute();
  const role = await database
    .selectFrom("app_roles")
    .select("id")
    .where("key", "=", key)
    .where("status", "=", "active")
    .executeTakeFirst();
  if (!role) throw AppError.forbidden("The portal role is suspended.");
  return role.id;
}
