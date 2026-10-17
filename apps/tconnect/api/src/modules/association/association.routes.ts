import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ResolveTconnectContext } from "../../context.js";
import { AssociationService } from "./association.service.js";
import { associationInput, associationRecord } from "./association.types.js";
export async function registerAssociationRoutes(
  app: FastifyInstance,
  resolve: ResolveTconnectContext
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/public/tconnect/association",
    schemas: { response: z.array(associationRecord) },
    handler: async ({ request }) => new AssociationService(await resolve(request, true)).list(true)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/association",
    schemas: { response: z.array(associationRecord) },
    handler: async ({ request }) => {
      const context = await resolve(request, false);
      await context.authorize("tconnect.association.view");
      return new AssociationService(context).list(false);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/tconnect/association",
    schemas: { body: associationInput, response: associationRecord },
    handler: async ({ request, body }) =>
      new AssociationService(await resolve(request, false)).save(body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/tconnect/association/:uuid",
    schemas: {
      params: z.object({ uuid: z.string().regex(/^[0-9a-f]{8}$/) }),
      body: associationInput,
      response: associationRecord
    },
    handler: async ({ request, body, params }) =>
      new AssociationService(await resolve(request, false)).save(body, params.uuid)
  });
}
