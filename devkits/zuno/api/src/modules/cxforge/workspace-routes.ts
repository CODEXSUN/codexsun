import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { PortalError } from "./portal-contracts";
import { PortalService } from "./portal-service";
import { ContainerProvisioner } from "./container-provisioner";
import { commandId, commandTask, commands, dropInput, provisionInput, workspaceProfile, workspaceProfileInput, workspaceSetup } from "./workspace-contracts";

export function registerWorkspaceRoutes(app: FastifyInstance, service: PortalService, root: string, actor: (request: FastifyRequest) => string | undefined): void {
  const provisioner = new ContainerProvisioner(service, root);
  app.register(async (routes) => {
    routes.addHook("onRequest", async (request, reply) => { if (!actor(request)) return reply.code(401).send({ error: "Authentication required." }); });
    routes.setErrorHandler((error, _request, reply) => reply.code(error instanceof z.ZodError ? 400 : error instanceof PortalError ? error.status : 502).send({ error: error instanceof PortalError ? error.message : "Workspace request failed. Check the recipe and worker connection." }));
    const base = "/api/v1/zuno/control";
    routes.get(`${base}/workspace-profiles`, async () => workspaceProfile.array().parse(service.store.workspaceProfiles()));
    routes.post(`${base}/workspace-profiles`, async (request, reply) => reply.code(201).send(workspaceProfile.parse(service.store.saveWorkspaceProfile(workspaceProfileInput.parse(request.body)))));
    routes.post(`${base}/provisions`, async (request, reply) => reply.code(202).send(await provisioner.start(provisionInput.parse(request.body))));
    routes.get(`${base}/provisions/:id`, async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      return (await provisioner.get(id)) ?? reply.code(404).send({ error: "Provision request not found." });
    });
    const params = z.object({ serverId: z.string().uuid(), id: commandId.optional() });
    routes.post(`${base}/servers/:serverId/drop`, async (request) => {
      const { serverId } = params.parse(request.params);
      const input = dropInput.parse(request.body);
      return service.store.command(`drop:${serverId}:${input.requestId}`, input, () => provisioner.drop(serverId));
    });
    for (const [path, schema] of [["workspace/setup", workspaceSetup], ["commands", commands]] as const) {
      routes.post(`${base}/servers/:serverId/${path}`, async (request, reply) => {
        const { serverId } = params.parse(request.params);
        const input = schema.parse(request.body);
        const result = await service.store.command(`${serverId}:${path}:${input.requestId}`, input, () => service.call(serverId, `/api/v1/cxforge/control/${path}`, commandTask, input));
        return reply.code(202).send(result);
      });
    }
    routes.get(`${base}/servers/:serverId/commands/:id`, async (request) => {
      const { serverId, id } = params.parse(request.params);
      return service.call(serverId, `/api/v1/cxforge/control/commands/${id}`, commandTask);
    });
    routes.put(`${base}/servers/:serverId/workspace/environment`, async (request) => {
      const input = z.object({ directory: z.string().default("."), values: z.record(z.string()), overwrite: z.boolean().default(false) }).strict().parse(request.body);
      const response = await service.response(params.parse(request.params).serverId, "/api/v1/cxforge/control/workspace/environment", input, "PUT");
      return response.status === 204 ? {} : response.json();
    });
  });
}
