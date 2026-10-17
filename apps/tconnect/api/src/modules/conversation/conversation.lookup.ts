import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectContext, TconnectDatabase } from "../../context.js";
import { lockBuyerScope } from "../buyer/index.js";
import { lockMemberScope } from "../member/index.js";
export function conversationParty(context: TconnectContext) {
  if (Boolean(context.buyer) === Boolean(context.member))
    throw AppError.forbidden("Sign in as a registered buyer or seller.");
  return {
    buyerUuid: context.buyer?.uuid ?? null,
    companyUuid: context.member?.companyUuid ?? null
  };
}
export async function lockConversationParty(
  context: TconnectContext,
  database: Kysely<TconnectDatabase>
) {
  const party = conversationParty(context);
  if (context.buyer) {
    const current = await lockBuyerScope(database, context.userUuid ?? "");
    if (current.uuid !== party.buyerUuid) throw AppError.forbidden("Buyer ownership changed.");
  } else {
    const current = await lockMemberScope(database, context.userUuid ?? "");
    if (current.companyUuid !== party.companyUuid)
      throw AppError.forbidden("Seller ownership changed.");
  }
  return party;
}
export async function participantConversation(
  database: Kysely<TconnectDatabase>,
  uuid: string,
  buyerUuid: string | null,
  companyUuid: string | null,
  lock = false
) {
  const row = (
    await sql<{
      uuid: string;
      buyerUuid: string;
      companyUuid: string;
      requirementUuid: string | null;
      inquiryUuid: string | null;
    }>`SELECT uuid,buyer_uuid AS buyerUuid,company_uuid AS companyUuid,requirement_uuid AS requirementUuid,inquiry_uuid AS inquiryUuid FROM tconnect_conversations WHERE uuid=${uuid} AND ((${buyerUuid} IS NOT NULL AND buyer_uuid=${buyerUuid}) OR (${companyUuid} IS NOT NULL AND company_uuid=${companyUuid})) ${lock ? sql`FOR UPDATE` : sql``}`.execute(
      database
    )
  ).rows[0];
  if (!row) throw AppError.notFound("Conversation was not found.");
  return row;
}

export async function touchConversation(database: Kysely<TconnectDatabase>, uuid: string) {
  await sql`UPDATE tconnect_conversations SET updated_at=UTC_TIMESTAMP() WHERE uuid=${uuid}`.execute(
    database
  );
}
