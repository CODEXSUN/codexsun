import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Kysely } from "kysely";
import { registerActivitiesRoutes } from "./activities.routes.js";
import type { ActivitiesDatabase } from "./activities.types.js";

export const activitiesModule = {
  key: "crm.activities",
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<{
      database: Kysely<ActivitiesDatabase>;
      actorEmail: string;
      actorUserId: number | null;
      canViewAll: boolean;
    }>
  ) => registerActivitiesRoutes(app, context)
};
