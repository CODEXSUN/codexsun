import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerDutyReportRoutes } from "./duty-report.routes.js";
import type { DutyReportContext } from "./duty-report.types.js";
export const dutyReportModule = { key:"crm.duty-report", register:(app:FastifyInstance,context:(request:FastifyRequest)=>Promise<DutyReportContext>)=>registerDutyReportRoutes(app,context) };
