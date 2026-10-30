import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ResolveTconnectContext } from "../../context.js";
import { MessageService } from "./message.service.js";
import { messageInput, messageRecord, messagePage } from "./message.types.js";
export async function registerMessageRoutes(app: FastifyInstance, resolve: ResolveTconnectContext) {
  const id = z.string().regex(/^[0-9a-f]{8}$/);
  const params = z.object({ uuid: z.string().regex(/^[0-9a-f]{8}$/) }).strict();
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/conversation/:uuid/messages",
    schemas: {
      params,
      querystring: z.object({ before: id.optional() }).strict(),
      response: messagePage
    },
    handler: async ({ request, params, query }) =>
      new MessageService(await resolve(request, false)).messages(params.uuid, query.before)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/tconnect/conversation/:uuid/messages",
    schemas: { params, body: messageInput, response: messageRecord },
    handler: async ({ request, params, body }) =>
      new MessageService(await resolve(request, false)).send(params.uuid, body)
  });
}
