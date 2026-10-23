import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import type { MarketingContext } from "../../context.js";
import type { ConnectionInput, ConnectionRecord, ConnectionActivity } from "./connection.types.js";
export class ConnectionRepository {
 constructor(private readonly ctx: MarketingContext) {}
 private scope() { const ctx=this.ctx; return ctx.allowedBrands.length ? sql`AND brand_uuid IN (${sql.join(ctx.allowedBrands)})` : sql`AND 1=0`; }
 async list(search="", limit=50, offset=0): Promise<ConnectionRecord[]> {
  return (await sql<ConnectionRecord>`SELECT uuid, company_id AS companyId, brand_uuid AS brandUuid, name AS name, provider AS provider, external_account_id AS externalAccountId, status, created_by AS createdBy, updated_by AS updatedBy, DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS createdAt, DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s.000Z') AS updatedAt FROM marketing_connections
   WHERE company_id=${this.ctx.companyId} ${this.scope()} AND name LIKE ${"%"+search+"%"} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`.execute(this.ctx.database)).rows;
 }
 async get(uuid: string) {
  return (await sql<ConnectionRecord>`SELECT uuid, company_id AS companyId, brand_uuid AS brandUuid, name AS name, provider AS provider, external_account_id AS externalAccountId, status, created_by AS createdBy, updated_by AS updatedBy, DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS createdAt, DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s.000Z') AS updatedAt FROM marketing_connections WHERE uuid=${uuid} AND company_id=${this.ctx.companyId} ${this.scope()}`.execute(this.ctx.database)).rows[0] ?? null;
 }
 async save(input: ConnectionInput, uuid?: string) {
  const identity=uuid ?? randomBytes(4).toString("hex");
  await this.ctx.database.transaction().execute(async database => {
   if(uuid) await sql`UPDATE marketing_connections SET brand_uuid=${input.brandUuid}, name=${input.name}, provider=${input.provider}, external_account_id=${input.externalAccountId}, status=${input.status},updated_by=${this.ctx.actorEmail}
    WHERE uuid=${identity} AND company_id=${this.ctx.companyId} ${this.scope()}`.execute(database);
   else await sql`INSERT INTO marketing_connections(uuid,company_id,brand_uuid,name,provider,external_account_id,status,created_by,updated_by)
    VALUES(${identity},${this.ctx.companyId},${input.brandUuid},${input.name},${input.provider},${input.externalAccountId},${input.status},${this.ctx.actorEmail},${this.ctx.actorEmail})`.execute(database);
   await sql`INSERT INTO marketing_connections_activity(uuid,record_uuid,company_id,action,actor)
    VALUES(${randomBytes(4).toString("hex")},${identity},${this.ctx.companyId},${uuid?"updated":"created"},${this.ctx.actorEmail})`.execute(database);
  });
  return identity;
 }
 async activity(uuid: string): Promise<ConnectionActivity[]> {
  return (await sql<ConnectionActivity>`SELECT action,actor,DATE_FORMAT(occurred_at,'%Y-%m-%dT%H:%i:%s.000Z') AS occurredAt FROM marketing_connections_activity WHERE company_id=${this.ctx.companyId} AND record_uuid=${uuid} ORDER BY id DESC LIMIT 100`.execute(this.ctx.database)).rows;
 }
}
