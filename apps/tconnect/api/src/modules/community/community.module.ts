import type { FastifyInstance } from "fastify";
import type { ResolveTconnectContext } from "../../context.js";
import { registerCommunityRoutes } from "./community.routes.js";
export { registerCommunityRoutes };
export const communityModule = {
  capabilities: { events: false, worker: false, sync: false },
  key: "tconnect.community",
  register: (app: FastifyInstance, resolve: ResolveTconnectContext) =>
    registerCommunityRoutes(app, resolve)
};
