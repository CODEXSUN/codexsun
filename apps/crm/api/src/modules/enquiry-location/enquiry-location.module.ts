import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Kysely } from "kysely";
import { registerEnquiryLocationRoutes } from "./enquiry-location.routes.js";
import type { EnquiryLocationDatabase } from "./enquiry-location.types.js";

export const enquiryLocationModule = {
  key: "crm.enquiry-location",
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<{
      database: Kysely<EnquiryLocationDatabase>;
      actorEmail: string;
      actorUserId: number | null;
      canViewAll: boolean;
    }>
  ) => registerEnquiryLocationRoutes(app, context)
};
