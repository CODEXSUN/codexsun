import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerProgressRoutes } from "./progress.routes.js";
import type { ProgressService } from "./progress.service.js";

export const progressModule = {
  key: "sportsclub.progress",
  label: "Progress",
  register(
    app: FastifyInstance,
    resolveService: (request: FastifyRequest) => Promise<ProgressService> | ProgressService
  ) {
    return registerProgressRoutes(app, resolveService);
  }
};
