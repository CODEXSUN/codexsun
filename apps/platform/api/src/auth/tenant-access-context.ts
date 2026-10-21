import type { FastifyRequest } from "fastify";
import { requireTenantAccess } from "@codexsun/framework/api";
import { AppError } from "@codexsun/framework/errors";
import { getTenantDatabaseByName } from "../database/tenant-database.js";
import { env } from "../env.js";
import type { Kysely } from "kysely";
import { crmRecordReadRoles } from "@codexsun/crm-api";

export function tenantAccessContext(request: FastifyRequest) {
  const header = request.headers["x-tenant-db"];
  const tenantDatabase = (Array.isArray(header) ? header[0] : header)?.trim();
  if (!tenantDatabase) throw AppError.validation("x-tenant-db is required.");
  const claims = requireTenantAccess({
    authorization: request.headers.authorization,
    secret: env.JWT_SECRET,
    tenantDatabase,
    tenantId: request.headers["x-tenant-id"]
  });
  const database = getTenantDatabaseByName(tenantDatabase);
  return {
    actorEmail: claims.email ?? "tenant@codexsun.app",
    authorize: (permission: string) =>
      authorizeTenantUser(database as never, claims.email ?? "", permission),
    database,
    tenantDatabase,
    tenantId: claims.tenantId ?? ""
  };
}

export async function authorizeTenantUser(
  database: Kysely<Record<string, Record<string, unknown>>>,
  email: string,
  permission: string
) {
  let query = database
    .selectFrom("app_users as user")
    .innerJoin("app_user_roles as userRole", "userRole.user_id", "user.id")
    .innerJoin("app_roles as role", "role.id", "userRole.role_id")
    .innerJoin("app_role_permissions as rolePermission", "rolePermission.role_id", "role.id")
    .innerJoin("app_permissions as permission", "permission.id", "rolePermission.permission_id")
    .select("permission.id")
    .where("user.email", "=", email)
    .where("user.status", "=", "active")
    .where("userRole.status", "=", "active")
    .where("role.status", "=", "active")
    .where("rolePermission.status", "=", "active")
    .where("permission.status", "=", "active")
    .where("permission.key", "=", permission);
  const roles = crmRecordReadRoles(permission);
  if (roles) query = query.where("role.key", "in", roles);
  const allowed = await query.executeTakeFirst();
  if (!allowed) throw AppError.forbidden(`Permission ${permission} is required.`);
}
