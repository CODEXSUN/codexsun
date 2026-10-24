import type { FastifyInstance } from "fastify";
import { ok, registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { DataMigrationHost } from "./migration.types.js";
import { MigrationService } from "./migration.service.js";

const idParams = z.object({ id: z.coerce.number().int().positive() }).strict();
const jobParams = z.object({ id: z.string().uuid() }).strict();
const auditQueueParams = z.object({ id: z.string().uuid() }).strict();
const jobTableParams = z
  .object({
    id: z.string().uuid(),
    sourceTable: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u)
  })
  .strict();
const auditQueueSummary = z
  .object({
    id: z.string().uuid(),
    jobId: z.string().uuid(),
    planHash: z.string().length(64),
    sessionName: z.string(),
    sourceTable: z.string(),
    targetTable: z.string(),
    selectedRows: z.number().int().nonnegative(),
    sourceDatabase: z.string(),
    targetDatabase: z.string(),
    status: z.enum(["queued", "reviewed", "stale"]),
    planStatus: z.enum(["generated", "finalized", "completed", "stale"]).nullable(),
    migrationStatus: z.enum(["draft", "running", "completed", "failed"]),
    queuedBy: z.string(),
    queuedAt: z.string(),
    reviewedBy: z.string().nullable(),
    reviewedAt: z.string().nullable()
  })
  .strict();
const auditQueueItem = auditQueueSummary
  .extend({
    queryDump: z.string(),
    samples: z.array(
      z
        .object({
          rowNumber: z.number().int().positive(),
          rowData: z.record(z.string(), z.unknown())
        })
        .strict()
    )
  })
  .strict();
const jobInput = z
  .object({
    sessionName: z.string().trim().min(1).max(120),
    sourceId: z.number().int().positive(),
    sourceTenantId: z.number().int().positive().nullable().default(null),
    targetTenantId: z.number().int().positive()
  })
  .strict();
const databaseName = z
  .string()
  .max(64)
  .refine((name) =>
    [...name].every((char) => char.charCodeAt(0) >= 32 && char !== "/" && char !== "\\")
  );
const transfer = z
  .object({
    sourceId: z.number().int().positive(),
    targetTenantId: z.number().int().positive(),
    table: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u),
    columnMappings: z
      .array(
        z
          .object({
            sourceColumn: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u),
            targetColumn: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u)
          })
          .strict()
      )
      .max(300)
      .optional()
  })
  .strict();
const analysisSelection = z
  .object({
    sourceId: z.number().int().positive(),
    targetTenantId: z.number().int().positive()
  })
  .strict();
const sourceFields = {
  label: z.string().trim().min(1).max(120),
  host: z.string().trim().min(1).max(253),
  port: z.number().int().min(1).max(65535),
  database: databaseName.default(""),
  user: z.string().trim().min(1).max(191),
  tlsMode: z.enum(["required", "disabled"])
};
const sourceInput = z.object({ ...sourceFields, password: z.string().min(1) }).strict();
const sourceUpdate = z.object({ ...sourceFields, password: z.string().min(1).optional() }).strict();

export async function registerMigrationRoutes(app: FastifyInstance, host: DataMigrationHost) {
  const service = new MigrationService(host);
  app.get("/tenants", async (request) =>
    ok(await service.listTenants(), { requestId: request.id })
  );
  app.get("/sources", async (request) =>
    ok(await service.listSources(), { requestId: request.id })
  );
  app.get("/current-connection", async (request) => {
    await host.authorize(request);
    const { host: address, port, user } = host.currentDatabase;
    return ok({ host: address, port, user }, { requestId: request.id });
  });
  app.post("/sources/current", async (request) =>
    ok(await service.addCurrentSource(await host.authorize(request)), { requestId: request.id })
  );
  app.post("/sources", async (request) =>
    ok(await service.addSource(sourceInput.parse(request.body), await host.authorize(request)), {
      requestId: request.id
    })
  );
  app.put("/sources/:id", async (request) =>
    ok(
      await service.updateSource(
        idParams.parse(request.params).id,
        sourceUpdate.parse(request.body),
        await host.authorize(request)
      ),
      { requestId: request.id }
    )
  );
  registerContractRoute(app, {
    method: "POST",
    url: "/sources/:id/copy",
    schemas: {
      params: idParams,
      body: sourceUpdate,
      response: z.object({ id: z.number().int().positive() }).strict()
    },
    handler: async ({ params, body, request }) =>
      service.copySource(params.id, body, await host.authorize(request))
  });
  app.post("/sources/:id/verify", async (request) =>
    ok(
      await service.verifySource(idParams.parse(request.params).id, await host.authorize(request)),
      { requestId: request.id }
    )
  );
  app.get("/sources/:id/databases", async (request) =>
    ok(await service.listDatabases(idParams.parse(request.params).id), { requestId: request.id })
  );
  app.post("/sources/:id/deactivate", async (request) =>
    ok(
      await service.deactivateSource(
        idParams.parse(request.params).id,
        await host.authorize(request)
      ),
      { requestId: request.id }
    )
  );
  app.post("/sources/:id/remove", async (request) =>
    ok(
      await service.removeSource(idParams.parse(request.params).id, await host.authorize(request)),
      { requestId: request.id }
    )
  );
  app.get("/sources/:id/tables", async (request) =>
    ok(await service.listTables(idParams.parse(request.params).id), { requestId: request.id })
  );
  app.get("/tenants/:id/tables", async (request) => {
    await host.authorize(request);
    return ok(await service.listTenantTables(idParams.parse(request.params).id), {
      requestId: request.id
    });
  });
  app.get("/tenants/:id/database", async (request) => {
    await host.authorize(request);
    const tenant = await host.resolveTenant(idParams.parse(request.params).id);
    return ok({ database: tenant.database }, { requestId: request.id });
  });
  app.get("/runs", async (request) => ok(await service.listRuns(), { requestId: request.id }));
  app.get("/jobs", async (request) => {
    await host.authorize(request);
    return ok(await service.listJobs(), { requestId: request.id });
  });
  app.post("/jobs", async (request) => {
    const input = jobInput.parse(request.body);
    const actor = await host.authorize(request);
    return ok(await service.createJob(input, actor), { requestId: request.id });
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/jobs/:id",
    schemas: {
      params: jobParams,
      body: z.object({}).strict(),
      response: z.object({ deleted: z.literal(true) }).strict()
    },
    handler: async ({ params, request }) => {
      await host.authorize(request);
      return service.deleteJob(params.id);
    }
  });
  app.patch("/jobs/:id", async (request) => {
    const { id } = jobParams.parse(request.params);
    const { sessionName } = z
      .object({ sessionName: z.string().trim().min(1).max(120) })
      .strict()
      .parse(request.body);
    const actor = await host.authorize(request);
    return ok(await service.renameJob(id, sessionName, actor), { requestId: request.id });
  });
  app.get("/jobs/:id/tables", async (request) => {
    await host.authorize(request);
    return ok(await service.getJobTables(jobParams.parse(request.params).id), {
      requestId: request.id
    });
  });
  app.get("/jobs/:id/query-plan", async (request) => {
    const { id } = jobParams.parse(request.params);
    await host.authorize(request);
    return ok(await service.getJobQueryPlan(id), { requestId: request.id });
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/jobs/:id/audit-handoff",
    schemas: {
      params: jobParams,
      body: z.object({ rowIds: z.array(z.number().int().positive()).min(1).max(100) }).strict(),
      response: auditQueueItem
    },
    handler: async ({ params, body, request }) => {
      const actor = await host.authorize(request);
      return service.handoffJobToAuditQueue(params.id, body.rowIds, actor);
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/audit-queue",
    schemas: { response: z.array(auditQueueSummary) },
    handler: async ({ request }) => {
      await host.authorize(request);
      return service.listAuditQueue();
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/audit-queue/:id",
    schemas: { params: auditQueueParams, response: auditQueueItem },
    handler: async ({ params, request }) => {
      await host.authorize(request);
      return service.getAuditQueueItem(params.id);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/audit-queue/:id/review",
    schemas: {
      params: auditQueueParams,
      body: z.object({}).strict(),
      response: auditQueueItem
    },
    handler: async ({ params, request }) => {
      const actor = await host.authorize(request);
      return service.markAuditQueueReviewed(params.id, actor);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/audit-queue/:id/run",
    schemas: {
      params: auditQueueParams,
      body: z.object({}).strict(),
      response: z
        .object({
          completed: z.array(
            z.object({ table: z.string(), copiedRows: z.number().int().nonnegative() }).strict()
          ),
          copiedRows: z.number().int().nonnegative()
        })
        .strict()
    },
    handler: async ({ params, request }) => {
      const actor = await host.authorize(request);
      return service.runReviewedMigration(params.id, actor);
    }
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/audit-queue/:id",
    schemas: {
      params: auditQueueParams,
      body: z.object({}).strict(),
      response: z.object({ deleted: z.literal(true) }).strict()
    },
    handler: async ({ params, request }) => {
      await host.authorize(request);
      return service.deleteAuditQueueItem(params.id);
    }
  });
  app.post("/jobs/:id/query-plan/generate", async (request) => {
    const { id } = jobParams.parse(request.params);
    z.object({})
      .strict()
      .parse(request.body ?? {});
    const actor = await host.authorize(request);
    return ok(await service.generateJobQueryPlan(id, actor), { requestId: request.id });
  });
  app.post("/jobs/:id/query-plan/finalize", async (request) => {
    const { id } = jobParams.parse(request.params);
    z.object({})
      .strict()
      .parse(request.body ?? {});
    const actor = await host.authorize(request);
    return ok(await service.finalizeJobQueryPlan(id, actor), { requestId: request.id });
  });
  app.get("/jobs/:id/query-batch", async (request) => {
    const { id } = jobParams.parse(request.params);
    await host.authorize(request);
    return ok(await service.getQueryBatch(id), { requestId: request.id });
  });
  app.post("/jobs/:id/query-batch", async (request) => {
    const { id } = jobParams.parse(request.params);
    const input = z
      .object({
        rows: z
          .array(
            z
              .object({
                sourceTable: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u),
                targetTable: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u),
                rowNumber: z.number().int().positive(),
                rowData: z.record(z.string(), z.unknown())
              })
              .strict()
          )
          .min(1)
          .max(100),
        fieldValues: z.record(
          z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u),
          z
            .object({
              mode: z.enum(["default", "custom", "foreign"]),
              value: z.unknown()
            })
            .strict()
        )
      })
      .strict()
      .parse(request.body);
    const actor = await host.authorize(request);
    return ok(await service.saveQueryBatch(id, input, actor), { requestId: request.id });
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/jobs/:id/query-batch",
    schemas: {
      params: jobParams,
      body: z.object({}).strict(),
      response: z.object({ deletedRows: z.number().int().nonnegative() }).strict()
    },
    handler: async ({ params, request }) => {
      await host.authorize(request);
      return service.deleteQueryBatch(params.id);
    }
  });
  app.put("/jobs/:id/tables", async (request) => {
    const params = jobParams.parse(request.params);
    const input = z
      .object({
        sourceTable: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u),
        targetTable: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u),
        columnMappings: transfer.shape.columnMappings
      })
      .strict()
      .parse(request.body);
    const actor = await host.authorize(request);
    return ok(
      await service.saveJobTable(
        params.id,
        {
          sourceTable: input.sourceTable,
          targetTable: input.targetTable,
          mappings: input.columnMappings ?? []
        },
        actor
      ),
      {
        requestId: request.id
      }
    );
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/jobs/:id/tables/:sourceTable",
    schemas: {
      params: jobTableParams,
      body: z.object({}).strict(),
      response: z.object({ deleted: z.literal(true) }).strict()
    },
    handler: async ({ params, request }) => {
      await host.authorize(request);
      return service.deleteJobTable(params.id, params.sourceTable);
    }
  });
  app.post("/analysis", async (request) => {
    const input = analysisSelection.parse(request.body);
    await host.authorize(request);
    return ok(await service.analyze(input.sourceId, input.targetTenantId), {
      requestId: request.id
    });
  });
  app.post("/preview", async (request) => {
    const input = transfer
      .extend({
        targetTable: z
          .string()
          .regex(/^[A-Za-z_][A-Za-z0-9_]*$/u)
          .optional()
      })
      .parse(request.body);
    await host.authorize(request);
    return ok(
      await service.preview(
        input.sourceId,
        input.targetTenantId,
        input.table,
        input.columnMappings,
        input.targetTable
      ),
      {
        requestId: request.id
      }
    );
  });
  app.post("/sample", async (request) => {
    const input = transfer
      .omit({ columnMappings: true })
      .extend({
        targetTable: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u),
        sourcePage: z.number().int().min(1).max(100000),
        targetPage: z.number().int().min(1).max(100000),
        sourceColumn: z
          .string()
          .regex(/^[A-Za-z_][A-Za-z0-9_]*$/u)
          .optional(),
        targetColumn: z
          .string()
          .regex(/^[A-Za-z_][A-Za-z0-9_]*$/u)
          .optional()
      })
      .refine(
        (value) => Boolean(value.sourceColumn) === Boolean(value.targetColumn),
        "Select both source and destination fields for a mapped-field preview."
      )
      .parse(request.body);
    await host.authorize(request);
    return ok(
      await service.sampleTableData(
        input.sourceId,
        input.targetTenantId,
        input.table,
        input.targetTable,
        input.sourcePage,
        input.targetPage,
        input.sourceColumn,
        input.targetColumn
      ),
      { requestId: request.id }
    );
  });
  app.post("/schema", async (request) => {
    const body = transfer
      .extend({
        targetTable: z
          .string()
          .regex(/^[A-Za-z_][A-Za-z0-9_]*$/u)
          .optional()
      })
      .parse(request.body);
    await host.authorize(request);
    return ok(
      await service.tableSchema(body.sourceId, body.targetTenantId, body.table, body.targetTable),
      {
        requestId: request.id
      }
    );
  });
}
