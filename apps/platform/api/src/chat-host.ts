import type { Kysely } from "kysely";
import type { TelegramDependencies } from "@codexsun/chat-api";
import { TenantRepository } from "./modules/tenant/tenant.repository.js";
import { getTenantDatabase } from "./database/tenant-database.js";
import { authorizeTenantUser } from "./auth/tenant-access-context.js";
import { env } from "./env.js";
import type { QueueManagerService } from "./modules/queue-manager/queue-manager.service.js";
import { registerQueueJobProcessor } from "./modules/queue-manager/queue-manager.worker.js";

export function telegramChatDependencies(queue: QueueManagerService): TelegramDependencies {
  return {
    secretKey: env.JWT_SECRET,
    enqueue: (input) => queue.enqueue(input),
    scopes: async () => {
      const scopes = [];
      for (const tenant of await new TenantRepository().list()) {
        if (tenant.status !== "active" || !tenant.enabledModuleKeys.includes("chat")) continue;
        const database = getTenantDatabase(tenant);
        const enabled = await database
          .selectFrom("app_module_settings")
          .select("module_key")
          .where("module_key", "=", "chat")
          .where("enabled", "=", true)
          .where("status", "=", "active")
          .executeTakeFirst();
        if (enabled)
          scopes.push({
            database: database as unknown as Kysely<Record<string, Record<string, unknown>>>,
            tenantDatabase: tenant.dbName,
            tenantId: tenant.uuid
          });
      }
      return scopes;
    },
    authorize: (scope, email) => authorizeTenantUser(scope.database, email, "chat.manage"),
    registerProcessor: (processor) =>
      registerQueueJobProcessor("chat.telegram.sync", async (job) => {
        if (
          !job.tenantId ||
          typeof job.payload.accountUuid !== "string" ||
          typeof job.payload.operationId !== "string"
        )
          throw new Error("Invalid Telegram sync job.");
        return processor(job.tenantId, job.payload.accountUuid, job.payload.operationId);
      })
  };
}
