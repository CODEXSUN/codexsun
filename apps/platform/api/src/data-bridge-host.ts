import {
  createDataMigrationBridgeAccess,
  type DataMigrationHost
} from "@codexsun/data-migration-api";
import {
  registerDataBridgeApi,
  CommonBulkService,
  type CommonTableImportHost
} from "@codexsun/data-bridge-api";
import { AppError } from "@codexsun/framework/errors";
import type { FastifyInstance } from "fastify";
import { resolveTenantDatabasePassword } from "./database/tenant-database.js";
import { TenantRepository } from "./modules/tenant/tenant.repository.js";
import { QueueManagerService } from "./modules/queue-manager/queue-manager.service.js";
import { registerQueueJobProcessor } from "./modules/queue-manager/queue-manager.worker.js";
import { env } from "./env.js";

const tenants = new TenantRepository();

export async function registerDataBridgeHost(
  app: FastifyInstance,
  migrationHost: DataMigrationHost
) {
  const queue = new QueueManagerService();
  const host: CommonTableImportHost = {
    database: migrationHost.database,
    dataMigration: createDataMigrationBridgeAccess(migrationHost),
    authorize(request) {
      const payload = request.authContext?.payload;
      if (payload?.userType !== "super_admin") {
        throw AppError.forbidden("Data Bridge is available only to Super Admin.");
      }
      return payload.email;
    },
    async listTenants() {
      const records = await tenants.list();
      return records
        .filter((tenant) => tenant.status === "active" && tenant.dbType === "mariadb")
        .map((tenant) => ({
          id: tenant.id,
          label: `${tenant.tenantName} (${tenant.tenantCode})`,
          database: tenant.dbName
        }));
    },
    async enqueueBulk(input) {
      if (env.CODEXSUN_QUEUE_WORKER_ENABLED !== "1")
        throw AppError.validation("Enable the Queue Manager worker before starting this import.");
      const tenant = await tenants.findByIdOrCode(String(input.targetTenantId));
      if (!tenant || tenant.status !== "active")
        throw AppError.validation("The target tenant is unavailable.");
      const job = await queue.enqueue({
        jobName: "data-bridge.common-import",
        queueName: "system",
        sourceModule: "data-bridge.common-table-import",
        tenantId: String(tenant.id),
        actorEmail: input.actor,
        correlationId: input.correlationId,
        maxAttempts: 2,
        idempotencyKey: `data-bridge:${input.runId}`,
        payload: { runId: input.runId, targetTenantId: input.targetTenantId }
      });
      if (!job) throw AppError.validation("The import could not be queued.");
    },
    async resolveTenant(id) {
      const tenant = await tenants.findByIdOrCode(String(id));
      if (
        !tenant ||
        tenant.id !== id ||
        tenant.status !== "active" ||
        tenant.dbType !== "mariadb"
      ) {
        throw AppError.validation("Choose an active MariaDB tenant from the registry.");
      }
      return {
        id: tenant.id,
        label: tenant.tenantName,
        database: tenant.dbName,
        host: tenant.dbHost,
        port: tenant.dbPort,
        user: tenant.dbUser,
        password: resolveTenantDatabasePassword(tenant)
      };
    }
  };
  registerQueueJobProcessor("data-bridge.common-import", async (job) => {
    if (
      typeof job.payload.runId !== "string" ||
      typeof job.payload.targetTenantId !== "number" ||
      job.tenantId !== String(job.payload.targetTenantId)
    )
      throw AppError.validation("Invalid Data Bridge job context.");
    const report = await new CommonBulkService(host).run(
      job.payload.runId,
      job.payload.targetTenantId
    );
    return {
      runId: report.id,
      status: report.status,
      tables: report.tables.length,
      inserted: report.tables.reduce((sum, table) => sum + table.inserted, 0),
      attention: report.tables.reduce((sum, table) => sum + table.attention.length, 0)
    };
  });
  await registerDataBridgeApi(app, host);
}
