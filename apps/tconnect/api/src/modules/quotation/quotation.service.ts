import { sql } from "kysely";
import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectContext } from "../../context.js";
import {
  conversationParty,
  lockConversationParty,
  participantConversation,
  touchConversation
} from "../conversation/index.js";
import { lockOpenRequirement } from "../requirement/index.js";
import { lockParticipantInquiry } from "../inquiry/index.js";
import { QuotationRepository } from "./quotation.repository.js";
import { quotationInput, quotationTotals } from "./quotation.types.js";
export class QuotationService {
  constructor(private context: TconnectContext) {}
  async list(conversationUuid?: string) {
    await this.context.authorize("tconnect.quotation.self");
    const party = conversationParty(this.context);
    if (conversationUuid)
      await participantConversation(
        this.context.database,
        conversationUuid,
        party.buyerUuid,
        party.companyUuid
      );
    return new QuotationRepository(this.context.database).list(
      party.buyerUuid,
      party.companyUuid,
      conversationUuid ?? null
    );
  }
  async create(value: unknown) {
    await this.context.authorize("tconnect.quotation.self");
    this.seller();
    const input = quotationInput.parse(value);
    if (input.validUntil < new Date().toISOString().slice(0, 10))
      throw AppError.validation("Quotation validity cannot be in the past (UTC date).");
    let totals;
    try {
      totals = quotationTotals(input);
    } catch (error) {
      throw AppError.validation(
        error instanceof Error ? error.message : "Invalid quotation total."
      );
    }
    return this.context.database.transaction().execute(async (database) => {
      const party = await lockConversationParty(this.context, database);
      const thread = await participantConversation(
        database,
        input.conversationUuid,
        null,
        party.companyUuid
      );
      if (thread.requirementUuid) await lockOpenRequirement(database, thread.requirementUuid);
      if (thread.inquiryUuid) {
        const enquiry = await lockParticipantInquiry(
          database,
          thread.inquiryUuid,
          null,
          party.companyUuid
        );
        if (enquiry.status === "closed")
          throw AppError.validation(
            "This enquiry is closed. You can continue the conversation but cannot send a new quotation."
          );
      }
      await participantConversation(
        database,
        input.conversationUuid,
        null,
        party.companyUuid,
        true
      );
      const record = await new QuotationRepository(database).create(input, totals);
      await touchConversation(database, input.conversationUuid);
      await sql`INSERT INTO tconnect_activity(uuid,resource,record_uuid,actor,action) VALUES (${randomBytes(4).toString("hex")},'quotation',${record.uuid},${this.context.actor},'send')`.execute(
        database
      );
      return record;
    });
  }
  async withdraw(uuid: string) {
    await this.context.authorize("tconnect.quotation.self");
    this.seller();
    return this.context.database.transaction().execute(async (database) => {
      const party = await lockConversationParty(this.context, database);
      const repository = new QuotationRepository(database);
      const record = await repository.find(uuid, party.companyUuid!);
      if (!record) throw AppError.notFound("Quotation was not found.");
      if (record.status !== "withdrawn") {
        await repository.withdraw(uuid);
        await sql`INSERT INTO tconnect_activity(uuid,resource,record_uuid,actor,action) VALUES (${randomBytes(4).toString("hex")},'quotation',${uuid},${this.context.actor},'withdraw')`.execute(
          database
        );
      }
      return { uuid, status: "withdrawn" as const };
    });
  }
  private seller() {
    if (!this.context.member || this.context.buyer)
      throw AppError.forbidden("Only a registered seller can send or withdraw quotations.");
  }
}
