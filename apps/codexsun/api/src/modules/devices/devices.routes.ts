import { z } from "zod";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import type { CodexsunContextResolver } from "../../context.js";
import { DevicesRepository } from "./devices.repository.js";
import { DevicesService } from "./devices.service.js";
const path = "/codexsun/devices";
const input = z
  .object({
    deviceKey: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
    label: z.string().trim().min(1).max(120),
    kind: z.enum(["web", "desktop", "mobile"])
  })
  .strict();
const status = z.enum(["active", "inactive"]);
const record = input.extend({
  uuid: z.string(),
  lastSeenAt: z.string(),
  status,
  createdBy: z.string()
});
const params = z.object({ uuid: z.string().regex(/^[a-f0-9]{8}$/) }).strict();
export function registerDevicesRoutes(app: FastifyInstance, context: CodexsunContextResolver) {
  async function service(request: FastifyRequest, action: string) {
    const scope = await context(request);
    await scope.authorize(`codexsun.devices.${action}`);
    return new DevicesService(new DevicesRepository(scope.database), scope.actorEmail);
  }
  async function change(
    request: FastifyRequest,
    action: string,
    work: () => Promise<z.infer<typeof record>>
  ) {
    const scope = await context(request);
    const result = await work();
    try {
      await scope.publishChange?.({
        tenantUuid: scope.tenantUuid,
        actorEmail: result.createdBy,
        resource: "devices",
        uuid: result.uuid,
        action
      });
    } catch {
      request.log.warn("Realtime notification unavailable; device remains saved.");
    }
    return result;
  }
  registerContractRoute(app, {
    method: "GET",
    url: path,
    schemas: { response: z.array(record) },
    handler: async ({ request }) => (await service(request, "view")).list()
  });
  registerContractRoute(app, {
    method: "POST",
    url: path,
    schemas: { body: input, response: record },
    handler: async ({ request, body }) =>
      change(request, "registered", async () => (await service(request, "manage")).register(body))
  });
  registerContractRoute(app, {
    method: "POST",
    url: path + "/:uuid/heartbeat",
    schemas: { params, response: record },
    handler: async ({ request, params }) =>
      (await service(request, "manage")).heartbeat(params.uuid)
  });
  registerContractRoute(app, {
    method: "PATCH",
    url: path + "/:uuid",
    schemas: { params, body: z.object({ status }).strict(), response: record },
    handler: async ({ request, params, body }) =>
      change(request, body.status, async () =>
        (await service(request, "manage")).setStatus(params.uuid, body.status)
      )
  });
}
