import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { connection, connectionInput, decisionInput, messageInput, PortalError, repository, repositoryInput, serverInput, task, taskInput } from "./portal-contracts.js";
import { collectEvents, PortalService } from "./portal-service.js";

const root = "/api/v1/zuno/control/servers";
const control = "/api/v1/cxforge/control";
const params = z.object({ serverId: z.string().uuid(), id: z.string().uuid().optional() });

export function registerPortalRoutes(app: FastifyInstance, service: PortalService, actor: (request: FastifyRequest) => string | undefined): void {
  app.register(async (routes) => {
    routes.setErrorHandler((error, _request, reply) => {
      const status = error instanceof PortalError ? error.status : error instanceof z.ZodError ? 400 : 502;
      return reply.code(status).send({ error: error instanceof PortalError ? error.message : status === 400 ? "Invalid control portal request or worker response." : "CXForge operation failed. Refresh to reconcile its state." });
    });
    routes.get(root, async () => ({ servers: service.store.servers() }));
    routes.post(root, async (request, reply) => reply.code(201).send(service.store.saveServer(serverInput.parse(request.body))));
    routes.put(`${root}/:serverId`, async (request) => {
      const { serverId } = params.parse(request.params);
      service.store.server(serverId);
      return service.store.saveServer(serverInput.parse(request.body), serverId);
    });
    routes.get(`${root}/:serverId/snapshot`, async (request) => service.snapshot(params.parse(request.params).serverId));
    routes.post(`${root}/:serverId/git-connections`, async (request, reply) => {
      const { serverId } = params.parse(request.params);
      const input = connectionInput.parse(request.body);
      const current = await service.current(serverId);
      if (!current.credentialEncryptionConfigured) throw new PortalError(409, "Configure CXForge credential encryption before sending a Git token.");
      return reply.code(201).send(await service.call(serverId, `${control}/git-connections`, connection, input));
    });
    routes.post(`${root}/:serverId/git-connections/:id/verify`, async (request) => {
      const { serverId, id } = params.parse(request.params);
      const input = z.object({ repository: repositoryInput.shape.repository, operation: z.enum(["clone", "pull", "push"]), confirmed: z.boolean().default(false) }).parse(request.body);
      if (input.operation === "push") {
        if (!input.confirmed) throw new PortalError(400, "Confirm temporary remote branch creation and deletion.");
        await service.current(serverId, "remote-write-verification-v1");
        return service.call(serverId, `${control}/git-connections/${id}/verify`, z.object({ remoteChecked: z.literal(true), cleanup: z.enum(["removed", "failed"]), temporaryBranch: z.string() }), input);
      }
      return service.call(serverId, `${control}/git-connections/${id}/verify`, z.object({ status: z.string(), remoteChecked: z.boolean(), operation: z.string() }), { repository: input.repository, operation: input.operation });
    });
    routes.post(`${root}/:serverId/repositories`, async (request, reply) => reply.code(201).send(await service.call(params.parse(request.params).serverId, `${control}/repositories`, repository, repositoryInput.parse(request.body))));
    routes.post(`${root}/:serverId/repositories/:id/sync`, async (request) => {
      const { serverId, id } = params.parse(request.params);
      return service.call(serverId, `${control}/repositories/${id}/sync`, repository, {});
    });
    routes.post(`${root}/:serverId/tasks`, async (request, reply) => reply.code(201).send(await service.create(params.parse(request.params).serverId, taskInput.parse(request.body))));
    routes.post(`${root}/:serverId/tasks/:id/queue`, async (request) => {
      const { serverId, id } = params.parse(request.params);
      return service.queue(serverId, id!, z.object({ idempotencyKey: z.string().uuid() }).parse(request.body).idempotencyKey);
    });
    routes.get(`${root}/:serverId/tasks/:id/activity`, async (request) => {
      const { serverId, id } = params.parse(request.params);
      let eventError: string | undefined;
      try { await collectEvents(service, serverId, id!); } catch { eventError = "Event connection interrupted; snapshot reconciliation is active."; }
      const snapshot = await service.snapshot(serverId);
      return { snapshot, events: service.store.events(serverId, id!), cursor: service.store.get(`cursor:${serverId}:${id}`), audit: service.audit(serverId, id!), eventError };
    });
    routes.post(`${root}/:serverId/tasks/:id/messages`, async (request) => {
      const { serverId, id } = params.parse(request.params);
      const actorId = actor(request);
      if (!actorId) throw new PortalError(401, "Authentication required.");
      return service.followUp(serverId, id!, messageInput.parse(request.body), actorId);
    });
    for (const action of ["publish", "merge"] as const) {
      routes.post(`${root}/:serverId/tasks/:id/${action}`, async (request) => {
        const { serverId, id } = params.parse(request.params);
        const actorId = actor(request);
        if (!actorId) throw new PortalError(401, "Authentication required.");
        return service.decide(serverId, id!, action, decisionInput.parse(request.body), actorId);
      });
    }
    routes.post(`${root}/:serverId/tasks/:id/cancel`, async (request) => {
      const { serverId, id } = params.parse(request.params);
      return service.call(serverId, `${control}/tasks/${id}/cancel`, task, {});
    });
  });
}
