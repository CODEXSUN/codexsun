import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { registerContractRoute } from "@codexsun/framework/http";
import { DutyAssignmentRepository } from "./duty-assignment.repository.js";
import { DutyAssignmentService } from "./duty-assignment.service.js";
import type { DutyAssignmentContext } from "./duty-assignment.types.js";

const base = "/crm/duty-assignments";
const id = z.object({ id: z.coerce.number().int().positive() });
const input = z
  .object({
    sopItemId: z.number().int().positive(),
    revisionId: z.number().int().positive(),
    assigneeUserId: z.number().int().positive(),
    displayOrder: z.number().int().min(0),
    startDate: z.string().date(),
    endDate: z.string().date().nullable()
  })
  .strict();
const row = z.object({
  id: z.number(),
  uuid: z.string(),
  sopItemId: z.number(),
  revisionId: z.number(),
  assigneeUserId: z.number(),
  displayOrder: z.number(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  status: z.enum(["active", "inactive"]),
  frappeSyncStatus: z.enum(["pending", "processing", "failed", "synced"]).nullable(),
  frappeSyncError: z.string().nullable().optional(),
  assignedBy: z.string(),
  sopCode: z.string(),
  sopTitle: z.string(),
  itemCode: z.string(),
  itemTitle: z.string(),
  department: z.string(),
  frequency: z.string(),
  instructions: z.string(),
  evidenceGuidance: z.string(),
  assigneeName: z.string(),
  assigneeEmail: z.string(),
  createdAt: z.string()
});
export function registerDutyAssignmentRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<DutyAssignmentContext>
) {
  registerContractRoute(app, {
    method: "GET",
    url: base + "/options",
    schemas: {
      response: z.object({
        actorUserId: z.number().nullable(),
        canCreate: z.boolean(),
        canEdit: z.boolean(),
        canViewAll: z.boolean()
      })
    },
    handler: async ({ request }) => {
      const ctx = await context(request);
      await ctx.authorize("crm.duty.view.own");
      const allowed = async (permission: string) => {
        try {
          await ctx.authorize(permission);
          return true;
        } catch (error) {
          if (
            typeof error === "object" &&
            error !== null &&
            "statusCode" in error &&
            error.statusCode === 403
          )
            return false;
          throw error;
        }
      };
      return {
        actorUserId: ctx.actorUserId,
        canCreate: await allowed("crm.duty.assign"),
        canEdit: await allowed("crm.duty.manage"),
        canViewAll: await allowed("crm.duty.view.all")
      };
    }
  });
  registerContractRoute(app, {
    method: "PUT",
    url: base + "/:id",
    schemas: { params: id, body: input, response: row },
    handler: async ({ params, body, request }) => {
      const ctx = await context(request);
      await ctx.authorize("crm.duty.manage");
      const result = await new DutyAssignmentService(
        new DutyAssignmentRepository(ctx.database, ctx.notifyWork)
      ).update(params.id, body, ctx.actorEmail);
      await ctx.queueSync?.("duty-assignment", result.id);
      return result;
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/duty-users",
    schemas: {
      response: z.array(z.object({ id: z.number(), name: z.string(), email: z.string() }))
    },
    handler: async ({ request }) => {
      const ctx = await context(request);
      try {
        await ctx.authorize("crm.duty.assign");
      } catch (error) {
        if (!(error instanceof AppError) || error.statusCode !== 403) throw error;
        await ctx.authorize("crm.duty.view.all");
      }
      return ctx.database
        .selectFrom("app_users")
        .select(["id", "name", "email"])
        .where("status", "=", "active")
        .orderBy("name")
        .execute();
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/duties",
    schemas: { response: z.array(row) },
    handler: async ({ request }) => {
      const ctx = await context(request);
      await ctx.authorize("crm.duty.view.own");
      return new DutyAssignmentService(
        new DutyAssignmentRepository(ctx.database, ctx.notifyWork)
      ).listOwn(ctx.actorUserId);
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: base,
    schemas: { response: z.array(row) },
    handler: async ({ request }) => {
      const ctx = await context(request);
      await ctx.authorize("crm.duty.view.all");
      return new DutyAssignmentService(
        new DutyAssignmentRepository(ctx.database, ctx.notifyWork)
      ).listAll();
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: base,
    schemas: { body: input, response: row },
    handler: async ({ body, request }) => {
      const ctx = await context(request);
      await ctx.authorize("crm.duty.assign");
      const result = await new DutyAssignmentService(
        new DutyAssignmentRepository(ctx.database, ctx.notifyWork)
      ).create(body, ctx.actorEmail);
      await ctx.queueSync?.("duty-assignment", result.id);
      return result;
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: base + "/:id/deactivate",
    schemas: { params: id, response: z.object({ success: z.literal(true) }) },
    handler: async ({ params, request }) => {
      const ctx = await context(request);
      await ctx.authorize("crm.duty.manage");
      await new DutyAssignmentService(
        new DutyAssignmentRepository(ctx.database, ctx.notifyWork)
      ).deactivate(params.id);
      return { success: true as const };
    }
  });
}
