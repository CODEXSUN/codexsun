import { conversationInput } from "./conversation.schema";
import type { ConversationInput } from "./conversation.types";
import type { TconnectGateway } from "../../workspace.types";
export const loadConversations = (gateway: TconnectGateway) => gateway.conversation.list();
export const openConversation = (gateway: TconnectGateway, input: ConversationInput) =>
  gateway.conversation.open(conversationInput.parse(input));
