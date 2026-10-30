import { createHash } from "node:crypto";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { TenantDatabase } from "./database/schema.js";
import { ensurePortalRole } from "./modules/tenant-role/index.js";
import { grantPortalRolePermissions } from "./modules/tenant-role-permission/index.js";
import { selectUserRole } from "./modules/tenant-user-role/index.js";

export const SPORTSCLUB_STUDENT_PORTAL_ROLE = "portal.sportsclub-student";
export const SPORTSCLUB_MASTER_ROLE = "sportsclub.master";
export const SPORTSCLUB_ADMIN_ROLE = "sportsclub.admin";

export async function seedSportsclubPortalRole(database: Kysely<TenantDatabase>) {
  // Provision restricted student portal role
  const studentRoleId = await ensurePortalRole(
    database,
    SPORTSCLUB_STUDENT_PORTAL_ROLE,
    "Sports Club Student"
  );
  await grantPortalRolePermissions(database, studentRoleId, [
    "sportsclub.student.self",
    "sportsclub.attendance.self",
    "sportsclub.schedule.self",
    "sportsclub.fee.self",
    "sportsclub.certificate.self"
  ]);

  // Ensure Master role exists for staff assignment
  await ensureStaffRole(
    database,
    SPORTSCLUB_MASTER_ROLE,
    "Sports Club Master / Coach",
    "Sports club coach and master with batch instruction access. Assigned by authorized staff."
  );

  // Ensure Club Admin role exists for staff assignment
  await ensureStaffRole(
    database,
    SPORTSCLUB_ADMIN_ROLE,
    "Sports Club Admin",
    "Sports club administrator with full academy management access. Assigned by authorized staff."
  );
}

export async function ensureStaffRole(
  database: Kysely<TenantDatabase>,
  key: string,
  label: string,
  description: string
) {
  const uuid = createHash("sha256").update(key).digest("hex").slice(0, 8);
  await database
    .insertInto("app_roles")
    .values({
      uuid,
      key,
      label,
      description,
      status: "active",
      is_protected: true
    })
    .onDuplicateKeyUpdate({ label, description })
    .execute();

  const role = await database
    .selectFrom("app_roles")
    .select("id")
    .where("key", "=", key)
    .where("status", "=", "active")
    .executeTakeFirst();

  if (!role) throw AppError.forbidden(`Role "${key}" is inactive.`);
  return role.id;
}

/**
 * Assign Master or Club Admin role to a tenant user.
 * Explicitly requires authorized Platform staff caller.
 * Self-service public provisioning is forbidden.
 */
export async function assignSportsclubStaffRole(
  database: Kysely<TenantDatabase>,
  userId: number,
  roleKey: typeof SPORTSCLUB_MASTER_ROLE | typeof SPORTSCLUB_ADMIN_ROLE,
  actorIsPlatformStaff: boolean
) {
  if (!actorIsPlatformStaff) {
    throw AppError.forbidden(
      "Master and club admin role grants require authorized Platform staff."
    );
  }

  const role = await database
    .selectFrom("app_roles")
    .select("id")
    .where("key", "=", roleKey)
    .where("status", "=", "active")
    .executeTakeFirst();

  if (!role) {
    throw AppError.notFound(`Role "${roleKey}" not found or inactive.`);
  }

  await selectUserRole(database, userId, role.id);
  return { success: true, roleId: role.id };
}
