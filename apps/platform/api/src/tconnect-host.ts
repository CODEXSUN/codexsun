import type { FastifyInstance } from "fastify";
import { createHmac } from "node:crypto";
import { env } from "./env.js";
import { createPortalUser } from "./modules/tenant-user/index.js";
import { registerTconnect, resolveMemberScope, resolveBuyerScope } from "@codexsun/tconnect-api";
import { AppError } from "@codexsun/framework/errors";
import { tenantAccessContext } from "./auth/tenant-access-context.js";
import { resolvePublicApplicationTenant } from "./modules/tenant/tenant.service.js";
import { EntitlementRepository } from "./modules/entitlement/entitlement.repository.js";
import { getTenantDatabase } from "./database/tenant-database.js";
export async function registerTconnectHost(app: FastifyInstance) {
  await registerTconnect(app, async (request, publicAccess) => {
    if (publicAccess) {
      const tenant = await resolvePublicApplicationTenant(request.hostname, "tconnect");
      const effectiveModules = await new EntitlementRepository().resolveTenantModuleKeys(tenant.id);
      if (!effectiveModules.includes("tconnect"))
        throw AppError.notFound("TConnect access is inactive.");
      const database = getTenantDatabase(tenant);
      const enabled = await database
        .selectFrom("app_module_settings")
        .select("id")
        .where("module_key", "=", "tconnect")
        .where("enabled", "=", true)
        .where("status", "=", "active")
        .executeTakeFirst();
      if (!enabled) throw AppError.notFound("TConnect is not published for this tenant.");
      if (request.method !== "GET") {
        const origin = request.headers.origin;
        if (!origin || new URL(origin).host !== request.headers.host)
          throw AppError.forbidden("A same-origin enquiry is required.");
      }
      return {
        database: database as never,
        actor: "public:buyer",
        corporateId: tenant.corporateId ?? "",
        registrationFingerprint: createHmac("sha256", env.JWT_SECRET)
          .update(request.ip)
          .digest("hex"),
        provisionBuyerIdentity: (database, input) =>
          createPortalUser(database as never, input, "portal.tconnect-buyer"),
        provisionIdentity: (database, input) =>
          createPortalUser(database as never, input, "portal.tconnect"),
        authorize: async () => {
          throw AppError.forbidden("Sign in to manage TConnect.");
        }
      };
    }
    const context = tenantAccessContext(request);
    const enabled = await context.database
      .selectFrom("app_module_settings")
      .select("id")
      .where("module_key", "=", "tconnect")
      .where("enabled", "=", true)
      .where("status", "=", "active")
      .executeTakeFirst();
    if (!enabled) throw AppError.forbidden("TConnect is not enabled for this tenant.");
    return {
      database: context.database as never,
      actor: context.actorEmail,
      userUuid: request.authContext?.payload.userId ?? "",
      member: await resolveMemberScope(
        context.database as never,
        request.authContext?.payload.userId ?? ""
      ),
      buyer: await resolveBuyerScope(
        context.database as never,
        request.authContext?.payload.userId ?? ""
      ),
      authorize: context.authorize
    };
  });
}
