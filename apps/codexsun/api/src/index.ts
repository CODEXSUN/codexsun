import type { FastifyInstance } from "fastify";
import type {} from "@codexsun/framework/api";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { sql, type Kysely } from "kysely";
import { createHash } from "node:crypto";
import {
  requirementsModule,
  requirementsMigrationBatch,
  migrateRequirementsDatabase,
  seedRequirementsPermissions
} from "./modules/requirements/index.js";
import {
  devicesModule,
  devicesMigrationBatch,
  migrateDevicesDatabase,
  seedDevicesPermissions
} from "./modules/devices/index.js";
import type { CodexsunContextResolver, CodexsunDatabase } from "./context.js";
export { registerCodexsunRealtime } from "./modules/realtime/index.js";
export type {
  CodexsunSocketIdentity,
  CodexsunSocketCredentials,
  CodexsunChange
} from "./modules/realtime/index.js";
export type {
  CodexsunContextResolver,
  CodexsunRequestContext,
  CodexsunDatabase
} from "./context.js";
export const codexsunApiModuleKeys = [
  "codexsun.overview",
  requirementsModule.key,
  devicesModule.key
];
export const codexsunTenantMigrations = [requirementsMigrationBatch, devicesMigrationBatch].flatMap(
  (batch) => batch.steps.map(({ name, description }) => ({ name, description }))
);

export function registerCodexsunApi(app: FastifyInstance, context: CodexsunContextResolver) {
  requirementsModule.register(app, context);
  devicesModule.register(app, context);
  registerContractRoute(app, {
    method: "GET",
    url: "/codexsun/context",
    schemas: {
      response: z.object({
        tenantUuid: z.string(),
        tenantName: z.string(),
        actorEmail: z.string(),
        permissions: z.record(z.string(), z.boolean())
      })
    },
    handler: async ({ request }) => {
      const scope = await context(request);
      await scope.authorize("codexsun.overview.view");
      const permissions: Record<string, boolean> = {};
      for (const key of [
        "codexsun.overview.view",
        "codexsun.requirements.view",
        "codexsun.requirements.create",
        "codexsun.requirements.update",
        "codexsun.requirements.approve",
        "codexsun.devices.view",
        "codexsun.devices.manage"
      ])
        permissions[key] = await scope.can(key);
      return {
        tenantUuid: scope.tenantUuid,
        tenantName: scope.tenantName,
        actorEmail: scope.actorEmail,
        permissions
      };
    }
  });
}
export async function migrateCodexsunDatabase(database: Kysely<CodexsunDatabase>) {
  await migrateRequirementsDatabase(database);
  await migrateDevicesDatabase(database);
}
export async function seedCodexsunPermissions(database: Kysely<CodexsunDatabase>) {
  await seedRequirementsPermissions(database);
  await seedDevicesPermissions(database);
  const key = "codexsun.overview.view";
  const uuid = createHash("sha256").update(key).digest("hex").slice(0, 8);
  const grantUuid = createHash("sha256")
    .update("role-permission:admin:" + key)
    .digest("hex")
    .slice(0, 8);
  await sql`INSERT INTO app_permissions (uuid,\`key\`,label,description,status,is_protected) VALUES (${uuid},${key},'Personal assistance overview','Allows the personal assistance overview.','active',TRUE) ON DUPLICATE KEY UPDATE label=VALUES(label),description=VALUES(description)`.execute(
    database
  );
  await sql`INSERT INTO app_role_permissions (uuid,role_id,permission_id,status,is_protected) SELECT ${grantUuid},role.id,permission.id,'active',TRUE FROM app_roles role INNER JOIN app_permissions permission ON permission.\`key\`=${key} WHERE role.\`key\`='admin' ON DUPLICATE KEY UPDATE uuid=app_role_permissions.uuid`.execute(
    database
  );
}
export async function rollbackCodexsunDatabase(
  _database: Kysely<CodexsunDatabase>
): Promise<never> {
  throw new Error(
    "Codexsun retains requirements and approvals. Restore a verified backup instead of destructive rollback."
  );
}
