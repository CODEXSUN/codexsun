import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import type { CommonTableImportHost } from "../import-review/index.js";
import { ReportService } from "./report.service.js";
export function registerReportHistoryRoutes(app: FastifyInstance, host: CommonTableImportHost) {
  const service = new ReportService(host);
  registerContractRoute(app, {
    method: "GET",
    url: "/reports",
    schemas: {
      response: z.array(
        z
          .object({
            id: z.string().uuid(),
            type: z.enum(["transfer", "review", "bulk"]),
            group: z.string(),
            sourceDatabase: z.string(),
            targetDatabase: z.string(),
            table: z.string(),
            rows: z.number().int(),
            status: z.string(),
            updatedAt: z.string(),
            stage: z.number().int()
          })
          .strict()
      )
    },
    handler: () => service.list()
  });
}
