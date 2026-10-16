import type { FastifyInstance } from "fastify";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import {
  registerCodexsunApi,
  registerCodexsunRealtime,
  type CodexsunDatabase,
  type CodexsunSocketIdentity
} from "@codexsun/codexsun-api";
import { tenantAccessContext } from "./auth/tenant-access-context.js";
import { TenantRepository } from "./modules/tenant/index.js";

export function registerCodexsunHost(app: FastifyInstance) {
  const realtime = registerCodexsunRealtime(app, async (credentials) => {
    const response = await app.inject({
      method: "GET",
      url: "/codexsun/context",
      headers: {
        host: credentials.host,
        cookie: credentials.cookie,
        "x-codexsun-session-slot": credentials.sessionSlot,
        ...(credentials.origin ? { origin: credentials.origin } : {}),
        ...(credentials.bearer ? { authorization: credentials.bearer } : {})
      }
    });
    if (response.statusCode !== 200)
      throw AppError.unauthorized("Realtime session is unavailable.");
    return response.json<{ data: CodexsunSocketIdentity }>().data;
  });
  return registerCodexsunApi(app, async (request) => {
    const context = tenantAccessContext(request);
    const enabled = await context.database
      .selectFrom("app_module_settings")
      .select("id")
      .where("module_key", "=", "codexsun")
      .where("enabled", "=", true)
      .where("status", "=", "active")
      .executeTakeFirst();
    if (!enabled) throw AppError.forbidden("CODEXSUN is not enabled for this tenant.");
    const tenant = await new TenantRepository().findByIdOrCode(context.tenantId);
    if (!tenant) throw AppError.notFound("Tenant was not found.");
    return {
      database: context.database as unknown as Kysely<CodexsunDatabase>,
      actorEmail: context.actorEmail,
      tenantUuid: tenant.uuid,
      tenantName: tenant.tenantName,
      publishChange: (change) => realtime.publishChange(change),
      authorize: context.authorize,
      can: async (permission: string) => {
        try {
          await context.authorize(permission);
          return true;
        } catch (error) {
          if (error instanceof AppError && error.statusCode === 403) return false;
          throw error;
        }
      }
    };
  });
}
