import { AppError } from "@codexsun/framework/errors";
import { WorkReportRepository } from "./work-report.repository.js";
import type { WorkReportContext, WorkReportInput, WorkReportTarget } from "./work-report.types.js";
export class WorkReportService {
 private readonly repository: WorkReportRepository;
 constructor(private readonly context: WorkReportContext) { this.repository = new WorkReportRepository(context.database); }
 async list(target: WorkReportTarget) { await this.access(target, false); return this.repository.list(target); }
 async create(input: WorkReportInput) {
  await this.access(input, true);
  if (input.action === "assigned") throw AppError.forbidden("Assignments are created by the assignment workflow.");
  return this.repository.create(input, this.context);
 }
 private async access(target: WorkReportTarget, writing: boolean) {
  const resource = target.enquiryId !== null ? "enquiry" : "task";
  await this.context.authorize(`crm.${resource}.view`);
  const parent = await this.repository.target(target);
  let all = false;
  try { await this.context.authorize(`crm.${resource}.view-all`); all = true; }
  catch (error) { if (!(error instanceof AppError) || error.code !== "FORBIDDEN") throw error; }
  if (!all && parent.assigned_user_id !== this.context.actorUserId && (!writing && parent.created_by.toLowerCase() === this.context.actorEmail.toLowerCase()) === false)
   throw AppError.forbidden("Only the assignee or a work manager can report on this work.");
  if (writing) await this.context.authorize(resource === "task" ? "crm.task.work" : "crm.enquiry.update");
 }
}
