import { createHash, randomBytes } from "node:crypto";
import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { MarketingContext } from "../../context.js";
import type { SubmissionInput, SubmissionRecord, CaptureSnapshot } from "./submission.types.js";
export class SubmissionRepository {
  constructor(private readonly ctx: MarketingContext) {}
  async accept(input: SubmissionInput, capture: CaptureSnapshot, campaignLabel: string) {
    const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    await sql`INSERT INTO marketing_submissions(uuid,company_id,brand_uuid,capture_uuid,campaign_uuid,campaign_label,source_key,payload_hash,name,email,phone,message,source_reference,source_consented_at,source_notice_version,privacy_consent,notice_version,consent_notice,created_by)
 VALUES(${randomBytes(4).toString("hex")},${this.ctx.companyId},${capture.brandUuid},${capture.uuid},${capture.campaignUuid},${campaignLabel},${input.sourceKey},${hash},${input.name},${input.email},${input.phone},${input.message},${input.sourceReference ?? ""},${input.sourceConsentAt ?? ""},${input.sourceNoticeVersion ?? "unknown"},TRUE,${capture.noticeVersion},${capture.consentNotice},${this.ctx.actorEmail}) ON DUPLICATE KEY UPDATE id=id`.execute(
      this.ctx.database
    );
    const existing = (
      await sql<{
        uuid: string;
        payload_hash: string;
      }>`SELECT uuid,payload_hash FROM marketing_submissions WHERE company_id=${this.ctx.companyId} AND capture_uuid=${capture.uuid} AND source_key=${input.sourceKey}`.execute(
        this.ctx.database
      )
    ).rows[0];
    if (!existing || existing.payload_hash !== hash)
      throw AppError.conflict("Submission key was reused with different content.");
    return this.get(existing.uuid);
  }
  async get(uuid: string) {
    return (await this.list(100, 0, uuid))[0] ?? null;
  }
  async list(limit = 50, offset = 0, uuid?: string, search = "", status = "all") {
    const ctx = this.ctx;
    const brands = ctx.allowedBrands.length
      ? sql`AND brand_uuid IN (${sql.join(ctx.allowedBrands)})`
      : sql`AND 1=0`;
    return (
      await sql<SubmissionRecord>`SELECT uuid,company_id AS companyId,brand_uuid AS brandUuid,capture_uuid AS captureUuid,campaign_uuid AS campaignUuid,campaign_label AS campaignLabel,source_key AS sourceKey,name,email,phone,message,source_reference AS sourceReference,source_consented_at AS sourceConsentAt,source_notice_version AS sourceNoticeVersion,privacy_consent AS privacyConsent,notice_version AS noticeVersion,consent_notice AS consentNotice,DATE_FORMAT(created_at,'%Y-%m-%dT%H:%i:%s.000Z') AS createdAt,created_by AS createdBy,status,lead_uuid AS leadUuid FROM marketing_submissions WHERE company_id=${ctx.companyId} ${brands} AND (${status}='all' OR status=${status}) AND (name LIKE ${"%" + search + "%"} OR source_key LIKE ${"%" + search + "%"}) ${uuid ? sql`AND uuid=${uuid}` : sql``} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`.execute(
        ctx.database
      )
    ).rows.map((row) => ({ ...row, privacyConsent: true as const }));
  }
  async count(search = "", status = "all") {
    const ctx = this.ctx;
    const brands = ctx.allowedBrands.length
      ? sql`AND brand_uuid IN (${sql.join(ctx.allowedBrands)})`
      : sql`AND 1=0`;
    return Number(
      (
        await sql<{
          total: number;
        }>`SELECT COUNT(*) AS total FROM marketing_submissions WHERE company_id=${ctx.companyId} ${brands} AND (${status}='all' OR status=${status}) AND (name LIKE ${"%" + search + "%"} OR source_key LIKE ${"%" + search + "%"})`.execute(
          ctx.database
        )
      ).rows[0]?.total ?? 0
    );
  }
  async delivered(uuid: string, leadUuid: string) {
    await sql`UPDATE marketing_submissions SET status='delivered',lead_uuid=${leadUuid},delivered_at=UTC_TIMESTAMP() WHERE uuid=${uuid} AND company_id=${this.ctx.companyId}`.execute(
      this.ctx.database
    );
  }
}
