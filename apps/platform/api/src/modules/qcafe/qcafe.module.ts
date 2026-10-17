import { defineModule } from "@codexsun/framework/modules";
import type { PlatformModuleDependencies } from "../../module-dependencies.js";
import { registerQCafeWeb } from "@codexsun/qcafe-api/cloud";
import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { tenantAccessContext } from "../../auth/tenant-access-context.js";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import { join } from "node:path";
import { tenantStorageRoot } from "../storage-manager/storage-manager.paths.js";

export const qCafeModule = defineModule<PlatformModuleDependencies>({
  key: "qcafe",
  label: "Q Cafe",
  register({ app }) {
    registerContractRoute(app, {
      method: "GET",
      url: "/qcafe/context",
      schemas: {
        response: z
          .object({
            tenantId: z.string(),
            email: z.string(),
            tenantName: z.string(),
            userName: z.string(),
            canCreate: z.boolean(),
            canPay: z.boolean(),
            canManageMenu: z.boolean(),
            canKitchen: z.boolean(),
            canManageTables: z.boolean()
          })
          .strict()
      },
      async handler({ request }) {
        const context = await resolveContext(request);
        await context.authorize("qcafe.pos.view");
        const permitted = async (permission: string) => {
          try {
            await context.authorize(permission);
            return true;
          } catch (error) {
            if (error instanceof AppError && error.statusCode === 403) return false;
            throw error;
          }
        };
        return {
          tenantId: context.tenantId,
          email: context.actorEmail,
          tenantName: request.authContext?.session.context.tenant?.name ?? "Restaurant",
          userName: request.authContext?.session.userName ?? context.actorEmail,
          canCreate: await permitted("qcafe.pos.create"),
          canPay: await permitted("qcafe.pos.pay"),
          canManageMenu: await permitted("qcafe.menu.manage"),
          canKitchen: await permitted("qcafe.kitchen.send"),
          canManageTables: await permitted("qcafe.table.manage")
        };
      }
    });
    return registerQCafeWeb(app, {
      resolveContext,
      masterImageDirectory: (tenantId) =>
        join(tenantStorageRoot(tenantId), "apps", "qcafe", "master")
    });
  }
});

async function resolveContext(request: Parameters<typeof tenantAccessContext>[0]) {
  if (request.authContext?.payload.userType !== "tenant")
    throw AppError.unauthorized("Sign in to Platform as a tenant user.");
  const context = tenantAccessContext(request);
  const enabled = await sql`SELECT id FROM app_module_settings
    WHERE module_key='qcafe' AND enabled=TRUE AND status='active'`.execute(context.database);
  if (!enabled.rows.length) throw AppError.forbidden("QCafe is not enabled for this tenant.");
  return { ...context, database: context.database as never };
}
