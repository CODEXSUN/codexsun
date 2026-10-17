import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { FrappeSettings } from "../connection/index.js";
import { FrappeContactImportService } from "./contact-import.service.js";

type Context = import("./contact-import.types.js").FrappeContactImportContext;

export function registerFrappeContactImportRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<Context>,
  defaults: FrappeSettings,
  secret: string
) {
  const service = async (request: FastifyRequest) => {
    const scope = await context(request);
    return new FrappeContactImportService(scope.database, secret, defaults, scope.resolveContact);
  };
  registerContractRoute(app, {
    method: "GET",
    url: "/frappe/contacts/remote",
    schemas: {
      querystring: z.object({ page: z.coerce.number().int().positive().default(1) }),
      response: z.object({
        source: z.literal("mobile-contact-customer"),
        page: z.number(),
        pageSize: z.number(),
        hasMore: z.boolean(),
        items: z.array(
          z.object({
            name: z.string(),
            customerId: z.string(),
            displayName: z.string(),
            email: z.string().nullable(),
            phone: z.string().nullable(),
            localContactId: z.number().nullable()
          })
        )
      })
    },
    handler: async ({ request, query }) => (await service(request)).preview(query.page)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/frappe/contacts/pull",
    schemas: {
      body: z.object({ remoteName: z.string().trim().min(1).max(191) }).strict(),
      response: z.object({
        remoteName: z.string(),
        localId: z.number(),
        status: z.enum(["created", "linked"])
      })
    },
    handler: async ({ request, body }) => (await service(request)).pull(body.remoteName)
  });
}
