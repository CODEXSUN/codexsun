import { sql, type Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import type { TconnectDatabase } from "../../context.js";
import type { InquiryInput, InquiryRecord } from "./inquiry.types.js";
export class InquiryRepository {
  constructor(private database: Kysely<TconnectDatabase>) {}
  async list(companyUuid?: string) {
    return (
      await sql<InquiryRecord>`SELECT (buyer_uuid IS NOT NULL) AS canReply,uuid, companyUuid, buyerName, email, phone, requirement, quantity, status, DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS createdAt FROM tconnect_inquiries WHERE (${companyUuid ?? null} IS NULL OR companyUuid=${companyUuid ?? null}) ORDER BY id DESC LIMIT 500`.execute(
        this.database
      )
    ).rows.map((row) => ({ ...row, canReply: Boolean(row.canReply) }));
  }
  async sent(buyerUuid: string) {
    return (
      await sql<
        import("./inquiry.types.js").InquiryRecord & {
          sellerName: string;
          productUuid: string | null;
          requirementUuid: string | null;
        }
      >`SELECT TRUE AS canReply,i.uuid,i.companyUuid,i.buyerName,i.email,i.phone,i.requirement,i.quantity,i.status,DATE_FORMAT(i.created_at,'%Y-%m-%dT%H:%i:%sZ') AS createdAt,c.name AS sellerName,i.product_uuid AS productUuid,i.requirement_uuid AS requirementUuid FROM tconnect_inquiries i INNER JOIN tconnect_companies c ON c.uuid=i.companyUuid WHERE i.buyer_uuid=${buyerUuid} ORDER BY i.id DESC LIMIT 500`.execute(
        this.database
      )
    ).rows.map((row) => ({ ...row, canReply: Boolean(row.canReply) }));
  }
  async create(
    input: InquiryInput,
    buyerUuid: string | null = null,
    productUuid: string | null = null,
    requirementUuid: string | null = null
  ) {
    const uuid = randomBytes(4).toString("hex");
    await sql`INSERT INTO tconnect_inquiries (uuid, companyUuid, buyerName, email, phone, requirement, quantity,buyer_uuid,product_uuid,requirement_uuid) VALUES (${uuid}, ${input.companyUuid}, ${input.buyerName}, ${input.email}, ${input.phone}, ${input.requirement}, ${input.quantity},${buyerUuid},${productUuid},${requirementUuid})`.execute(
      this.database
    );
    return uuid;
  }
}
