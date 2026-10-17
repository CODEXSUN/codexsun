import { randomBytes } from "node:crypto";
import { sql, type Kysely, type Transaction } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { WorkReportDatabase, WorkReportInput, WorkReportTarget, WorkReportContext } from "./work-report.types.js";
export class WorkReportRepository {
 constructor(private readonly db: Kysely<WorkReportDatabase>) {}
 async target(target: WorkReportTarget, db: Kysely<WorkReportDatabase> = this.db, lock = false) {
  let query = target.enquiryId !== null
   ? db.selectFrom("crm_enquiries").select(["id", "title", "assigned_user_id", "created_by", "status_id"]).where("id", "=", target.enquiryId)
   : db.selectFrom("crm_tasks").select(["id", "title", "assigned_user_id", "created_by", "status_id"]).where("id", "=", target.taskId!);
  if (lock) query = query.forUpdate();
  const row = await query.executeTakeFirst();
  if (!row) throw AppError.notFound("Assigned work was not found.");
  return row;
 }
 async list(target: WorkReportTarget) {
  return this.db.selectFrom("crm_work_reports").selectAll()
   .where(target.enquiryId !== null ? "enquiry_id" : "task_id", "=", target.enquiryId ?? target.taskId!)
   .orderBy("id", "desc").limit(200).execute();
 }
 async create(input: WorkReportInput, context: WorkReportContext) {
  return this.db.transaction().execute(async (trx) => this.insert(trx, input, context));
 }
 async insert(trx: Transaction<WorkReportDatabase>, input: WorkReportInput, context: WorkReportContext) {
  const parent = await this.target(input, trx, true);
  const prior = await trx.selectFrom("crm_work_reports").selectAll().where("created_by", "=", context.actorEmail)
   .where("request_id", "=", input.requestId).executeTakeFirst();
  if (prior) {
   if (prior.enquiry_id !== input.enquiryId || prior.task_id !== input.taskId || prior.action !== input.action || prior.body !== input.body ||
    Number(prior.latitude) !== Number(input.latitude) || Number(prior.longitude) !== Number(input.longitude))
    throw AppError.conflict("This action retry key was already used for another report.");
   return prior;
  }
  if (input.action === "check-in" || input.action === "check-out") {
   const status = await trx.selectFrom("crm_enquiry_statuses").select("code").where("id", "=", parent.status_id).executeTakeFirst();
   if (status?.code === "closed") throw AppError.conflict("Closed work cannot accept a check-in or check-out.");
   const last = await trx.selectFrom("crm_work_reports").select("action")
    .where(input.enquiryId !== null ? "enquiry_id" : "task_id", "=", input.enquiryId ?? input.taskId!)
    .where("created_by", "=", context.actorEmail).where("action", "in", ["check-in", "check-out"]).orderBy("id", "desc").executeTakeFirst();
   if ((input.action === "check-in" && last?.action === "check-in") || (input.action === "check-out" && last?.action !== "check-in"))
    throw AppError.conflict(input.action === "check-in" ? "Check out before checking in again." : "Check in before checking out.");
  }
  const uuid = randomBytes(4).toString("hex");
  await trx.insertInto("crm_work_reports").values({uuid, enquiry_id: input.enquiryId, task_id: input.taskId,
   action: input.action, body: input.body, request_id: input.requestId, latitude: input.latitude === null ? null : String(input.latitude),
   longitude: input.longitude === null ? null : String(input.longitude), accuracy_meters: input.accuracyMeters === null ? null : String(input.accuracyMeters),
   captured_at: input.capturedAt === null ? null : new Date(input.capturedAt).toISOString().slice(0,19).replace("T", " "),
   created_by: context.actorEmail, created_at: sql`UTC_TIMESTAMP()`, updated_at: sql`UTC_TIMESTAMP()`}).execute();
  const people = await trx.selectFrom("app_users").select("email").where("status", "=", "active")
   .where((eb) => eb.or([eb("id", "=", parent.assigned_user_id ?? -1), eb("email", "=", parent.created_by)])).execute();
  const members = [...new Set(people.map((p) => p.email.toLowerCase()))];
  if (members.filter((email) => email !== context.actorEmail.toLowerCase()).length === 0) {
   const admins = await sql<{email: string}>`SELECT DISTINCT u.email FROM app_users u JOIN app_user_roles ur ON ur.user_id=u.id JOIN app_roles r ON r.id=ur.role_id WHERE u.status='active' AND r.status='active' AND ur.status='active' AND r.\`key\` IN ('admin','super-admin','manager')`.execute(trx);
   members.push(...admins.rows.map((p) => p.email.toLowerCase()));
  }
  const label = input.enquiryId !== null ? "Enquiry" : "Task";
  const reference = `${label.toLowerCase()}:${input.enquiryId ?? input.taskId}`;
  const location = input.latitude === null ? "" : `\nGPS: ${input.latitude}, ${input.longitude} (accuracy ${input.accuracyMeters ?? "unknown"} m)\nCaptured: ${input.capturedAt}`;
  await context.sendMessage?.(trx, {title: `${label}: ${parent.title}`.slice(0,120), reference,
   body: `${label} #${parent.id} · ${input.action}\n${input.body}${location}`, members: [...new Set([...members, context.actorEmail])], eventUuid: uuid});
  return trx.selectFrom("crm_work_reports").selectAll().where("uuid", "=", uuid).executeTakeFirstOrThrow();
 }
}
