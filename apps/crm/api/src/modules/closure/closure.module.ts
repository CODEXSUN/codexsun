import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Kysely } from "kysely";
import { registerClosureRoutes } from "./closure.routes.js";
import type { ClosureDatabase } from "./closure.types.js";

export const closureModule = {
  key: "crm.closure",
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<{
      database: Kysely<ClosureDatabase>;
      actorEmail: string;
      actorUserId: number | null;
      canViewAll: boolean;
      canReview: boolean;
    }>
  ) => registerClosureRoutes(app, context)
};
