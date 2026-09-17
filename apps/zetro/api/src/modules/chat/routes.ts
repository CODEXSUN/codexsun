import {
  zetroApiVersion,
  zetroChatConversationListResponseSchema,
  zetroChatConversationResponseSchema,
  zetroCreateChatMessageSchema,
  zetroCreateConversationSchema,
} from "@codexsun/zetro-contracts";
import type { FastifyInstance } from "fastify";
import { ChatService, ConversationNotFoundError } from "./chat-service.js";

export async function registerChatRoutes(app: FastifyInstance, service: ChatService): Promise<void> {
  app.get("/api/zetro/v1/chat/conversations", async () =>
    zetroChatConversationListResponseSchema.parse({ data: { conversations: service.listConversations() }, version: zetroApiVersion }),
  );

  app.post("/api/zetro/v1/chat/conversations", async (request) => {
    const requestBody = zetroCreateConversationSchema.parse(request.body ?? {});
    return zetroChatConversationResponseSchema.parse({
      data: { conversation: service.createConversation(requestBody.title), messages: [] },
      version: zetroApiVersion,
    });
  });

  app.get<{ Params: { conversationId: string } }>("/api/zetro/v1/chat/conversations/:conversationId", async (request, reply) => {
    const result = service.getConversation(request.params.conversationId);
    if (!result) return reply.code(404).send({ error: "Conversation not found.", code: "zetro.conversation-not-found" });
    return zetroChatConversationResponseSchema.parse({ data: result, version: zetroApiVersion });
  });

  app.post<{ Params: { conversationId: string } }>("/api/zetro/v1/chat/conversations/:conversationId/messages", async (request, reply) => {
    const requestBody = zetroCreateChatMessageSchema.parse(request.body);
    try {
      const result = await service.sendMessage(request.params.conversationId, requestBody.content);
      return zetroChatConversationResponseSchema.parse({ data: result, version: zetroApiVersion });
    } catch (error) {
      if (error instanceof ConversationNotFoundError) {
        return reply.code(404).send({ error: error.message, code: "zetro.conversation-not-found" });
      }
      throw error;
    }
  });
}
