import { registerConversationRoutes } from "./conversation.routes.js";
// Threads start from requirements or enquiries and retain their history.
export const conversationModule = {
  key: "tconnect.conversation",
  capabilities: { events: false, worker: false, sync: false },
  register: registerConversationRoutes
};
export { registerConversationRoutes };
