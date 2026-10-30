import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectDatabase } from "../../context.js";
export async function lockParticipantInquiry(
  database: Kysely<TconnectDatabase>,
  uuid: string,
  buyerUuid: string | null,
  companyUuid: string | null
) {
  const row = (
    await sql<{
      buyerUuid: string | null;
      companyUuid: string;
      status: string;
    }>`SELECT buyer_uuid AS buyerUuid,companyUuid,status FROM tconnect_inquiries WHERE uuid=${uuid} AND ((${buyerUuid} IS NOT NULL AND buyer_uuid=${buyerUuid}) OR (${companyUuid} IS NOT NULL AND companyUuid=${companyUuid})) FOR UPDATE`.execute(
      database
    )
  ).rows[0];
  if (!row) throw AppError.notFound("Enquiry was not found.");
  if (!row.buyerUuid)
    throw AppError.validation(
      "This enquiry was submitted as a guest. Platform replies require a registered buyer; use the supplied contact details for this enquiry."
    );
  return { ...row, buyerUuid: row.buyerUuid };
}
