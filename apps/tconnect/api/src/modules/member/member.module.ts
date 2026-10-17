import { registerMemberRoutes } from "./member.routes.js";
export const memberModule = {
  capabilities: { events: false, worker: false, sync: false },
  key: "tconnect.member",
  register: registerMemberRoutes
};
export { registerMemberRoutes };
