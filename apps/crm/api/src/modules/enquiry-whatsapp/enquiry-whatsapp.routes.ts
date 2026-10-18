import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { EnquiryWhatsAppService } from "./enquiry-whatsapp.service.js";
import type { WhatsAppContext } from "./enquiry-whatsapp.types.js";
export function registerEnquiryWhatsAppRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<WhatsAppContext>
) {
  const params = z.object({ id: z.coerce.number().int().positive() });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/enquiries/:id/whatsapp-messages",
    schemas: {
      params,
      response: z.array(
        z.object({
          id: z.number(),
          enquiryId: z.number(),
          recipient: z.string(),
          message: z.string(),
          createdBy: z.string(),
          userName: z.string().nullable(),
          createdAt: z.union([z.string(), z.date()])
        })
      )
    },
    handler: async ({ params, request }) =>
      new EnquiryWhatsAppService(await context(request)).list(params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/enquiries/:id/whatsapp-messages",
    schemas: {
      params,
      body: z
        .object({
          message: z.string().trim().min(1).max(10000),
          requestId: z.string().min(8).max(80)
        })
        .strict(),
      response: z.object({ id: z.number(), url: z.string() })
    },
    handler: async ({ params, body, request }) =>
      new EnquiryWhatsAppService(await context(request)).create(
        params.id,
        body.message,
        body.requestId
      )
  });
}
