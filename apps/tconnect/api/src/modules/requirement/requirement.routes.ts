import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ResolveTconnectContext } from "../../context.js";
import { RequirementService } from "./requirement.service.js";
import { requirementInput, requirementRecord } from "./requirement.types.js";
export async function registerRequirementRoutes(
  app: FastifyInstance,
  resolve: ResolveTconnectContext
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/requirement",
    schemas: { response: z.array(requirementRecord) },
    handler: async ({ request }) => new RequirementService(await resolve(request, false)).list()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/requirement/board",
    schemas: { response: z.array(requirementRecord) },
    handler: async ({ request }) => new RequirementService(await resolve(request, false)).board()
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/tconnect/requirement",
    schemas: { body: requirementInput, response: requirementRecord },
    handler: async ({ request, body }) =>
      new RequirementService(await resolve(request, false)).save(body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/tconnect/requirement/:uuid",
    schemas: {
      params: z.object({ uuid: z.string().regex(/^[0-9a-f]{8}$/) }).strict(),
      body: requirementInput,
      response: requirementRecord
    },
    handler: async ({ request, body, params }) =>
      new RequirementService(await resolve(request, false)).save(body, params.uuid)
  });
}
