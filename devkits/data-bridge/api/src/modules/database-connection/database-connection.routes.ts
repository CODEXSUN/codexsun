import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import type { CommonTableImportHost } from "../import-review/index.js";
import { connectionPair } from "../transfer-session/index.js";
import { DatabaseConnectionService } from "./database-connection.service.js";

export function registerDatabaseConnectionRoutes(
  app: FastifyInstance,
  host: CommonTableImportHost
) {
  const service = new DatabaseConnectionService(host);
  registerContractRoute(app, {
    method: "POST",
    url: "/connections/verify",
    schemas: {
      body: connectionPair,
      response: connectionPair
        .extend({ sourceDatabase: z.string(), targetDatabase: z.string(), verifiedAt: z.string() })
        .strict()
    },
    handler: ({ body }) => service.verify(body.sourceId, body.targetTenantId)
  });
}
