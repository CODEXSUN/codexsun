import { z } from "zod";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ContactPolicyContext } from "./contact-restriction.types.js";
import {
  recordContactRestriction,
  contactRestrictionSchema
} from "./contact-restriction.service.js";
export function registerContactRestrictionRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<ContactPolicyContext>
) {
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/contact-restrictions",
    schemas: {
      body: contactRestrictionSchema,
      response: contactRestrictionSchema.extend({ uuid: z.string() })
    },
    handler: async ({ request, body }) => recordContactRestriction(await context(request), body)
  });
}
