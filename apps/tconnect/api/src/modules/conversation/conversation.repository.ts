import { sql, type Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import type { TconnectDatabase } from "../../context.js";
import type { ConversationInput, ConversationRecord } from "./conversation.types.js";
export class ConversationRepository {
  constructor(private database: Kysely<TconnectDatabase>) {}
  async list(buyerUuid: string | null, companyUuid: string | null, uuid: string | null = null) {
    return (
      await sql<ConversationRecord>`SELECT t.uuid,t.buyer_uuid AS buyerUuid,t.company_uuid AS companyUuid,t.requirement_uuid AS requirementUuid,t.inquiry_uuid AS inquiryUuid,c.name AS sellerName,b.business_name AS buyerBusiness,LEFT(COALESCE(r.title,i.requirement),180) AS subject,DATE_FORMAT(t.updated_at,'%Y-%m-%dT%H:%i:%sZ') AS updatedAt FROM tconnect_conversations t INNER JOIN tconnect_companies c ON c.uuid=t.company_uuid INNER JOIN tconnect_buyers b ON b.uuid=t.buyer_uuid LEFT JOIN tconnect_requirements r ON r.uuid=t.requirement_uuid LEFT JOIN tconnect_inquiries i ON i.uuid=t.inquiry_uuid WHERE ((${buyerUuid} IS NOT NULL AND t.buyer_uuid=${buyerUuid}) OR (${companyUuid} IS NOT NULL AND t.company_uuid=${companyUuid})) AND (${uuid} IS NULL OR t.uuid=${uuid}) ORDER BY t.updated_at DESC,t.id DESC LIMIT 500`.execute(
        this.database
      )
    ).rows;
  }
  async create(input: ConversationInput, buyerUuid: string, companyUuid: string) {
    const uuid = randomBytes(4).toString("hex");
    await sql`INSERT INTO tconnect_conversations(uuid,buyer_uuid,company_uuid,requirement_uuid,inquiry_uuid) VALUES (${uuid},${buyerUuid},${companyUuid},${input.requirementUuid},${input.inquiryUuid}) ON DUPLICATE KEY UPDATE uuid=uuid`.execute(
      this.database
    );
    return (
      await sql<{
        uuid: string;
      }>`SELECT uuid FROM tconnect_conversations WHERE buyer_uuid=${buyerUuid} AND company_uuid=${companyUuid} AND ((requirement_uuid=${input.requirementUuid} AND ${input.requirementUuid} IS NOT NULL) OR (inquiry_uuid=${input.inquiryUuid} AND ${input.inquiryUuid} IS NOT NULL))`.execute(
        this.database
      )
    ).rows[0]!;
  }
}
