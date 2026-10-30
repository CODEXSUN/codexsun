import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ResolveTconnectContext } from "../../context.js";
import { InquiryService } from "./inquiry.service.js";
import {
  inquiryInput,
  inquiryRecord,
  buyerInquiryInput,
  sentInquiryRecord
} from "./inquiry.types.js";
export async function registerInquiryRoutes(app: FastifyInstance, resolve: ResolveTconnectContext) {
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/inquiry/sent",
    schemas: { response: z.array(sentInquiryRecord) },
    handler: async ({ request }) => new InquiryService(await resolve(request, false)).sent()
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/tconnect/inquiry/buyer",
    schemas: { body: buyerInquiryInput, response: z.object({ uuid: z.string() }) },
    handler: async ({ request, body }) =>
      new InquiryService(await resolve(request, false)).submitBuyer(body)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/public/tconnect/inquiry",
    schemas: { body: inquiryInput, response: z.object({ uuid: z.string() }) },
    handler: async ({ request, body }) =>
      new InquiryService(await resolve(request, true)).submit(body)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/inquiry",
    schemas: { response: z.array(inquiryRecord) },
    handler: async ({ request }) => new InquiryService(await resolve(request, false)).list()
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/tconnect/inquiry/:uuid",
    schemas: {
      params: z.object({ uuid: z.string().regex(/^[0-9a-f]{8}$/) }),
      body: z.object({ status: z.enum(["new", "contacted", "closed"]) }).strict(),
      response: z.object({ uuid: z.string(), status: z.string() })
    },
    handler: async ({ request, body, params }) =>
      new InquiryService(await resolve(request, false)).setStatus(params.uuid, body.status)
  });
}
