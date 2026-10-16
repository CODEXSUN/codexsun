import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { ChatService } from "./chat.service.js";
import type {
  ChatChannelListFilters,
  ChatMessageListFilters,
  ChatModuleDependencies
} from "./chat.types.js";

const channelKindSchema = z.enum(["channel", "dm", "group", "broadcast"]);
const attachmentSchema = z
  .object({
    base64: z.string().min(1),
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(120)
  })
  .strict();
const channelSaveSchema = z
  .object({
    kind: channelKindSchema.default("channel"),
    members: z.array(z.email().max(191)).max(200).default([]),
    name: z.string().trim().min(1, "Channel name is required.").max(120)
  })
  .strict();
const channelRenameSchema = z
  .object({ name: z.string().trim().min(1, "Channel name is required.").max(120) })
  .strict();
const messageSaveSchema = z
  .object({
    attachments: z.array(attachmentSchema).max(5).default([]),
    body: z.string(),
    channelUuid: z.string().min(1).max(80),
    replyToUuid: z.string().min(1).max(80).optional()
  })
  .strict();
const messageUpdateSchema = z
  .object({ body: z.string().trim().min(1, "Message body is required.") })
  .strict();
const idSchema = z.object({ id: z.string().min(1).max(80) }).strict();
const statusSchema = z.enum(["active", "inactive"]);
const channelSchema = z
  .object({
    createdAt: z.string(),
    id: z.number(),
    kind: channelKindSchema,
    lastMessageAt: z.string().nullable(),
    lastMessagePreview: z.string().nullable(),
    messageCount: z.number(),
    name: z.string(),
    status: statusSchema,
    unreadCount: z.number(),
    updatedAt: z.string(),
    uuid: z.string()
  })
  .strict();
const messageSchema = z
  .object({
    attachments: z.array(
      z
        .object({
          contentBase64: z.string(),
          fileName: z.string(),
          id: z.number(),
          mimeType: z.string(),
          sizeBytes: z.number(),
          uuid: z.string()
        })
        .strict()
    ),
    body: z.string(),
    channelUuid: z.string(),
    createdAt: z.string(),
    editedAt: z.string().nullable(),
    id: z.number(),
    reactions: z.array(
      z.object({ count: z.number(), emoji: z.string(), own: z.boolean() }).strict()
    ),
    reply: z
      .object({ body: z.string(), senderEmail: z.string(), uuid: z.string() })
      .strict()
      .nullable(),
    senderEmail: z.string(),
    status: statusSchema,
    updatedAt: z.string(),
    uuid: z.string()
  })
  .strict();
const memberSchema = z
  .object({
    createdAt: z.string(),
    id: z.number(),
    role: z.enum(["admin", "member"]),
    status: statusSchema,
    userEmail: z.string(),
    uuid: z.string()
  })
  .strict();
const memberSaveSchema = z
  .object({
    role: z.enum(["admin", "member"]).default("member"),
    userEmail: z.email().max(191)
  })
  .strict();
const memberIdSchema = z
  .object({ id: z.string().min(1).max(80), memberUuid: z.string().min(1).max(80) })
  .strict();
const channelDetailSchema = z
  .object({
    channel: channelSchema,
    members: z.array(memberSchema),
    messages: z.array(messageSchema)
  })
  .strict();
const userSchema = z
  .object({
    email: z.string(),
    name: z.string()
  })
  .strict();

export function registerChatRoutes(app: FastifyInstance, dependencies: ChatModuleDependencies) {
  const service = new ChatService(dependencies, dependencies.events);
  registerContractRoute(app, {
    method: "GET",
    url: "/chat/users",
    schemas: {
      querystring: z.object({ search: z.string().optional() }).strict(),
      response: z.array(userSchema)
    },
    handler: ({ query, request }) => service.listUsers(request, query.search)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/chat/channels",
    schemas: {
      querystring: z
        .object({
          limit: z.coerce.number().int().positive().max(200).optional(),
          search: z.string().optional()
        })
        .strict(),
      response: z.array(channelSchema)
    },
    handler: ({ query, request }) => service.listChannels(request, channelFilters(query))
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/chat/channels/:id",
    schemas: { params: idSchema, response: channelDetailSchema },
    handler: ({ params, request }) => service.getChannel(request, params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/chat/channels",
    schemas: { body: channelSaveSchema, response: channelSchema },
    handler: ({ body, request }) => service.createChannel(request, body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/chat/channels/:id",
    schemas: { body: channelRenameSchema, params: idSchema, response: channelSchema },
    handler: ({ body, params, request }) => service.updateChannel(request, params.id, body)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/chat/channels/:id/suspend",
    schemas: { params: idSchema, response: channelSchema },
    handler: ({ params, request }) => service.suspendChannel(request, params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/chat/channels/:id/restore",
    schemas: { params: idSchema, response: channelSchema },
    handler: ({ params, request }) => service.restoreChannel(request, params.id)
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/chat/channels/:id",
    schemas: { params: idSchema, response: z.object({ uuid: z.string() }).strict() },
    handler: ({ params, request }) => service.forceDeleteChannel(request, params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/chat/channels/:id/read",
    schemas: { params: idSchema, response: z.object({ uuid: z.string() }).strict() },
    handler: ({ params, request }) => service.markRead(request, params.id)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/chat/channels/:id/members",
    schemas: { params: idSchema, response: z.array(memberSchema) },
    handler: ({ params, request }) => service.listMembers(request, params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/chat/channels/:id/members",
    schemas: { body: memberSaveSchema, params: idSchema, response: memberSchema },
    handler: ({ body, params, request }) => service.addMember(request, params.id, body)
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/chat/channels/:id/members/:memberUuid",
    schemas: { params: memberIdSchema, response: z.object({ uuid: z.string() }).strict() },
    handler: ({ params, request }) => service.removeMember(request, params.id, params.memberUuid)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/chat/messages",
    schemas: {
      querystring: z
        .object({
          channelUuid: z.string().min(1).max(80),
          limit: z.coerce.number().int().positive().max(200).optional()
        })
        .strict(),
      response: z.array(messageSchema)
    },
    handler: ({ query, request }) => service.listMessages(request, messageFilters(query))
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/chat/messages/:id",
    schemas: { params: idSchema, response: messageSchema },
    handler: ({ params, request }) => service.getMessage(request, params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/chat/messages",
    schemas: { body: messageSaveSchema, response: messageSchema },
    handler: ({ body, request }) => service.createMessage(request, body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/chat/messages/:id",
    schemas: { body: messageUpdateSchema, params: idSchema, response: messageSchema },
    handler: ({ body, params, request }) => service.updateMessage(request, params.id, body)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/chat/messages/:id/reactions",
    schemas: {
      body: z.object({ emoji: z.string().min(1).max(16) }).strict(),
      params: idSchema,
      response: messageSchema
    },
    handler: ({ body, params, request }) => service.toggleReaction(request, params.id, body.emoji)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/chat/messages/:id/suspend",
    schemas: { params: idSchema, response: messageSchema },
    handler: ({ params, request }) => service.suspendMessage(request, params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/chat/messages/:id/restore",
    schemas: { params: idSchema, response: messageSchema },
    handler: ({ params, request }) => service.restoreMessage(request, params.id)
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/chat/messages/:id",
    schemas: { params: idSchema, response: z.object({ uuid: z.string() }).strict() },
    handler: ({ params, request }) => service.forceDeleteMessage(request, params.id)
  });
}

function channelFilters(
  input: { limit?: number | undefined; search?: string | undefined } | undefined
): ChatChannelListFilters {
  return {
    ...(input?.limit !== undefined ? { limit: input.limit } : {}),
    ...(input?.search !== undefined ? { search: input.search } : {})
  };
}

function messageFilters(input: {
  channelUuid: string;
  limit?: number | undefined;
}): ChatMessageListFilters {
  return {
    channelUuid: input.channelUuid,
    ...(input.limit !== undefined ? { limit: input.limit } : {})
  };
}
