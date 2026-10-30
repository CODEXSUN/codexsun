import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { MarketingDependencies, MarketingContext } from "../../context.js";
import type { CaptureInput } from "./capture.types.js";
import { CaptureService } from "./capture.service.js";
export const captureInputSchema = z.strictObject({
  expectedRevision: z.number().int().positive().optional(),
  brandUuid: z.string().regex(/^[a-f0-9]{8}$/),
  campaignUuid: z.string().regex(/^[a-f0-9]{8}$/),
  name: z.string().trim().min(1).max(160),
  allowedOrigin: z
    .url()
    .refine(
      (value) => new URL(value).origin === value && value.startsWith("https://"),
      "Use an HTTPS origin without a path."
    ),
  consentNotice: z.string().trim().min(10).max(2000),
  noticeVersion: z.string().trim().min(1).max(40),
  status: z.enum(["active", "inactive"]).default("active")
});
export const captureRecordSchema = captureInputSchema.extend({
  uuid: z.string(),
  revision: z.number().int().positive(),
  companyId: z.number(),
  createdBy: z.string(),
  updatedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export function registerCaptureRoutes(
  app: FastifyInstance,
  deps: MarketingDependencies,
  validateParent: (ctx: MarketingContext, input: CaptureInput) => Promise<void>
) {
  const params = z.object({ uuid: z.string().regex(/^[a-f0-9]{8}$/) });
  const service = async (request: import("fastify").FastifyRequest) => {
    const ctx = await deps.context(request);
    return new CaptureService(ctx, (input) => validateParent(ctx, input));
  };
  registerContractRoute(app, {
    method: "GET",
    url: "/marketing/captures/count",
    schemas: {
      querystring: z.object({
        search: z.string().max(160).default(""),
        status: z.enum(["all", "active", "inactive"]).default("all")
      }),
      response: z.object({ total: z.number() })
    },
    handler: async ({ request, query }) => ({
      total: await (await service(request)).count(query.search, query.status)
    })
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/marketing/captures",
    schemas: {
      querystring: z.object({
        search: z.string().max(160).default(""),
        status: z.enum(["all", "active", "inactive"]).default("all"),
        limit: z.coerce.number().int().min(1).max(100).default(50),
        offset: z.coerce.number().int().min(0).default(0)
      }),
      response: z.array(captureRecordSchema)
    },
    handler: async ({ request, query }) =>
      (await service(request)).list(query.search, query.limit, query.offset, query.status)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/marketing/captures/:uuid",
    schemas: { params, response: captureRecordSchema },
    handler: async ({ request, params }) => (await service(request)).get(params.uuid)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/marketing/captures",
    schemas: { body: captureInputSchema, response: captureRecordSchema },
    handler: async ({ request, body }) => (await service(request)).save(body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/marketing/captures/:uuid",
    schemas: { params, body: captureInputSchema, response: captureRecordSchema },
    handler: async ({ request, params, body }) => (await service(request)).save(body, params.uuid)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/marketing/captures/:uuid/activity",
    schemas: {
      params,
      response: z.array(z.object({ action: z.string(), actor: z.string(), occurredAt: z.string() }))
    },
    handler: async ({ request, params }) => (await service(request)).activity(params.uuid)
  });
}
