import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { CreateItemAvailability, MenuAvailability } from "../contracts/menu.contract.js";

export type EffectiveAvailabilityInput = {
  at: string;
  itemId: string;
  locationId: string;
  serviceChannelId?: string;
  variantId?: string;
};

export class MenuAvailabilityRepository {
  constructor(private readonly database: Kysely<QcafeFoundationDatabase>) {}

  async scopeExists(input: CreateItemAvailability): Promise<boolean> {
    const [item, location, variant, channel] = await Promise.all([
      this.database.selectFrom("qcafe_menu_items").select("id")
        .where("id", "=", input.itemId).where("business_id", "=", input.businessId).executeTakeFirst(),
      this.database.selectFrom("qcafe_locations").select("id")
        .where("id", "=", input.locationId).where("business_id", "=", input.businessId).executeTakeFirst(),
      input.variantId ? this.database.selectFrom("qcafe_menu_variants").select("id")
        .where("id", "=", input.variantId).where("item_id", "=", input.itemId).executeTakeFirst() : Promise.resolve({ id: "base" }),
      input.serviceChannelId ? this.database.selectFrom("qcafe_service_channels").select("id")
        .where("id", "=", input.serviceChannelId).where("location_id", "=", input.locationId).executeTakeFirst() : Promise.resolve({ id: "all" }),
    ]);
    return Boolean(item && location && variant && channel);
  }

  async create(input: CreateItemAvailability, now: string): Promise<string> {
    const id = randomUUID();
    await this.database.insertInto("qcafe_item_availability").values({
      created_at: now, ends_at: input.endsAt ?? null, id, item_id: input.itemId, location_id: input.locationId,
      reason: input.reason ?? null, service_channel_id: input.serviceChannelId ?? null, starts_at: input.startsAt,
      status: input.status, updated_at: now, variant_id: input.variantId ?? null, version: 1,
    }).execute();
    return id;
  }

  async findEffective(input: EffectiveAvailabilityInput): Promise<MenuAvailability | null> {
    const rows = await this.database.selectFrom("qcafe_item_availability").selectAll()
      .where("item_id", "=", input.itemId).where("location_id", "=", input.locationId)
      .where("starts_at", "<=", input.at).execute();
    const candidates = rows.filter((row) => (!row.ends_at || row.ends_at > input.at)
      && (row.variant_id === null || row.variant_id === (input.variantId ?? null))
      && (row.service_channel_id === null || row.service_channel_id === (input.serviceChannelId ?? null)));
    candidates.sort((left, right) => availabilitySpecificity(right) - availabilitySpecificity(left)
      || right.starts_at.localeCompare(left.starts_at) || right.created_at.localeCompare(left.created_at));
    const row = candidates[0];
    return row ? { endsAt: row.ends_at, id: row.id, itemId: row.item_id, locationId: row.location_id, reason: row.reason, serviceChannelId: row.service_channel_id, startsAt: row.starts_at, status: row.status, variantId: row.variant_id } : null;
  }
}

function availabilitySpecificity(row: QcafeFoundationDatabase["qcafe_item_availability"]): number {
  return Number(Boolean(row.variant_id)) * 2 + Number(Boolean(row.service_channel_id));
}
