import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { connection, connectionInput, PortalError, repositoryInput, serverInput } from "./portal-contracts.js";
import { PortalService } from "./portal-service.js";
import { commandId, commandTask } from "./workspace-contracts.js";

const root = "/api/v1/zuno/control/servers";
const control = "/api/v1/cxforge/control";
const params = z.object({ serverId: z.string().uuid(), id: commandId.optional() });

export function registerPortalRoutes(app: FastifyInstance, service: PortalService, actor: (request: FastifyRequest) => string | undefined): void {
  app.register(async (routes) => {
    routes.addHook("onRequest", async (request, reply) => {
      if (!actor(request)) return reply.code(401).send({ error: "Authentication required." });
    });
    routes.setErrorHandler((error, _request, reply) => {
      const status = error instanceof PortalError ? error.status : error instanceof z.ZodError ? 400 : 502;
      return reply.code(status).send({ error: error instanceof PortalError ? error.message : status === 400 ? "Invalid workspace request or worker response." : "CXForge operation failed. Refresh its state." });
    });
    routes.get(root, async () => ({ servers: service.store.servers().map((server) => ({ ...server, runtime: service.store.get(`runtime:${server.id}`) })) }));
    routes.post(root, async (request, reply) => reply.code(201).send(service.store.saveServer(serverInput.parse(request.body))));
    routes.put(`${root}/:serverId`, async (request) => {
      const { serverId } = params.parse(request.params);
      service.store.server(serverId);
      return service.store.saveServer(serverInput.parse(request.body), serverId);
    });
    routes.get(`${root}/:serverId/snapshot`, async (request) => service.snapshot(params.parse(request.params).serverId));
    routes.post(`${root}/:serverId/git-connections`, async (request, reply) => {
      const { serverId } = params.parse(request.params);
      return reply.code(201).send(await service.call(serverId, `${control}/git-connections`, connection, connectionInput.parse(request.body)));
    });
    routes.post(`${root}/:serverId/git-connections/:id/verify`, async (request) => {
      const { serverId, id } = params.parse(request.params);
      const input = z.object({ repository: repositoryInput.shape.repository, operation: z.enum(["clone", "pull"]) }).strict().parse(request.body);
      return service.call(serverId, `${control}/git-connections/${id}/verify`, z.object({ status: z.string(), remoteChecked: z.boolean(), operation: z.string() }), input);
    });
    routes.post(`${root}/:serverId/commands/:id/cancel`, async (request) => {
      const { serverId, id } = params.parse(request.params);
      return service.call(serverId, `${control}/commands/${id}/cancel`, commandTask, {});
    });
  });
}
