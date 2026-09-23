import { randomUUID } from "node:crypto";
import type { CrmDatabaseQuery } from "../../foundation/persistence/crm-database.js";

export interface CreateLeadInput {
  readonly name: string;
  readonly campaignId?: string;
  readonly accountId?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly ownerActorId?: string;
  readonly score?: number;
}

export class LeadRepository {
  constructor(private readonly database: CrmDatabaseQuery) {}

  list() {
    return this.database.selectFrom("crm_leads").selectAll().orderBy("created_at", "desc").execute();
  }

  async create(input: CreateLeadInput) {
    const now = new Date().toISOString();
    const lead = {
      account_id: input.accountId ?? null,
      campaign_id: input.campaignId ?? null,
      created_at: now,
      email: input.email?.trim() || null,
      id: randomUUID(),
      name: input.name.trim(),
      owner_actor_id: input.ownerActorId ?? null,
      phone: input.phone?.trim() || null,
      score: input.score ?? 0,
      status: "new",
      updated_at: now,
    };
    await this.database.insertInto("crm_leads").values(lead).execute();
    return lead;
  }

  async qualify(leadId: string, note: string, score: number) {
    const now = new Date().toISOString();
    const result = await this.database
      .updateTable("crm_leads")
      .set({ qualification_note: note.trim() || null, qualified_at: now, score, status: "qualified", updated_at: now })
      .where("id", "=", leadId)
      .where("status", "not in", ["converted", "lost"])
      .executeTakeFirst();
    if (Number(result.numUpdatedRows) !== 1) return undefined;
    return this.database.selectFrom("crm_leads").selectAll().where("id", "=", leadId).executeTakeFirst();
  }

  async convertToEnquiry(leadId: string, subject: string, description?: string) {
    const now = new Date().toISOString();
    return this.database.transaction().execute(async (transaction) => {
      const lead = await transaction.selectFrom("crm_leads").selectAll().where("id", "=", leadId).executeTakeFirst();
      if (!lead || lead.status !== "qualified" || lead.converted_enquiry_id) return undefined;
      const enquiryId = randomUUID();
      await transaction.insertInto("crm_enquiries").values({
        account_id: lead.account_id,
        created_at: now,
        description: description?.trim() || null,
        due_at: null,
        id: enquiryId,
        lead_id: lead.id,
        owner_actor_id: lead.owner_actor_id,
        priority: "normal",
        status: "open",
        subject: subject.trim(),
        updated_at: now,
      }).execute();
      await transaction.updateTable("crm_leads").set({ converted_enquiry_id: enquiryId, status: "converted", updated_at: now }).where("id", "=", leadId).execute();
      return transaction.selectFrom("crm_enquiries").selectAll().where("id", "=", enquiryId).executeTakeFirst();
    });
  }
}
