import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  backupIdSchema,
  backupScopeSchema,
  backupWorkspaceSchema,
  createBackupScheduleSchema,
  recordBackupSchema,
  scheduleIdSchema,
  selectDataFolderSchema,
  setScheduleActiveSchema,
  submitRestoreCheckSchema,
} from "../contracts/backup.contract.js";
import { BackupConflictError, BackupService } from "../services/backup.service.js";

type Context = (request: FastifyRequest) => CommandContext;

export async function registerBackupRoutes(app: FastifyInstance, service: BackupService, contextFor: Context) {
  app.get(
    "/api/v1/qcafe/backup",
    { schema: { querystring: backupScopeSchema, response: { 200: backupWorkspaceSchema }, tags: ["Backup"] } },
    (request) => service.read(backupScopeSchema.parse(request.query)),
  );
  app.post("/api/v1/qcafe/backup/data-folders", async (request, reply) =>
    run(reply, () => service.selectDataFolder(selectDataFolderSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/backup/schedules", async (request, reply) =>
    run(reply, () => service.createSchedule(createBackupScheduleSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/backup/schedules/:scheduleId/active", async (request, reply) =>
    run(reply, () =>
      service.setScheduleActive(
        scheduleIdSchema.parse(request.params).scheduleId,
        setScheduleActiveSchema.parse(request.body).active,
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/backup/backups", async (request, reply) =>
    run(reply, () => service.recordBackup(recordBackupSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/backup/backups/:backupId/restore-checks", async (request, reply) =>
    run(reply, () => {
      const input = submitRestoreCheckSchema.parse(request.body);
      return service.submitRestoreCheck(
        backupIdSchema.parse(request.params).backupId,
        input.status,
        input.detail,
        contextFor(request),
      );
    }),
  );
}

async function run(
  reply: { code: (status: number) => { send: (body: unknown) => unknown } },
  work: () => Promise<unknown>,
) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof BackupConflictError) return reply.code(409).send({ error: error.message });
    throw error;
  }
}
