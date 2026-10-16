import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { getEcommerceDatabase } from "../../database/ecommerce-database.js";
import type {
  FeaturedCardFilters,
  FeaturedCardRecord,
  FeaturedCardSaveInput
} from "./featured-card.types.js";

type Row = Record<string, unknown>;

export class FeaturedCardRepository {
  async list(filters: FeaturedCardFilters = {}) {
    const search = filters.search?.trim().toLowerCase() ?? "";
    const status = filters.status ?? "";
    const result = await sql<Row>`SELECT * FROM ecommerce_storefront_featured_cards
      WHERE (${status}='' OR status=${status})
      AND (${search}='' OR LOWER(featured_code) LIKE ${`%${search}%`}
        OR LOWER(title) LIKE ${`%${search}%`} OR LOWER(ishop_item) LIKE ${`%${search}%`})
      ORDER BY display_order,featured_code`.execute(getEcommerceDatabase());
    return result.rows.map(toRecord);
  }

  async find(id: number) {
    const result =
      await sql<Row>`SELECT * FROM ecommerce_storefront_featured_cards WHERE id=${id} LIMIT 1`.execute(
        getEcommerceDatabase()
      );
    return result.rows[0] ? toRecord(result.rows[0]) : null;
  }

  async findByCode(featuredCode: string) {
    const result = await sql<Row>`SELECT * FROM ecommerce_storefront_featured_cards
      WHERE featured_code=${featuredCode} LIMIT 1`.execute(getEcommerceDatabase());
    return result.rows[0] ? toRecord(result.rows[0]) : null;
  }

  async localItemExists(itemCode: string) {
    const result = await sql<{ id: number }>`SELECT id FROM ecommerce_product_information
      WHERE frappe_item_code=${itemCode} AND status='active' LIMIT 1`.execute(
      getEcommerceDatabase()
    );
    return Boolean(result.rows[0]);
  }

  async create(input: FeaturedCardSaveInput) {
    const result = await sql`INSERT INTO ecommerce_storefront_featured_cards
      (uuid,featured_code,eyebrow,title,description,image_url,action_label,action_url,offer_price,original_price,badge,badge_position,badge_tint,badge_text_color,ishop_item,
       display_order,published,starts_at,ends_at,status)
      VALUES (${randomBytes(4).toString("hex")},${input.featuredCode},${input.eyebrow},${input.title},
       ${input.description},${input.imageUrl},${input.actionLabel},${input.actionUrl},${input.offerPrice},${input.originalPrice},${input.badge},${input.badgePosition},${input.badgeTint},${input.badgeTextColor},${input.ishopItem},
       ${input.displayOrder},${input.published ? 1 : 0},${dateValue(input.startsAt)},${dateValue(input.endsAt)},${input.status})`.execute(
      getEcommerceDatabase()
    );
    return this.find(Number(result.insertId));
  }

  async update(id: number, input: FeaturedCardSaveInput) {
    await sql`UPDATE ecommerce_storefront_featured_cards SET featured_code=${input.featuredCode},eyebrow=${input.eyebrow},
      title=${input.title},description=${input.description},image_url=${input.imageUrl},
      action_label=${input.actionLabel},action_url=${input.actionUrl},ishop_item=${input.ishopItem},
      offer_price=${input.offerPrice},original_price=${input.originalPrice},badge=${input.badge},badge_position=${input.badgePosition},badge_tint=${input.badgeTint},badge_text_color=${input.badgeTextColor},
      display_order=${input.displayOrder},published=${input.published ? 1 : 0},
      starts_at=${dateValue(input.startsAt)},ends_at=${dateValue(input.endsAt)},status=${input.status},
      updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(getEcommerceDatabase());
    return this.find(id);
  }

  async setActive(id: number, active: boolean) {
    await sql`UPDATE ecommerce_storefront_featured_cards SET status=${active ? "active" : "inactive"},
      published=${active ? sql.ref("published") : 0},updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getEcommerceDatabase()
    );
    return this.find(id);
  }
}

function dateValue(value: string | null) {
  return value ? new Date(value) : null;
}

function iso(value: unknown) {
  if (!value) return null;
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toRecord(row: Row): FeaturedCardRecord {
  return {
    actionLabel: String(row.action_label ?? ""),
    actionUrl: String(row.action_url ?? ""),
    badge: String(row.badge ?? ""),
    badgePosition: (["top-left", "bottom-left", "bottom-right"].includes(String(row.badge_position))
      ? String(row.badge_position)
      : "top-right") as FeaturedCardRecord["badgePosition"],
    badgeTint: String(row.badge_tint ?? "brand"),
    badgeTextColor: String(row.badge_text_color ?? "#ffffff"),
    createdAt: iso(row.created_at) ?? "",
    description: String(row.description ?? ""),
    displayOrder: Number(row.display_order ?? 0),
    endsAt: iso(row.ends_at),
    eyebrow: String(row.eyebrow ?? ""),
    frappeDocumentName: String(row.frappe_document_name ?? ""),
    frappeModifiedAt: iso(row.frappe_modified_at),
    id: Number(row.id),
    imageUrl: String(row.image_url ?? ""),
    ishopItem: row.ishop_item ? String(row.ishop_item) : null,
    offerPrice: Number(row.offer_price ?? 0),
    originalPrice: row.original_price == null ? null : Number(row.original_price),
    published: Boolean(row.published),
    featuredCode: String(row.featured_code),
    startsAt: iso(row.starts_at),
    status: row.status === "inactive" ? "inactive" : "active",
    title: String(row.title),
    updatedAt: iso(row.updated_at) ?? "",
    uuid: String(row.uuid)
  };
}
