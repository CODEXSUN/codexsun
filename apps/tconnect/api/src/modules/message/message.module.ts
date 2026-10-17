import { registerMessageRoutes } from "./message.routes.js";
// Messages are immutable and remain in the conversation history.
export const messageModule = {
  key: "tconnect.message",
  capabilities: { events: false, worker: false, sync: false },
  register: registerMessageRoutes
};
export { registerMessageRoutes };
