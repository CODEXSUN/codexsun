import { randomBytes, createHash } from "node:crypto";
import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { LeadContext, LeadIntake, LeadRecord } from "./lead.types.js";
export class LeadRepository {
  constructor(private readonly context: LeadContext) {}
  async accept(input: LeadIntake) {
    const ctx = this.context,
      hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    await sql`INSERT INTO crm_leads(uuid,company_id,submission_uuid,campaign_uuid,campaign_label,name,email,phone,message,source,assigned_to,payload_hash)
  VALUES(${randomBytes(4).toString("hex")},${ctx.companyId},${input.submissionUuid},${input.campaignUuid},${input.campaignLabel},${input.name},${input.email},${input.phone},${input.message},${input.source},${ctx.actorEmail},${hash}) ON DUPLICATE KEY UPDATE id=id`.execute(
      ctx.database
    );
    const saved = (
      await sql<{
        payload_hash: string;
        assigned_to: string;
      }>`SELECT payload_hash,assigned_to FROM crm_leads WHERE company_id=${ctx.companyId} AND submission_uuid=${input.submissionUuid}`.execute(
        ctx.database
      )
    ).rows[0];
    if (!saved || saved.payload_hash !== hash || saved.assigned_to !== ctx.actorEmail)
      throw AppError.conflict("The intake identity was reused with different content or owner.");
    return this.getBySubmission(input.submissionUuid);
  }
  async getBySubmission(uuid: string) {
    return (
      (
        await sql<LeadRecord>`SELECT uuid,company_id AS companyId,submission_uuid AS submissionUuid,campaign_uuid AS campaignUuid,campaign_label AS campaignLabel,name,email,phone,message,source,assigned_to AS assignedTo,status,task_id AS taskId FROM crm_leads WHERE company_id=${this.context.companyId} AND submission_uuid=${uuid} AND assigned_to=${this.context.actorEmail}`.execute(
          this.context.database
        )
      ).rows[0] ?? null
    );
  }
  async lock(uuid: string) {
    return (
      await sql<{
        uuid: string;
        taskId: number | null;
      }>`SELECT uuid,task_id AS taskId FROM crm_leads WHERE company_id=${this.context.companyId} AND submission_uuid=${uuid} AND assigned_to=${this.context.actorEmail} FOR UPDATE`.execute(
        this.context.database
      )
    ).rows[0];
  }
  async attachTask(uuid: string, taskId: number) {
    await sql`UPDATE crm_leads SET task_id=${taskId} WHERE uuid=${uuid} AND company_id=${this.context.companyId} AND assigned_to=${this.context.actorEmail}`.execute(
      this.context.database
    );
  }
  async get(uuid: string) {
    return (
      (
        await sql<LeadRecord>`SELECT uuid,company_id AS companyId,submission_uuid AS submissionUuid,campaign_uuid AS campaignUuid,campaign_label AS campaignLabel,name,email,phone,message,source,assigned_to AS assignedTo,status,task_id AS taskId FROM crm_leads WHERE uuid=${uuid} AND company_id=${this.context.companyId} AND assigned_to=${this.context.actorEmail}`.execute(
          this.context.database
        )
      ).rows[0] ?? null
    );
  }
  async list() {
    return (
      await sql<LeadRecord>`SELECT uuid,company_id AS companyId,submission_uuid AS submissionUuid,campaign_uuid AS campaignUuid,campaign_label AS campaignLabel,name,email,phone,message,source,assigned_to AS assignedTo,status,task_id AS taskId FROM crm_leads WHERE company_id=${this.context.companyId} AND assigned_to=${this.context.actorEmail} ORDER BY id DESC LIMIT 100`.execute(
        this.context.database
      )
    ).rows;
  }
}
