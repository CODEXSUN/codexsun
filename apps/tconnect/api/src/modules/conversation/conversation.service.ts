import { sql } from "kysely";
import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectContext } from "../../context.js";
import { lockOpenRequirement } from "../requirement/index.js";
import { lockParticipantInquiry } from "../inquiry/index.js";
import { ConversationRepository } from "./conversation.repository.js";
import { conversationInput } from "./conversation.types.js";
import { conversationParty, lockConversationParty } from "./conversation.lookup.js";
export class ConversationService {
  constructor(private context: TconnectContext) {}
  async list() {
    await this.context.authorize("tconnect.conversation.self");
    const party = conversationParty(this.context);
    return new ConversationRepository(this.context.database).list(
      party.buyerUuid,
      party.companyUuid
    );
  }
  async get(uuid: string) {
    await this.context.authorize("tconnect.conversation.self");
    const party = conversationParty(this.context);
    const record = (
      await new ConversationRepository(this.context.database).list(
        party.buyerUuid,
        party.companyUuid,
        uuid
      )
    )[0];
    if (!record) throw AppError.notFound("Conversation was not found.");
    return record;
  }
  async open(value: unknown) {
    await this.context.authorize("tconnect.conversation.self");
    const party = conversationParty(this.context);
    const input = conversationInput.parse(value);
    if (input.requirementUuid && !this.context.member)
      throw AppError.forbidden(
        "A seller starts a requirement conversation. Buyers can reply to the sellers who contact them."
      );
    return this.context.database.transaction().execute(async (database) => {
      await lockConversationParty(this.context, database);
      let buyerUuid = party.buyerUuid;
      let companyUuid = party.companyUuid;
      if (input.requirementUuid) {
        const target = await lockOpenRequirement(database, input.requirementUuid);
        buyerUuid = target.buyerUuid;
      }
      if (input.inquiryUuid) {
        const target = await lockParticipantInquiry(
          database,
          input.inquiryUuid,
          party.buyerUuid,
          party.companyUuid
        );
        buyerUuid = target.buyerUuid;
        companyUuid = target.companyUuid;
      }
      if (!buyerUuid || !companyUuid)
        throw AppError.validation("A registered buyer and seller are required.");
      const result = await new ConversationRepository(database).create(
        input,
        buyerUuid,
        companyUuid
      );
      await sql`INSERT INTO tconnect_activity(uuid,resource,record_uuid,actor,action) VALUES (${randomBytes(4).toString("hex")},'conversation',${result.uuid},${this.context.actor},'open')`.execute(
        database
      );
      return result;
    });
  }
}
