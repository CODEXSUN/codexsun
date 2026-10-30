import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ResolveTconnectContext } from "../../context.js";
import { ConversationService } from "./conversation.service.js";
import { conversationInput, conversationRecord } from "./conversation.types.js";
export async function registerConversationRoutes(
  app: FastifyInstance,
  resolve: ResolveTconnectContext
) {
  const id = z.string().regex(/^[0-9a-f]{8}$/);
  const params = z.object({ uuid: id }).strict();
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/conversation",
    schemas: { response: z.array(conversationRecord) },
    handler: async ({ request }) => new ConversationService(await resolve(request, false)).list()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/conversation/:uuid",
    schemas: { params, response: conversationRecord },
    handler: async ({ request, params }) =>
      new ConversationService(await resolve(request, false)).get(params.uuid)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/tconnect/conversation",
    schemas: { body: conversationInput, response: z.object({ uuid: id }) },
    handler: async ({ request, body }) =>
      new ConversationService(await resolve(request, false)).open(body)
  });
}
