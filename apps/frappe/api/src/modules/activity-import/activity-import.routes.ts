import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Kysely } from "kysely";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { FrappeDatabase, FrappeSettings } from "../connection/index.js";
import { FrappeActivityImportService } from "./activity-import.service.js";

export function registerFrappeActivityImportRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<Kysely<FrappeDatabase>>,
  defaults: FrappeSettings,
  secret: string
) {
  const service = async (request: FastifyRequest) =>
    new FrappeActivityImportService(await context(request), secret, defaults);
  registerContractRoute(app, {
    method: "GET",
    url: "/frappe/activities/remote",
    schemas: {
      querystring: z.object({ page: z.coerce.number().int().positive().default(1) }),
      response: z.object({
        page: z.number(),
        pageSize: z.number(),
        hasMore: z.boolean(),
        items: z.array(
          z.object({
            name: z.string(),
            enquiry: z.string().nullable(),
            details: z.string(),
            mode: z.string(),
            createdAt: z.string().nullable(),
            localEnquiryId: z.number().nullable(),
            localActivityId: z.number().nullable()
          })
        )
      })
    },
    handler: async ({ request, query }) => (await service(request)).preview(query.page)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/frappe/activities/pull",
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
