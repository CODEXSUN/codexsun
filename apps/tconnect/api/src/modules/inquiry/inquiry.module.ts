import type { FastifyInstance } from "fastify";
import type { ResolveTconnectContext } from "../../context.js";
import { registerInquiryRoutes } from "./inquiry.routes.js";
export { registerInquiryRoutes };
export const inquiryModule = {
  capabilities: { events: false, worker: false, sync: false },
  key: "tconnect.inquiry",
  register: (app: FastifyInstance, resolve: ResolveTconnectContext) =>
    registerInquiryRoutes(app, resolve)
};
