import type { FastifyInstance } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import { CommonTableImportService } from "./common-table-import.service.js";
import { coreTableNames, type CommonTableImportHost } from "./common-table-import.types.js";

const selection = z
  .object({
    sourceId: z.coerce.number().int().positive(),
    targetTenantId: z.coerce.number().int().positive()
  })
  .strict();
const tableParams = z.object({ table: z.enum(coreTableNames) }).strict();
const importParams = z.object({ id: z.string().uuid() }).strict();
const pageQuery = selection
  .extend({ page: z.coerce.number().int().positive().default(1) })
  .strict();
const safeOption = z
  .object({
    id: z.number().int().positive(),
    label: z.string(),
    host: z.string(),
    port: z.number().int(),
    database: z.string(),
    user: z.string(),
    tlsMode: z.enum(["required", "disabled"]),
    verifiedAt: z.string().nullable()
  })
  .strict();
const tenantOption = z
  .object({ id: z.number().int().positive(), label: z.string(), database: z.string().optional() })
  .strict();
const summary = z
  .object({
    id: z.string().uuid(),
    sourceId: z.number().int().positive(),
    targetTenantId: z.number().int().positive(),
    table: z.enum(coreTableNames),
    sourceDatabase: z.string(),
    targetDatabase: z.string(),
    rowCount: z.number().int().nonnegative(),
    importedRows: z.number().int().nonnegative(),
    skippedRows: z.number().int().nonnegative(),
    status: z.enum(["reviewed", "imported", "failed"]),
    updatedAt: z.string()
  })
  .strict();
const option = z
  .object({
    table: z.enum(coreTableNames),
    sourceRows: z.number().int().nonnegative().nullable(),
    targetRows: z.number().int().nonnegative().nullable(),
    sourceAvailable: z.boolean(),
    targetAvailable: z.boolean(),
    sourceColumns: z.array(z.string()),
    targetColumns: z.array(z.string()),
    missingTargetColumns: z.array(z.string()),
    missingRequiredColumns: z.array(z.string()),
    mismatchedColumns: z.array(z.string()),
    compatible: z.boolean(),
    importStatus: z.enum(["reviewed", "imported", "failed"]).nullable()
  })
  .strict();
const report = z
  .object({
    phase: z.enum(["audit", "complete", "failed"]),
    at: z.string(),
    actor: z.string(),
    rows: z.array(
      z
        .object({
          rowNumber: z.number().int().positive(),
          status: z.enum(["ready", "existing", "conflict", "inserted", "warning", "rolled_back"]),
          message: z.string()
        })
        .strict()
    )
  })
  .strict();
const preview = z
  .object({
    sourceRows: z.number().int().nonnegative(),
    targetRows: z.number().int().nonnegative(),
    page: z.number().int(),
    pageSize: z.number().int(),
    columns: z.array(z.string()),
    missingRequiredColumns: z.array(z.string()),
    compatible: z.boolean(),
    source: z.array(z.record(z.string(), z.unknown())),
    target: z.array(z.record(z.string(), z.unknown())),
    schemaHash: z.string().length(64)
  })
  .strict();

export function registerCommonTableImportRoutes(app: FastifyInstance, host: CommonTableImportHost) {
  const service = new CommonTableImportService(host);
  registerContractRoute(app, {
    method: "GET",
    url: "/sources",
    schemas: { response: z.array(safeOption) },
    handler: () => service.listSources()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/tenants",
    schemas: { response: z.array(tenantOption) },
    handler: () => service.listTenants()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/imports",
    schemas: { response: z.array(summary) },
    handler: () => service.listImports()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/common-tables",
    schemas: {
      querystring: selection.extend({ scope: z.enum(["common", "masters"]).default("common") }),
      response: z.array(option)
    },
    handler: ({ query }) => service.listTables(query.sourceId, query.targetTenantId, query.scope)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/common-tables/:table/data",
    schemas: { params: tableParams, querystring: pageQuery, response: preview },
    handler: ({ params, query }) => service.preview({ ...query, table: params.table })
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/imports",
    schemas: {
      body: selection
        .extend({
          table: z.enum(coreTableNames),
          rowIds: z.array(z.number().int().positive()).min(1).max(10000),
          columns: z
            .array(z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u))
            .min(1)
            .max(200)
        })
        .strict(),
      response: z
        .object({ id: z.string().uuid(), status: z.literal("reviewed"), rows: z.number().int() })
        .strict()
    },
    handler: async ({ body, request }) =>
      service.save({ ...body, actor: await host.authorize(request) })
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/imports/:id",
    schemas: {
      params: importParams,
      response: summary
        .extend({
          columns: z.array(z.string()),
          schemaHash: z.string(),
          error: z.string().nullable(),
          report: report.nullable(),
          samples: z.array(
            z
              .object({ rowNumber: z.number().int(), data: z.record(z.string(), z.unknown()) })
              .strict()
          )
        })
        .strict()
    },
    handler: ({ params }) => service.getImport(params.id)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/imports/:id/rows",
    schemas: {
      params: importParams,
      querystring: z.object({ page: z.coerce.number().int().positive().default(1) }).strict(),
      response: z.array(
        z
          .object({
            rowNumber: z.number().int().positive(),
            data: z.record(z.string(), z.unknown())
          })
          .strict()
      )
    },
    handler: ({ params, query }) => service.getImportRows(params.id, query.page)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/imports/:id/audit",
    schemas: { params: importParams, response: report },
    handler: async ({ params, request }) =>
      service.auditSaved(params.id, await host.authorize(request))
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/imports/:id/run",
    schemas: {
      params: importParams,
      response: z
        .object({
          imported: z.number().int(),
          skipped: z.number().int(),
          status: z.literal("imported")
        })
        .strict()
    },
    handler: async ({ params, request }) =>
      service.importSaved(params.id, await host.authorize(request))
  });
}
