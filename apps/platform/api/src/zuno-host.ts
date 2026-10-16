import { searchDeveloperReference } from "@codexsun/docs-api";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerZunoApi } from "@codexsun/zuno-api";
import type { ZunoDatabase } from "@codexsun/zuno-api";
import { AppError } from "@codexsun/framework/errors";
import type { Kysely } from "kysely";
import { getPlatformDatabase } from "./database/platform-database.js";
import { TenantRepository } from "./modules/tenant/index.js";
import { DatabaseMaintenanceService } from "./modules/database-maintenance/index.js";
import { QueueManagerService } from "./modules/queue-manager/index.js";
import { env } from "./env.js";
import { executeZunoTextCorrection, previewZunoTextCorrection } from "./zuno-correction.js";

export async function registerZunoHost(app: FastifyInstance) {
  const maintenance = new DatabaseMaintenanceService();
  const queue = new QueueManagerService();
  await registerZunoApi(app, {
    // Super Admin developer evidence uses the reviewed repository baseline only.
    readDocs: async (query) =>
      (await searchDeveloperReference(query)).map((page) => ({
        source: `Developer reference: ${page.sourcePath} (${page.sourceHash.slice(0, 12)})`,
        content: `${page.title}\n${page.url}\n${page.excerpt}`
      })),
    authorize(request: FastifyRequest) {
      if (request.authContext?.payload?.userType !== "super_admin") {
        throw AppError.forbidden("Zuno is available only to Super Admin.");
      }
      if (request.method === "POST") {
        request.log.info(
          {
            action: "zuno.investigate",
            actorId: request.authContext.payload.userId
          },
          "Zuno investigation requested"
        );
      }
    },
    config: {
      sourceRoot: env.CODEXSUN_ZUNO_SOURCE_ROOT,
      platformLogPath: env.CODEXSUN_ZUNO_PLATFORM_LOG_PATH,
      providerBaseUrl: env.CODEXSUN_ZUNO_PROVIDER_BASE_URL,
      providerModel: env.CODEXSUN_ZUNO_PROVIDER_MODEL,
      providerApiKey: env.CODEXSUN_ZUNO_PROVIDER_API_KEY
    },
    resolveCaseContext(request) {
      const payload = request.authContext?.payload;
      if (payload?.userType !== "super_admin") {
        throw AppError.forbidden("Zuno is available only to Super Admin.");
      }
      return {
        actorEmail: payload.email,
        database: getPlatformDatabase() as unknown as Kysely<ZunoDatabase>,
        tenantExists: async (id: number) =>
          (await new TenantRepository().findByIdOrCode(String(id)))?.id === id,
        listTenantTargets: async () =>
          (await new TenantRepository().list()).map((tenant) => ({
            id: tenant.id,
            label: `${tenant.tenantName} (${tenant.tenantCode})`
          })),
        previewTextCorrection: previewZunoTextCorrection,
        executeTextCorrection: executeZunoTextCorrection
      };
    },
    async loadWatchSnapshot() {
      const [master, tenants, jobs] = await Promise.all([
        maintenance.masterStatus(),
        maintenance.tenantStatuses(),
        queue.listJobs()
      ]);
      return {
        targets: [
          {
            scope: "master" as const,
            name: master.databaseName,
            databaseStatus: master.status,
            runs: master.runs
          },
          ...tenants.map((tenant) => ({
            scope: "tenant" as const,
            name: tenant.tenantCode,
            databaseStatus: tenant.status,
            runs: tenant.runs
          }))
        ],
        queueJobs: jobs.map((job) => ({ status: job.status, createdAt: job.createdAt }))
      };
    }
  });
}
