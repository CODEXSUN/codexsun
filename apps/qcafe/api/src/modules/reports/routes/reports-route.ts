import type { FastifyInstance } from "fastify";
import { alertsResponseSchema, reportResponseSchema, reportScopeSchema } from "../contracts/reports.contract.js";
import { ReportsScopeError, ReportsService } from "../services/reports.service.js";

export async function registerReportsRoutes(app: FastifyInstance, service: ReportsService) {
  const handlers = {
    events: (query: Parameters<ReportsService["events"]>[0]) => service.events(query),
    items: (query: Parameters<ReportsService["items"]>[0]) => service.items(query),
    kitchen: (query: Parameters<ReportsService["kitchen"]>[0]) => service.kitchen(query),
    payments: (query: Parameters<ReportsService["payments"]>[0]) => service.payments(query),
    sales: (query: Parameters<ReportsService["sales"]>[0]) => service.sales(query),
    shifts: (query: Parameters<ReportsService["shifts"]>[0]) => service.shifts(query),
    stock: (query: Parameters<ReportsService["stock"]>[0]) => service.stock(query),
    tables: (query: Parameters<ReportsService["tables"]>[0]) => service.tables(query),
    taxes: (query: Parameters<ReportsService["taxes"]>[0]) => service.taxes(query),
  } as const;
  for (const [name, handler] of Object.entries(handlers)) {
    app.get(`/api/v1/qcafe/reports/${name}`, {
      schema: { querystring: reportScopeSchema, response: { 200: reportResponseSchema }, tags: ["Reports"] },
      handler: (request, reply) => run(reply, () => handler(reportScopeSchema.parse(request.query))),
    });
  }
  app.get("/api/v1/qcafe/reports/alerts", {
    schema: { querystring: reportScopeSchema, response: { 200: alertsResponseSchema }, tags: ["Reports"] },
    handler: (request, reply) => run(reply, () => service.alerts(reportScopeSchema.parse(request.query))),
  });
}

async function run(reply: unknown, work: () => Promise<unknown>) {
  const out = reply as { code: (status: number) => { send: (body: unknown) => unknown } };
  try {
    return await work();
  } catch (error) {
    if (error instanceof ReportsScopeError) return out.code(400).send({ error: error.message });
    throw error;
  }
}
