import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import { deploymentStateSchema } from "./deployment.schema.js";
import type { DeploymentService } from "./deployment.service.js";
export function registerDeploymentRoutes(
  app: FastifyInstance,
  access: (
    request: FastifyRequest,
    uuid: string,
    action: "view" | "retry"
  ) => Promise<DeploymentService>
) {
  const uuid = z.string().regex(/^[a-f0-9]{8}$/);
  registerContractRoute(app, {
    method: "GET",
    url: "/sites/:uuid/deployment",
    schemas: { params: z.strictObject({ uuid }), response: deploymentStateSchema },
    handler: async ({ request, params }) => (await access(request, params.uuid, "view")).state()
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/sites/:uuid/deployment/:deploymentUuid/retry",
    schemas: {
      params: z.strictObject({ uuid, deploymentUuid: uuid }),
      body: z.strictObject({}),
      response: deploymentStateSchema
    },
    handler: async ({ request, params }) =>
      (await access(request, params.uuid, "retry")).retry(params.deploymentUuid, request.id)
  });
}
