import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import type { CommonTableImportHost } from "../import-review/index.js";
import {
  connectionPair,
  tableCatalogSchema,
  transferSessionSchema
} from "../transfer-session/index.js";
import { BillingTablesService } from "./billing-tables.service.js";
export function registerBillingTablesRoutes(app: FastifyInstance, host: CommonTableImportHost) {
  const service = new BillingTablesService(host);
  registerContractRoute(app, {
    method: "GET",
    url: "/billing-tables/transfers",
    schemas: { response: z.array(transferSessionSchema) },
    handler: () => service.list()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/billing-tables/catalog",
    schemas: { querystring: connectionPair, response: tableCatalogSchema },
    handler: ({ query }) => service.catalog(query.sourceId, query.targetTenantId)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/billing-tables/transfers",
    schemas: { body: connectionPair, response: transferSessionSchema },
    handler: async ({ body, request }) =>
      service.create(body.sourceId, body.targetTenantId, await host.authorize(request))
  });
}
