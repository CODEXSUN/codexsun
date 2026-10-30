import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerSessionRoutes } from "./session.routes.js";
import type { SessionService } from "./session.service.js";

export const sessionModule = {
  key: "sportsclub.session",
  label: "Sessions",
  register(
    app: FastifyInstance,
    resolveService: (request: FastifyRequest) => Promise<SessionService> | SessionService
  ) {
    return registerSessionRoutes(app, resolveService);
  }
};
