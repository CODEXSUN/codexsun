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
import { MessageRepository } from "./message.repository.js";
import { messageInput } from "./message.types.js";
export class MessageService {
  constructor(private context: TconnectContext) {}
  async messages(uuid: string, before?: string) {
    await this.context.authorize("tconnect.message.self");
    const party = conversationParty(this.context);
    await participantConversation(this.context.database, uuid, party.buyerUuid, party.companyUuid);
    return new MessageRepository(this.context.database).messages(uuid, before);
  }
  async send(uuid: string, value: unknown) {
    await this.context.authorize("tconnect.message.self");
    conversationParty(this.context);
    const input = messageInput.parse(value);
    return this.context.database.transaction().execute(async (database) => {
      const party = await lockConversationParty(this.context, database);
      await participantConversation(database, uuid, party.buyerUuid, party.companyUuid, true);
      const repository = new MessageRepository(database);
      if ((await repository.countRecent(this.context.userUuid ?? "")) >= 100)
        throw AppError.validation("Hourly message limit reached. Please try again later.");
      const record = await repository.send(
        uuid,
        this.context.userUuid ?? "",
        party.buyerUuid ? "buyer" : "seller",
        input.body
      );
      await touchConversation(database, uuid);
      await sql`INSERT INTO tconnect_activity(uuid,resource,record_uuid,actor,action) VALUES (${randomBytes(4).toString("hex")},'message',${record.uuid},${this.context.actor},'send')`.execute(
        database
      );
      return record;
    });
  }
}
