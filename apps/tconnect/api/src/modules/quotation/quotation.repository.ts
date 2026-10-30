import { sql, type Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import type { TconnectDatabase } from "../../context.js";
import type { QuotationInput, QuotationRecord } from "./quotation.types.js";
export class QuotationRepository {
  constructor(private database: Kysely<TconnectDatabase>) {}
  async list(
    buyerUuid: string | null,
    companyUuid: string | null,
    conversationUuid: string | null = null
  ) {
    return (
      await sql<QuotationRecord>`SELECT q.uuid,q.conversation_uuid AS conversationUuid,CAST(q.quantity AS DOUBLE) AS quantity,q.unit,CAST(q.unit_price AS DOUBLE) AS unitPrice,CAST(q.tax_percent AS DOUBLE) AS taxPercent,CAST(q.shipping AS DOUBLE) AS shipping,CAST(q.subtotal AS DOUBLE) AS subtotal,CAST(q.tax_amount AS DOUBLE) AS taxAmount,CAST(q.total AS DOUBLE) AS total,q.currency,q.delivery_days AS deliveryDays,DATE_FORMAT(q.valid_until,'%Y-%m-%d') AS validUntil,q.payment_terms AS paymentTerms,q.notes,q.status,DATE_FORMAT(q.created_at,'%Y-%m-%dT%H:%i:%sZ') AS createdAt,c.name AS sellerName,b.business_name AS buyerBusiness,COALESCE(t.requirement_uuid,i.requirement_uuid) AS requirementUuid,t.inquiry_uuid AS inquiryUuid,LEFT(COALESCE(r.title,i.requirement),180) AS subject FROM tconnect_quotations q INNER JOIN tconnect_conversations t ON t.uuid=q.conversation_uuid INNER JOIN tconnect_companies c ON c.uuid=t.company_uuid INNER JOIN tconnect_buyers b ON b.uuid=t.buyer_uuid LEFT JOIN tconnect_inquiries i ON i.uuid=t.inquiry_uuid LEFT JOIN tconnect_requirements r ON r.uuid=COALESCE(t.requirement_uuid,i.requirement_uuid) WHERE ((${buyerUuid} IS NOT NULL AND t.buyer_uuid=${buyerUuid}) OR (${companyUuid} IS NOT NULL AND t.company_uuid=${companyUuid})) AND (${conversationUuid} IS NULL OR q.conversation_uuid=${conversationUuid}) ORDER BY q.id DESC LIMIT 500`.execute(
        this.database
      )
    ).rows;
  }
  async create(
    input: QuotationInput,
    totals: { subtotal: number; taxAmount: number; total: number }
  ) {
    const uuid = randomBytes(4).toString("hex");
    await sql`INSERT INTO tconnect_quotations(uuid,conversation_uuid,quantity,unit,unit_price,tax_percent,shipping,subtotal,tax_amount,total,delivery_days,valid_until,payment_terms,notes) VALUES (${uuid},${input.conversationUuid},${input.quantity},${input.unit},${input.unitPrice},${input.taxPercent},${input.shipping},${totals.subtotal},${totals.taxAmount},${totals.total},${input.deliveryDays},${input.validUntil},${input.paymentTerms},${input.notes})`.execute(
      this.database
    );
    return { uuid };
  }
  async find(uuid: string, companyUuid: string) {
    return (
      (
        await sql<{
          conversationUuid: string;
          status: string;
        }>`SELECT q.conversation_uuid AS conversationUuid,q.status FROM tconnect_quotations q INNER JOIN tconnect_conversations t ON t.uuid=q.conversation_uuid WHERE q.uuid=${uuid} AND t.company_uuid=${companyUuid} FOR UPDATE`.execute(
          this.database
        )
      ).rows[0] ?? null
    );
  }
  async withdraw(uuid: string) {
    await sql`UPDATE tconnect_quotations SET status='withdrawn' WHERE uuid=${uuid}`.execute(
      this.database
    );
  }
}
