import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { z } from "zod";
import type { DataMigrationHost } from "./migration.types.js";
import { MigrationService } from "./migration.service.js";

const idParams = z.object({ id: z.coerce.number().int().positive() }).strict();
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
    table: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u)
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
  app.get("/runs", async (request) => ok(await service.listRuns(), { requestId: request.id }));
  app.post("/preview", async (request) => {
    const input = transfer.parse(request.body);
    return ok(await service.preview(input.sourceId, input.targetTenantId, input.table), {
      requestId: request.id
    });
  });
  app.post("/runs", async (request) => {
    const input = transfer.parse(request.body);
    return ok(
      await service.copy(
        input.sourceId,
        input.targetTenantId,
        input.table,
        await host.authorize(request)
      ),
      { requestId: request.id }
    );
  });
}
