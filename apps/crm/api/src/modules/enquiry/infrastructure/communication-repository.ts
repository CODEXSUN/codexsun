import { randomUUID } from "node:crypto";
import type { CrmDatabaseQuery } from "../../foundation/persistence/crm-database.js";

export interface CreateCommunicationInput {
  readonly enquiryId?: string;
  readonly accountId?: string;
  readonly channel: string;
  readonly direction?: string;
  readonly subject?: string;
  readonly body?: string;
  readonly actorId?: string;
}

export class CommunicationRepository {
  constructor(private readonly database: CrmDatabaseQuery) {}

  async create(input: CreateCommunicationInput) {
    const communication = {
      account_id: input.accountId ?? null,
      actor_id: input.actorId ?? "local-user",
      body: input.body?.trim() || null,
      channel: input.channel,
      direction: input.direction ?? "outbound",
      enquiry_id: input.enquiryId ?? null,
      id: randomUUID(),
      occurred_at: new Date().toISOString(),
      status: "recorded",
      subject: input.subject?.trim() || null,
    };
    await this.database.insertInto("crm_communications").values(communication).execute();
    return communication;
  }

  listForEnquiry(enquiryId: string) {
    return this.database.selectFrom("crm_communications").selectAll().where("enquiry_id", "=", enquiryId).orderBy("occurred_at", "desc").execute();
  }
}
