import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ResolveTconnectContext } from "../../context.js";
import { BuyerService } from "./buyer.service.js";
import { buyerRegistration, buyerRecord } from "./buyer.types.js";
export async function registerBuyerRoutes(app: FastifyInstance, resolve: ResolveTconnectContext) {
  registerContractRoute(app, {
    method: "POST",
    url: "/public/tconnect/buyer/registration",
    schemas: { body: buyerRegistration, response: z.object({ uuid: z.string() }) },
    handler: async ({ request, body }) =>
      new BuyerService(await resolve(request, true)).register(body)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/buyer/session",
    schemas: { response: buyerRecord },
    handler: async ({ request }) => new BuyerService(await resolve(request, false)).session()
  });
}
