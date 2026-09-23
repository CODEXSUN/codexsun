import { randomUUID } from "node:crypto";
import type { CrmDatabaseQuery } from "../../foundation/persistence/crm-database.js";

export interface CreateEnquiryInput {
  readonly subject: string;
  readonly description?: string;
  readonly leadId?: string;
  readonly accountId?: string;
  readonly priority?: string;
  readonly dueAt?: string;
  readonly ownerActorId?: string;
}

export class EnquiryRepository {
  constructor(private readonly database: CrmDatabaseQuery) {}

  list() {
    return this.database.selectFrom("crm_enquiries").selectAll().orderBy("created_at", "desc").execute();
  }

  async create(input: CreateEnquiryInput) {
    const now = new Date().toISOString();
    const enquiry = {
      account_id: input.accountId ?? null,
      created_at: now,
      description: input.description?.trim() || null,
      due_at: input.dueAt ?? null,
      id: randomUUID(),
      lead_id: input.leadId ?? null,
      owner_actor_id: input.ownerActorId ?? null,
      priority: input.priority ?? "normal",
      status: "open",
      subject: input.subject.trim(),
      updated_at: now,
    };
    await this.database.insertInto("crm_enquiries").values(enquiry).execute();
    return enquiry;
  }

  async read(enquiryId: string) {
    const enquiry = await this.database.selectFrom("crm_enquiries").selectAll().where("id", "=", enquiryId).executeTakeFirst();
    if (!enquiry) return undefined;
    const [activities, assignments, workOrders, collections, verifications] = await Promise.all([
      this.database.selectFrom("crm_activities").selectAll().where("enquiry_id", "=", enquiryId).orderBy("occurred_at", "desc").execute(),
      this.database.selectFrom("crm_assignments").selectAll().where("enquiry_id", "=", enquiryId).orderBy("created_at", "desc").execute(),
      this.database.selectFrom("crm_work_orders").selectAll().where("enquiry_id", "=", enquiryId).orderBy("created_at", "desc").execute(),
      this.database.selectFrom("crm_collection_plans").selectAll().where("enquiry_id", "=", enquiryId).orderBy("created_at", "desc").execute(),
      this.database.selectFrom("crm_verifications").selectAll().where("enquiry_id", "=", enquiryId).orderBy("created_at", "desc").execute(),
    ]);
    return { enquiry, activities, assignments, workOrders, collections, verifications };
  }

  async addActivity(enquiryId: string, kind: string, subject: string, body?: string) {
    const activity = {
      actor_id: "local-user",
      body: body?.trim() || null,
      enquiry_id: enquiryId,
      id: randomUUID(),
      kind,
      occurred_at: new Date().toISOString(),
      subject: subject.trim(),
    };
    await this.database.insertInto("crm_activities").values(activity).execute();
    return activity;
  }
}
