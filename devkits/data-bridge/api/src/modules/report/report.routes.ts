import { z } from "zod";
import { conflictResolutionSchema } from "./report.resolution.routes.js";
import type { FastifyInstance } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import type { CommonTableImportHost } from "../import-review/index.js";
import { coreTableNames } from "../import-review/index.js";
import { CommonBulkService } from "./report.bulk.service.js";

const pair = z
  .object({
    sourceId: z.coerce.number().int().positive(),
    targetTenantId: z.coerce.number().int().positive(),
    scope: z.enum(["common", "masters"]).default("common")
  })
  .strict();
const report = z
  .object({
    resolutions: z.array(conflictResolutionSchema).optional(),
    id: z.string().uuid(),
    scope: z.enum(["common", "masters"]).optional(),
    sourceId: z.number().int(),
    targetTenantId: z.number().int(),
    sourceDatabase: z.string(),
    targetDatabase: z.string(),
    actor: z.string(),
    at: z.string(),
    updatedAt: z.string(),
    status: z.enum(["queued", "running", "success", "warning", "failed"]),
    message: z.string(),
    tables: z.array(
      z
        .object({
          table: z.enum(coreTableNames),
          status: z.enum(["pending", "running", "success", "warning"]),
          sourceRows: z.number().int(),
          existing: z.number().int(),
          inserted: z.number().int(),
          message: z.string(),
          importId: z.string().uuid().nullable(),
          rows: z
            .array(
              z
                .object({
                  rowId: z.number().int(),
                  status: z.enum(["imported", "existing", "warning", "pending"]),
                  message: z.string(),
                  source: z.record(z.string(), z.unknown()),
                  target: z.record(z.string(), z.unknown()).nullable(),
                  collection: z.record(z.string(), z.unknown()).optional(),
                  prepared: z.record(z.string(), z.unknown()).optional()
                })
                .strict()
            )
            .optional(),
          attention: z.array(
            z.object({ rowId: z.number().int().nullable(), message: z.string() }).strict()
          )
        })
        .strict()
    )
  })
  .strict();

export function registerCommonBulkRoutes(app: FastifyInstance, host: CommonTableImportHost) {
  const service = new CommonBulkService(host);
  registerContractRoute(app, {
    method: "POST",
    url: "/bulk-imports",
    schemas: { body: pair, response: report },
    handler: async ({ body, request }) =>
      service.start(
        body.sourceId,
        body.targetTenantId,
        await host.authorize(request),
        request.id,
        body.scope
      )
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/bulk-imports/latest",
    schemas: { querystring: pair, response: report.nullable() },
    handler: ({ query }) => service.latest(query.sourceId, query.targetTenantId, query.scope)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/bulk-imports/:id",
    schemas: { params: z.object({ id: z.string().uuid() }).strict(), response: report },
    handler: ({ params }) => service.get(params.id)
  });
}
