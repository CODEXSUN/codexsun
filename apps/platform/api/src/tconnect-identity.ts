import type { Kysely } from "kysely";
import type { TenantDatabase } from "./database/schema.js";
import { ensurePortalRole } from "./modules/tenant-role/index.js";
import { grantPortalRolePermissions } from "./modules/tenant-role-permission/index.js";
export async function seedTconnectPortalRole(database: Kysely<TenantDatabase>) {
  const roleId = await ensurePortalRole(database, "portal.tconnect", "TConnect seller / member");
  await grantPortalRolePermissions(database, roleId, [
    "tconnect.company.self",
    "tconnect.product.self",
    "tconnect.inquiry.self",
    "tconnect.opportunity.self",
    "tconnect.conversation.self",
    "tconnect.message.self",
    "tconnect.quotation.self"
  ]);
  const buyerRole = await ensurePortalRole(database, "portal.tconnect-buyer", "TConnect buyer");
  await grantPortalRolePermissions(database, buyerRole, [
    "tconnect.buyer.self",
    "tconnect.requirement.self",
    "tconnect.catalog.self",
    "tconnect.sent.self",
    "tconnect.conversation.self",
    "tconnect.message.self",
    "tconnect.quotation.self"
  ]);
}
