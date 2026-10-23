import { AppError } from "@codexsun/framework/errors";
import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import type { MarketingContext } from "../../context.js";
import type { CampaignInput, CampaignRecord, CampaignActivity } from "./campaign.types.js";
export class CampaignRepository {
  constructor(private readonly ctx: MarketingContext) {}
  private scope() {
    const ctx = this.ctx;
    return ctx.allowedBrands.length
      ? sql`AND brand_uuid IN (${sql.join(ctx.allowedBrands)})`
      : sql`AND 1=0`;
  }
  async list(search = "", limit = 50, offset = 0, status = "all"): Promise<CampaignRecord[]> {
    return (
      await sql<CampaignRecord>`SELECT uuid, revision, company_id AS companyId, brand_uuid AS brandUuid, name AS name, objective AS objective, channel AS channel, landing_url AS landingUrl, status, created_by AS createdBy, updated_by AS updatedBy, DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS createdAt, DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s.000Z') AS updatedAt FROM marketing_campaigns
   WHERE company_id=${this.ctx.companyId} ${this.scope()} AND (${status} = 'all' OR status=${status}) AND name LIKE ${"%" + search + "%"} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`.execute(
        this.ctx.database
      )
    ).rows;
  }
  async count(search: string, status = "all") {
    return Number(
      (
        await sql<{
          total: number;
        }>`SELECT COUNT(*) AS total FROM marketing_campaigns WHERE company_id=${this.ctx.companyId} ${this.scope()} AND (${status}='all' OR status=${status}) AND name LIKE ${"%" + search + "%"}`.execute(
          this.ctx.database
        )
      ).rows[0]?.total ?? 0
    );
  }
  async get(uuid: string) {
    return (
      (
        await sql<CampaignRecord>`SELECT uuid, revision, company_id AS companyId, brand_uuid AS brandUuid, name AS name, objective AS objective, channel AS channel, landing_url AS landingUrl, status, created_by AS createdBy, updated_by AS updatedBy, DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS createdAt, DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s.000Z') AS updatedAt FROM marketing_campaigns WHERE uuid=${uuid} AND company_id=${this.ctx.companyId} ${this.scope()}`.execute(
          this.ctx.database
        )
      ).rows[0] ?? null
    );
  }
  async save(input: CampaignInput, uuid?: string) {
    const identity = uuid ?? randomBytes(4).toString("hex");
    await this.ctx.database.transaction().execute(async (database) => {
      if (uuid) {
        const current = (
          await sql<{
            revision: number;
          }>`SELECT revision FROM marketing_campaigns WHERE uuid=${uuid} AND company_id=${this.ctx.companyId} ${this.scope()} FOR UPDATE`.execute(
            database
          )
        ).rows[0];
        if (!current) throw AppError.notFound("Campaign was not found.");
        if (current.revision !== input.expectedRevision)
          throw AppError.conflict("This record changed. Refresh it before saving.");
      }
      if (uuid)
        await sql`UPDATE marketing_campaigns SET revision=revision+1, brand_uuid=${input.brandUuid}, name=${input.name}, objective=${input.objective}, channel=${input.channel}, landing_url=${input.landingUrl}, status=${input.status},updated_by=${this.ctx.actorEmail}
    WHERE uuid=${identity} AND company_id=${this.ctx.companyId} ${this.scope()}`.execute(database);
      else
        await sql`INSERT INTO marketing_campaigns(uuid,company_id,brand_uuid,name,objective,channel,landing_url,status,created_by,updated_by)
    VALUES(${identity},${this.ctx.companyId},${input.brandUuid},${input.name},${input.objective},${input.channel},${input.landingUrl},${input.status},${this.ctx.actorEmail},${this.ctx.actorEmail})`.execute(
          database
        );
      await sql`INSERT INTO marketing_campaigns_activity(uuid,record_uuid,company_id,action,actor)
    VALUES(${randomBytes(4).toString("hex")},${identity},${this.ctx.companyId},${uuid ? "updated" : "created"},${this.ctx.actorEmail})`.execute(
        database
      );
    });
    return identity;
  }
  async activity(uuid: string): Promise<CampaignActivity[]> {
    return (
      await sql<CampaignActivity>`SELECT action,actor,DATE_FORMAT(occurred_at,'%Y-%m-%dT%H:%i:%s.000Z') AS occurredAt FROM marketing_campaigns_activity WHERE company_id=${this.ctx.companyId} AND record_uuid=${uuid} ORDER BY id DESC LIMIT 100`.execute(
        this.ctx.database
      )
    ).rows;
  }
}
