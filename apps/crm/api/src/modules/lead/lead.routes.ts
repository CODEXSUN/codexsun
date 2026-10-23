import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { LeadService } from "./lead.service.js";
import type { LeadContext } from "./lead.types.js";
export const leadIntakeSchema = z.strictObject({
  submissionUuid: z.string().regex(/^[a-f0-9]{8}$/),
  campaignUuid: z.string().regex(/^[a-f0-9]{8}$/),
  campaignLabel: z.string().max(160),
  name: z.string().trim().min(1).max(160),
  email: z.union([z.literal(""), z.email().max(254)]),
  phone: z.string().max(40),
  message: z.string().max(10000),
  source: z.string().max(160)
});
export const leadRecordSchema = leadIntakeSchema.extend({
  uuid: z.string(),
  companyId: z.number(),
  assignedTo: z.string(),
  status: z.literal("review"),
  taskId: z.number().nullable()
});
export function registerLeadRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<LeadContext>
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/leads/:uuid",
    schemas: {
      params: z.object({ uuid: z.string().regex(/^[a-f0-9]{8}$/) }),
      response: leadRecordSchema
    },
    handler: async ({ request, params }) => new LeadService(await context(request)).get(params.uuid)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/leads",
    schemas: { response: z.array(leadRecordSchema) },
    handler: async ({ request }) => new LeadService(await context(request)).list()
  });
}
