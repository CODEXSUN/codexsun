import { sopFrequencies } from "../sop-item/index.js";
import { DutyReportSummaryRepository } from "./duty-report.summary.js";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { AppError } from "@codexsun/framework/errors";
import { DutyReportRepository } from "./duty-report.repository.js";
import { DutyReportService } from "./duty-report.service.js";
import type { DutyReportContext } from "./duty-report.types.js";
const input = z
  .object({
    assignmentId: z.number().int().positive(),
    performedDate: z.string().date(),
    actions: z.string().trim().min(1).max(10000),
    result: z.enum(["completed", "blocked"]),
    issueDetails: z.string().trim().max(4000).default("")
  })
  .strict();
const row = z.object({
  id: z.number(),
  uuid: z.string(),
  assignmentId: z.number(),
  revisionId: z.number(),
  assigneeUserId: z.number(),
  performedDate: z.string(),
  recurrenceKey: z.string(),
  actions: z.string(),
  result: z.enum(["completed", "blocked"]),
  frappeSyncStatus: z.enum(["pending", "processing", "failed", "synced"]).nullable(),
  issueDetails: z.string(),
  submittedBy: z.string(),
  createdAt: z.string(),
  itemTitle: z.string(),
  sopTitle: z.string(),
  assigneeName: z.string(),
  department: z.string(),
  instructions: z.string(),
  frequency: z.string()
});
export function registerDutyReportRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<DutyReportContext>
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/duty-reports/summary",
    schemas: {
      querystring: z
        .object({
          view: z.enum(["sop", "user", "department", "frequency"]).default("sop"),
          search: z.string().trim().max(191).default(""),
          from: z.string().date().optional(),
          to: z.string().date().optional()
        })
        .strict(),
      response: z.array(
        z.object({
          key: z.string(),
          label: z.string(),
          total: z.number(),
          completed: z.number(),
          blocked: z.number()
        })
      )
    },
    handler: async ({ query, request }) => {
      const ctx = await context(request);
      await ctx.authorize("crm.duty-report.view.all");
      if (query.from && query.to && query.from > query.to)
        throw AppError.validation("From date must be on or before to date.");
      return new DutyReportSummaryRepository(ctx.database).list(query.view, query);
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/duty-reports/options",
    schemas: {
      response: z.object({
        actorUserId: z.number().nullable(),
        canCreate: z.boolean(),
        canViewAll: z.boolean()
      })
    },
    handler: async ({ request }) => {
      const ctx = await context(request);
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
      const canViewAll = await allowed("crm.duty-report.view.all");
      if (!canViewAll) await ctx.authorize("crm.duty-report.view.own");
      return {
        actorUserId: ctx.actorUserId,
        canCreate: await allowed("crm.duty-report.create.own"),
        canViewAll
      };
    }
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/crm/duty-reports/:id",
    schemas: {
      params: z.object({ id: z.coerce.number().int().positive() }),
      body: z
        .object({ performedDate: z.string().date(), actions: z.string().trim().min(1).max(10000) })
        .strict(),
      response: row
    },
    handler: async ({ params, body, request }) => {
      const ctx = await context(request);
      await ctx.authorize("crm.duty-report.create.own");
      const result = await new DutyReportService(
        new DutyReportRepository(ctx.database, ctx.notifyWork)
      ).update(params.id, body, ctx.actorUserId, ctx.actorEmail);
      await ctx.queueSync?.("duty-report", result.id);
      return result;
    }
  });
  const reportQuery = z
    .object({
      scope: z.enum(["own", "all"]).default("own"),
      search: z.string().trim().max(191).default(""),
      from: z.string().date().optional(),
      to: z.string().date().optional(),
      assigneeId: z.coerce.number().int().positive().optional(),
      sopItemId: z.coerce.number().int().positive().optional(),
      department: z.string().max(120).optional(),
      frequency: z.enum(sopFrequencies).optional(),
      result: z.enum(["completed", "blocked"]).optional(),
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(100)
    })
    .strict();
  const reportResponse = z.object({
    items: z.array(row),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    summary: z.object({
      total: z.number().int().nonnegative(),
      completed: z.number().int().nonnegative(),
      blocked: z.number().int().nonnegative()
    })
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/duty-reports",
    schemas: { querystring: reportQuery, response: reportResponse },
    handler: async ({ query, request }) => {
      const ctx = await context(request);
      let userId: number | undefined;
      if (query.scope === "all") await ctx.authorize("crm.duty-report.view.all");
      else {
        await ctx.authorize("crm.duty-report.view.own");
        if (!ctx.actorUserId)
          throw AppError.forbidden("An active CRM user is required to view own reports.");
        userId = ctx.actorUserId;
      }
      if (query.from && query.to && query.from > query.to)
        throw AppError.validation("From date must be on or before to date.");
      return new DutyReportService(new DutyReportRepository(ctx.database, ctx.notifyWork)).list({
        search: query.search,
        page: query.page,
        pageSize: query.pageSize,
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
        ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
        ...(query.result ? { result: query.result } : {}),
        ...(query.sopItemId ? { sopItemId: query.sopItemId } : {}),
        ...(query.department !== undefined ? { department: query.department } : {}),
        ...(query.frequency !== undefined ? { frequency: query.frequency } : {}),
        ...(userId === undefined ? {} : { userId })
      });
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/duty-reports",
    schemas: { body: input, response: row },
    handler: async ({ body, request }) => {
      const ctx = await context(request);
      await ctx.authorize("crm.duty-report.create.own");
      const assignment = await ctx.database
        .selectFrom("crm_duty_assignments")
        .innerJoin("crm_sop_items", "crm_sop_items.id", "crm_duty_assignments.sop_item_id")
        .select("crm_sop_items.frequency")
        .where("crm_duty_assignments.id", "=", body.assignmentId)
        .executeTakeFirst();
      if (!assignment) throw AppError.notFound("Duty assignment was not found.");
      const result = await new DutyReportService(
        new DutyReportRepository(ctx.database, ctx.notifyWork)
      ).create(body, ctx.actorUserId, ctx.actorEmail, assignment.frequency);
      await ctx.queueSync?.("duty-report", result.id);
      return result;
    }
  });
}
