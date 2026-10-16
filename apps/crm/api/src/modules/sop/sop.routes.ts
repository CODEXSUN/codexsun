import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Kysely } from "kysely";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { SopRepository } from "./sop.repository.js";
import { SopService } from "./sop.service.js";
import type { SopItemDatabase } from "../sop-item/sop-item.types.js";

const path = "/crm/sops";
const idSchema = z.object({ id: z.coerce.number().int().positive() });
const inputSchema = z.object({ code: z.string().trim().min(1).max(64), title: z.string().trim().min(1).max(191), purpose: z.string().trim().min(1).max(4000) }).strict();
const recordSchema = inputSchema.extend({
  id: z.number().int().positive(), uuid: z.string(), status: z.enum(["active", "inactive"]),
  ownerUserId: z.number().int().positive().nullable(), createdBy: z.string(), updatedBy: z.string(),
  createdAt: z.string(), updatedAt: z.string()
});
export type SopRequestContext = {
  database: Kysely<SopItemDatabase>;
  actorEmail: string;
  actorUserId: number | null;
  authorize: (permission: string) => Promise<void>;
  queueSync?: (entity: "sop-item" | "duty-assignment" | "duty-report", id: number) => Promise<void>;
};

export function registerSopRoutes(app: FastifyInstance, context: (request: FastifyRequest) => Promise<SopRequestContext>) {
  registerContractRoute(app, {
    method: "GET", url: path,
    schemas: { querystring: z.object({ search: z.string().trim().max(191).default("") }), response: z.array(recordSchema) },
    handler: async ({ query, request }) => {
      const scope = await context(request); await scope.authorize("crm.sop.view");
      return new SopService(new SopRepository(scope.database)).list(query.search);
    }
  });
  registerContractRoute(app, {
    method: "POST", url: path,
    schemas: { body: inputSchema, response: recordSchema },
    handler: async ({ body, request }) => {
      const scope = await context(request); await scope.authorize("crm.sop.create");
      const result = await new SopService(new SopRepository(scope.database)).create(body, scope.actorEmail, scope.actorUserId);
      return result!;
    }
  });
  registerContractRoute(app, {
    method: "PUT", url: path + "/:id",
    schemas: { params: idSchema, body: inputSchema, response: recordSchema },
    handler: async ({ params, body, request }) => {
      const scope = await context(request); await scope.authorize("crm.sop.update");
      const result = await new SopService(new SopRepository(scope.database)).update(params.id, body, scope.actorEmail);
      if (result) {
        const items = await scope.database.selectFrom("crm_sop_items").select("id").where("sop_id", "=", params.id).execute();
        for (const item of items) await scope.queueSync?.("sop-item", item.id);
      }
      return result!;
    }
  });
  registerContractRoute(app, {
    method: "POST", url: path + "/:id/deactivate",
    schemas: { params: idSchema, response: recordSchema },
    handler: async ({ params, request }) => {
      const scope = await context(request); await scope.authorize("crm.sop.deactivate");
      const result = await new SopService(new SopRepository(scope.database)).setActive(params.id, false, scope.actorEmail);
      return result!;
    }
  });
  registerContractRoute(app, {
    method: "POST", url: path + "/:id/activate",
    schemas: { params: idSchema, response: recordSchema },
    handler: async ({ params, request }) => {
      const scope = await context(request); await scope.authorize("crm.sop.update");
      const result = await new SopService(new SopRepository(scope.database)).setActive(params.id, true, scope.actorEmail);
      return result!;
    }
  });
}
