import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ResolveTconnectContext } from "../../context.js";
import { QuotationService } from "./quotation.service.js";
import { quotationInput, quotationRecord } from "./quotation.types.js";
export async function registerQuotationRoutes(
  app: FastifyInstance,
  resolve: ResolveTconnectContext
) {
  const id = z.string().regex(/^[0-9a-f]{8}$/);
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/quotation",
    schemas: {
      querystring: z.object({ conversationUuid: id.optional() }).strict(),
      response: z.array(quotationRecord)
    },
    handler: async ({ request, query }) =>
      new QuotationService(await resolve(request, false)).list(query.conversationUuid)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/tconnect/quotation",
    schemas: { body: quotationInput, response: z.object({ uuid: id }) },
    handler: async ({ request, body }) =>
      new QuotationService(await resolve(request, false)).create(body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/tconnect/quotation/:uuid/withdraw",
    schemas: {
      params: z.object({ uuid: id }).strict(),
      body: z.object({}).strict(),
      response: z.object({ uuid: id, status: z.literal("withdrawn") })
    },
    handler: async ({ request, params }) =>
      new QuotationService(await resolve(request, false)).withdraw(params.uuid)
  });
}
