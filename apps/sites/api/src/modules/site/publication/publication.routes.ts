import { registerContractRoute } from "@codexsun/framework/http";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { deliverySnapshotSchema } from "./publication.schema.js";
import type { PublicationService } from "./publication.service.js";
export function registerPublicationRoutes(
  app: FastifyInstance,
  access: (
    request: FastifyRequest,
    uuid: string
  ) => Promise<{ service: PublicationService; content: unknown; blogs: unknown; actor: string }>
) {
  registerContractRoute(app, {
    method: "POST",
    url: "/sites/:uuid/publication/export",
    schemas: {
      params: z.strictObject({ uuid: z.string().regex(/^[a-f0-9]{8}$/) }),
      response: deliverySnapshotSchema
    },
    handler: async ({ params, request, reply }) => {
      const scope = await access(request, params.uuid);
      reply.header("Cache-Control", "no-store");
      return scope.service.export(scope.content, scope.blogs, scope.actor);
    }
  });
}
