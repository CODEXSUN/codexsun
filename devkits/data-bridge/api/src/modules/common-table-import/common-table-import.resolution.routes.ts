import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { coreTableNames, type CommonTableImportHost } from "./common-table-import.types.js";
import { ConflictResolutionService } from "./common-table-import.resolution.service.js";

export const conflictResolutionSchema = z
  .object({
    id: z.string().uuid(),
    table: z.enum(coreTableNames),
    sourceId: z.number().int(),
    targetId: z.number().int(),
    targetUuid: z.string().nullable(),
    status: z.enum(["prepared", "committed"]),
    source: z.record(z.string(), z.unknown()),
    collection: z.record(z.string(), z.unknown()),
    references: z.array(
      z
        .object({
          field: z.string(),
          parentTable: z.string(),
          sourceId: z.number().int(),
          targetId: z.number().int(),
          sourceValue: z.unknown(),
          targetValue: z.unknown(),
          sourceKey: z.record(z.string(), z.unknown()),
          targetKey: z.record(z.string(), z.unknown())
        })
        .strict()
    ),
    prepared: z.record(z.string(), z.unknown()),
    before: z.record(z.string(), z.unknown()),
    changes: z.array(z.string()),
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/u),
    actor: z.string(),
    preparedAt: z.string(),
    committedAt: z.string().nullable()
  })
  .strict();

export function registerConflictResolutionRoutes(
  app: FastifyInstance,
  host: CommonTableImportHost
) {
  const service = new ConflictResolutionService(host);
  const params = z.object({ id: z.string().uuid() }).strict();
  registerContractRoute(app, {
    method: "POST",
    url: "/bulk-imports/:id/corrections/prepare",
    schemas: {
      params,
      body: z
        .object({ table: z.enum(coreTableNames), sourceId: z.number().int().positive() })
        .strict(),
      response: conflictResolutionSchema
    },
    handler: async ({ params, body, request }) =>
      service.prepare(params.id, body.table, body.sourceId, await host.authorize(request))
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/bulk-imports/:id/corrections/commit",
    schemas: {
      params,
      body: z
        .object({
          planId: z.string().uuid(),
          fingerprint: z.string().regex(/^[a-f0-9]{64}$/u),
          confirmed: z.literal(true)
        })
        .strict(),
      response: conflictResolutionSchema
    },
    handler: async ({ params, body, request }) =>
      service.commit(params.id, body.planId, body.fingerprint, await host.authorize(request))
  });
}
