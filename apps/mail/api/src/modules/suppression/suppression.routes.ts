import { z } from "zod";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import type { MailSafetyContext } from "./suppression.types.js";
import { recordMailSuppression, mailSuppressionSchema } from "./suppression.service.js";
export function registerMailSuppressionRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<MailSafetyContext>
) {
  registerContractRoute(app, {
    method: "POST",
    url: "/mail/suppressions",
    schemas: {
      body: mailSuppressionSchema,
      response: mailSuppressionSchema.extend({ uuid: z.string() })
    },
    handler: async ({ request, body }) => recordMailSuppression(await context(request), body)
  });
}
