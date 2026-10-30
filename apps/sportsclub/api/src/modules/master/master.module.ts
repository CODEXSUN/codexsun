import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerMasterRoutes } from "./master.routes.js";
import type { MasterService } from "./master.service.js";

export const masterModule = {
  key: "sportsclub.master",
  label: "Masters",
  register(
    app: FastifyInstance,
    resolveService: (request: FastifyRequest) => Promise<MasterService> | MasterService
  ) {
    return registerMasterRoutes(app, resolveService);
  }
};
