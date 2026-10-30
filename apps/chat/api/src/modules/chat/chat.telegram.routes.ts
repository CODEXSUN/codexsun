import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { ChatTelegramService } from "./chat.telegram.service.js";
import type { ChatModuleDependencies } from "./chat.types.js";

const account = z
  .object({
    uuid: z.string(),
    apiId: z.number(),
    phoneLabel: z.string(),
    accountLabel: z.string(),
    authState: z.string(),
    lastError: z.string().nullable(),
    lastSyncedAt: z.string().nullable()
  })
  .strict()
  .nullable();

export function registerChatTelegramRoutes(
  app: FastifyInstance,
  dependencies: ChatModuleDependencies
) {
  if (!dependencies.telegram) return;
  const service = new ChatTelegramService(dependencies, dependencies.telegram);
  registerContractRoute(app, {
    method: "GET",
    url: "/chat/telegram/account",
    schemas: { response: account },
    handler: ({ request }) => service.get(request)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/chat/telegram/account/send-code",
    schemas: {
      response: account,
      body: z
        .object({
          apiId: z.number().int().positive().max(2147483647),
          apiHash: z
            .string()
            .trim()
            .regex(/^[a-fA-F0-9]{32}$/),
          phone: z
            .string()
            .trim()
            .regex(/^\+[1-9]\d{6,14}$/)
        })
        .strict()
    },
    handler: ({ request, body }) => service.requestCode(request, body)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/chat/telegram/account/verify-code",
    schemas: {
      response: account,
      body: z
        .object({
          code: z
            .string()
            .trim()
            .regex(/^\d{4,8}$/)
        })
        .strict()
    },
    handler: ({ request, body }) => service.action(request, "verify-code", body.code)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/chat/telegram/account/verify-password",
    schemas: {
      response: account,
      body: z.object({ password: z.string().min(1).max(256) }).strict()
    },
    handler: ({ request, body }) => service.action(request, "verify-password", body.password)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/chat/telegram/account/disconnect",
    schemas: { response: account },
    handler: ({ request }) => service.action(request, "disconnect")
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/chat/telegram/dialogs/refresh",
    schemas: { response: account },
    handler: ({ request }) => service.action(request, "refresh")
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/chat/telegram/dialogs",
    schemas: {
      response: z.array(
        z
          .object({ uuid: z.string(), title: z.string(), channelUuid: z.string().nullable() })
          .strict()
      )
    },
    handler: ({ request }) => service.dialogs(request)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/chat/telegram/dialogs/:id/link",
    schemas: {
      params: z.object({ id: z.string().regex(/^[a-f0-9]{8}$/) }).strict(),
      body: z
        .object({
          channelUuid: z
            .string()
            .regex(/^[a-f0-9]{8}$/)
            .nullable()
        })
        .strict(),
      response: z.object({ linked: z.boolean() }).strict()
    },
    handler: ({ request, params, body }) => service.link(request, params.id, body.channelUuid)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/chat/telegram/conversations",
    schemas: {
      response: z.array(z.object({ channelUuid: z.string(), channelName: z.string() }).strict())
    },
    handler: ({ request }) => service.conversations(request)
  });
}
