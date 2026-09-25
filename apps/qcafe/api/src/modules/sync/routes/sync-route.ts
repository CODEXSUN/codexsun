import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  advanceCursorSchema,
  appendChangeSchema,
  conflictIdSchema,
  deviceIdSchema,
  pushChangesSchema,
  registerDeviceSchema,
  reportConflictSchema,
  resolveConflictSchema,
  syncScopeSchema,
  syncWorkspaceSchema,
} from "../contracts/sync.contract.js";
import { SyncConflictError, SyncService } from "../services/sync.service.js";

type Context = (request: FastifyRequest) => CommandContext;

export async function registerSyncRoutes(app: FastifyInstance, service: SyncService, contextFor: Context) {
  app.get(
    "/api/v1/qcafe/sync",
    { schema: { querystring: syncScopeSchema, response: { 200: syncWorkspaceSchema }, tags: ["Sync"] } },
    (request) => service.read(syncScopeSchema.parse(request.query)),
  );
  app.post("/api/v1/qcafe/sync/devices", async (request, reply) =>
    run(reply, () => service.registerDevice(registerDeviceSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/sync/devices/:deviceId/revoke", async (request, reply) =>
    run(reply, () => service.revokeDevice(deviceIdSchema.parse(request.params).deviceId, contextFor(request))),
  );
  app.post("/api/v1/qcafe/sync/changes", async (request, reply) =>
    run(reply, () => service.appendChange(appendChangeSchema.parse(request.body), contextFor(request))),
  );
  app.get("/api/v1/qcafe/sync/devices/:deviceId/pending-changes", async (request, reply) =>
    run(reply, () => service.pendingChanges(deviceIdSchema.parse(request.params).deviceId)),
  );
  app.post("/api/v1/qcafe/sync/devices/:deviceId/push", async (request, reply) =>
    run(reply, () =>
      service.pushChanges(
        deviceIdSchema.parse(request.params).deviceId,
        pushChangesSchema.parse(request.body).changes,
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/sync/devices/:deviceId/cursor", async (request, reply) =>
    run(reply, () =>
      service.advanceCursor(
        deviceIdSchema.parse(request.params).deviceId,
        advanceCursorSchema.parse(request.body).lastSeq,
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/sync/conflicts", async (request, reply) =>
    run(reply, () => service.reportConflict(reportConflictSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/sync/conflicts/:conflictId/resolve", async (request, reply) =>
    run(reply, () => {
      const input = resolveConflictSchema.parse(request.body);
      return service.resolveConflict(conflictIdSchema.parse(request.params).conflictId, input, contextFor(request));
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
    if (error instanceof SyncConflictError) return reply.code(409).send({ error: error.message });
    throw error;
  }
}
