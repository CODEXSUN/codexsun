import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { WorkReportService } from "./work-report.service.js";
import type { WorkReportContext } from "./work-report.types.js";
const target = z
  .object({
    enquiryId: z.coerce.number().int().positive().nullable().default(null),
    taskId: z.coerce.number().int().positive().nullable().default(null)
  })
  .refine((v) => (v.enquiryId === null) !== (v.taskId === null), "Select one enquiry or task.");
export const workReportInput = z
  .object({
    enquiryId: z.number().int().positive().nullable(),
    taskId: z.number().int().positive().nullable(),
    action: z.enum(["check-in", "check-out", "report", "charge", "collection"]),
    body: z.string().trim().max(10000).default(""),
    amount: z.number().finite().positive().max(999999999999.99).nullable().default(null),
    requestId: z.string().min(8).max(80),
    latitude: z.number().finite().min(-90).max(90).nullable().default(null),
    longitude: z.number().finite().min(-180).max(180).nullable().default(null),
    accuracyMeters: z.number().finite().min(0).max(100000).nullable().default(null),
    capturedAt: z.iso.datetime({ offset: true }).nullable().default(null)
  })
  .strict()
  .refine((v) => (v.enquiryId === null) !== (v.taskId === null), "Select one enquiry or task.")
  .refine(
    (v) =>
      v.action === "report"
        ? v.body.length > 0 && v.amount === null
        : v.action === "charge" || v.action === "collection"
          ? v.amount !== null &&
            v.latitude === null &&
            v.longitude === null &&
            (v.action === "charge" || v.body.length > 0)
          : v.amount === null &&
            v.latitude !== null &&
            v.longitude !== null &&
            v.capturedAt !== null,
    "Reports need text, charges need a positive amount, collections need notes, and check-in/out need a captured GPS location."
  );
const row = z.object({
  id: z.number(),
  uuid: z.string(),
  enquiry_id: z.number().nullable(),
  task_id: z.number().nullable(),
  action: z.string(),
  comment_id: z.number().nullable().optional(),
  body: z.string(),
  amount: z.union([z.string(), z.number()]).nullable(),
  request_id: z.string(),
  latitude: z.union([z.string(), z.number()]).nullable(),
  longitude: z.union([z.string(), z.number()]).nullable(),
  accuracy_meters: z.union([z.string(), z.number()]).nullable(),
  captured_at: z.union([z.string(), z.date()]).nullable(),
  created_by: z.string(),
  created_by_name: z.string().optional(),
  created_at: z.union([z.string(), z.date()]),
  updated_at: z.union([z.string(), z.date()]),
  status: z.string()
});
export function registerWorkReportRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<WorkReportContext>
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/work-reports/pending-collections",
    schemas: { response: z.object({ items: z.array(z.number().int().positive()) }) },
    handler: async ({ request }) => ({
      items: await new WorkReportService(await context(request)).pendingEnquiryCollectionIds()
    })
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/work-reports",
    schemas: { querystring: target, response: z.array(row) },
    handler: async ({ request, query }) => new WorkReportService(await context(request)).list(query)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/work-reports/checkpoint",
    schemas: { querystring: target, response: z.object({ checkedIn: z.boolean() }) },
    handler: async ({ request, query }) =>
      new WorkReportService(await context(request)).checkpoint(query)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/work-reports/history",
    schemas: {
      querystring: z
        .object({
          enquiryId: z.coerce.number().int().positive().nullable().default(null),
          taskId: z.coerce.number().int().positive().nullable().default(null),
          page: z.coerce.number().int().positive().default(1),
          pageSize: z.coerce.number().int().min(1).max(100).default(100),
          filter: z.enum(["all", "checkpoints", "charges"]).default("all")
        })
        .refine(
          (v) => (v.enquiryId === null) !== (v.taskId === null),
          "Select one enquiry or task."
        ),
      response: z.object({
        items: z.array(row),
        total: z.number(),
        page: z.number(),
        pageSize: z.number(),
        amounts: z.object({ charges: z.number(), collections: z.number() })
      })
    },
    handler: async ({ request, query }) =>
      new WorkReportService(await context(request)).history(
        query,
        query.page,
        query.pageSize,
        query.filter
      )
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/work-reports",
    schemas: { body: workReportInput, response: row },
    handler: async ({ request, body }) => new WorkReportService(await context(request)).create(body)
  });
}
