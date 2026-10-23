import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { MarketingDependencies } from "../../context.js";
import { submissionInputSchema } from "../submission/index.js";
import { PublicCaptureService, type PublicCaptureDependencies } from "./capture.public.js";

export function registerPublicCapture(
  app: FastifyInstance,
  context: MarketingDependencies["context"],
  dependencies: PublicCaptureDependencies
) {
  const service = new PublicCaptureService(dependencies),
    params = z.object({
      token: z
        .string()
        .max(2000)
        .regex(/^[a-zA-Z0-9_.-]+$/)
    });
  registerContractRoute(app, {
    method: "POST",
    url: "/marketing/captures/:uuid/publish-binding",
    schemas: {
      params: z.object({ uuid: z.string().regex(/^[a-f0-9]{8}$/) }),
      response: z.object({ token: z.string(), path: z.string(), expiresAt: z.string() })
    },
    handler: async ({ request, params }) => service.publish(await context(request), params.uuid)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/public/marketing/captures",
    schemas: {
      querystring: params,
      response: z.object({
        title: z.string(),
        consentNotice: z.string(),
        noticeVersion: z.string(),
        expiresAt: z.string()
      })
    },
    handler: async ({ query, reply }) => {
      reply.header("Cache-Control", "no-store");
      return service.definition(query.token);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/public/marketing/captures",
    schemas: {
      querystring: params,
      body: submissionInputSchema
        .omit({ captureUuid: true })
        .extend({ website: z.literal("").default("") }),
      response: z.object({ reference: z.string(), received: z.boolean() })
    },
    handler: async ({ request, query, body, reply }) => {
      reply.header("Cache-Control", "no-store");
      const { website: _website, ...input } = body;
      return service.submit(query.token, String(request.headers.origin ?? ""), request.ip, input);
    }
  });
}
