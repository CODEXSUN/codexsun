import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Kysely } from "kysely";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { ActivitiesRepository } from "./activities.repository.js";
import { ActivitiesService } from "./activities.service.js";
import type { ActivitiesDatabase } from "./activities.types.js";

const textFilter = z.string().trim().max(191).default("");
const querySchema = z.object({
  scope: z.enum(["visible", "mine"]).default("visible"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(100),
  search: textFilter,
  contact: textFilter,
  enquiry: textFilter,
  allocatedTo: textFilter,
  listIn: textFilter,
  status: textFilter,
  action: textFilter,
  actor: textFilter,
  createdAfter: z.string().datetime().optional()
});
const itemSchema = z.object({
  id: z.number().int().positive(),
  enquiryId: z.number().int().positive(),
  enquiryNo: z.number().int().positive(),
  contact: z.string(),
  action: z.string(),
  details: z.string(),
  actor: z.string(),
  allocatedTo: z.string().nullable(),
  listIn: z.string().nullable(),
  status: z.string(),
  statusCode: z.string(),
  createdAt: z.string()
});

export function registerActivitiesRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<{
    database: Kysely<ActivitiesDatabase>;
    actorEmail: string;
    actorUserId: number | null;
    canViewAll: boolean;
  }>
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/activities/options",
    schemas: {
      response: z.object({ statuses: z.array(z.object({ name: z.string(), code: z.string() })) })
    },
    handler: async ({ request }) => {
      const scope = await context(request);
      const statuses = await new ActivitiesService(
        new ActivitiesRepository(scope.database)
      ).statuses();
      return { statuses };
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/activities",
    schemas: {
      querystring: querySchema,
      response: z.object({ items: z.array(itemSchema), total: z.number().int().nonnegative() })
    },
    handler: async ({ query, request }) => {
      const scope = await context(request);
      return new ActivitiesService(new ActivitiesRepository(scope.database)).list({
        ...query,
        ...scope
      });
    }
  });
}
