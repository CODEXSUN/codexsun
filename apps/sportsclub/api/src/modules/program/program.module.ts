import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerProgramRoutes } from "./program.routes.js";
import type { ProgramService } from "./program.service.js";

export const programModule = {
  key: "sportsclub.program",
  label: "Programs",
  register(
    app: FastifyInstance,
    resolveService: (request: FastifyRequest) => Promise<ProgramService> | ProgramService
  ) {
    return registerProgramRoutes(app, resolveService);
  }
};
