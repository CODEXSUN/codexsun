import { randomUUID } from "node:crypto";
import type { CrmDatabaseQuery } from "../../foundation/persistence/crm-database.js";

export interface CreateCampaignInput {
  readonly name: string;
  readonly source?: string;
  readonly ownerActorId?: string;
}

export class CampaignRepository {
  constructor(private readonly database: CrmDatabaseQuery) {}

  list() {
    return this.database.selectFrom("crm_campaigns").selectAll().orderBy("created_at", "desc").execute();
  }

  async create(input: CreateCampaignInput) {
    const now = new Date().toISOString();
    const campaign = {
      created_at: now,
      id: randomUUID(),
      name: input.name.trim(),
      owner_actor_id: input.ownerActorId ?? null,
      source: input.source?.trim() || null,
      status: "draft",
      updated_at: now,
    };
    await this.database.insertInto("crm_campaigns").values(campaign).execute();
    return campaign;
  }
}
