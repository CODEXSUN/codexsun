import { sql, type Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import type { TconnectDatabase } from "../../context.js";
import type { RequirementInput, RequirementRecord } from "./requirement.types.js";
export class RequirementRepository {
  constructor(private database: Kysely<TconnectDatabase>) {}
  async list(buyerUuid: string | null) {
    return (
      await sql<RequirementRecord>`SELECT r.uuid,r.title,r.category,r.description,r.quantity,r.delivery_city AS deliveryCity,CAST(r.budget AS DOUBLE) AS budget,r.status,DATE_FORMAT(r.created_at,'%Y-%m-%dT%H:%i:%sZ') AS createdAt FROM tconnect_requirements r INNER JOIN tconnect_buyers b ON b.uuid=r.buyer_uuid WHERE (${buyerUuid} IS NOT NULL AND r.buyer_uuid=${buyerUuid}) OR (${buyerUuid} IS NULL AND r.status='open' AND b.status='active') ORDER BY r.id DESC LIMIT 500`.execute(
        this.database
      )
    ).rows;
  }
  async save(buyerUuid: string, input: RequirementInput, uuid?: string) {
    const key = uuid ?? randomBytes(4).toString("hex");
    if (uuid)
      await sql`UPDATE tconnect_requirements SET title=${input.title},category=${input.category},description=${input.description},quantity=${input.quantity},delivery_city=${input.deliveryCity},budget=${input.budget},status=${input.status} WHERE uuid=${uuid} AND buyer_uuid=${buyerUuid}`.execute(
        this.database
      );
    else
      await sql`INSERT INTO tconnect_requirements(uuid,buyer_uuid,title,category,description,quantity,delivery_city,budget,status) VALUES (${key},${buyerUuid},${input.title},${input.category},${input.description},${input.quantity},${input.deliveryCity},${input.budget},${input.status})`.execute(
        this.database
      );
    const created = await sql<{
      createdAt: string;
    }>`SELECT DATE_FORMAT(created_at,'%Y-%m-%dT%H:%i:%sZ') AS createdAt FROM tconnect_requirements WHERE uuid=${key} AND buyer_uuid=${buyerUuid}`.execute(
      this.database
    );
    return { ...input, uuid: key, createdAt: created.rows[0]!.createdAt };
  }
}
