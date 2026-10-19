import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerEventRoutes } from "./event.routes.js";
import type { EventService } from "./event.service.js";

export const eventModule = {
  key: "sportsclub.event",
  label: "Events",
  register(
    app: FastifyInstance,
    resolveService: (request: FastifyRequest) => Promise<EventService> | EventService
  ) {
    return registerEventRoutes(app, resolveService);
  }
};
