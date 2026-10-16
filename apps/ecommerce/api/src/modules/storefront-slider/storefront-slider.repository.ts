import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { getEcommerceDatabase } from "../../database/ecommerce-database.js";
import type {
  StorefrontSliderFilters,
  StorefrontSliderRecord,
  StorefrontSliderSaveInput
} from "./storefront-slider.types.js";

type Row = Record<string, unknown>;

export class StorefrontSliderRepository {
  async list(filters: StorefrontSliderFilters = {}) {
    const search = filters.search?.trim().toLowerCase() ?? "";
    const status = filters.status ?? "";
    const result = await sql<Row>`SELECT * FROM ecommerce_storefront_sliders
      WHERE (${status}='' OR status=${status})
      AND (${search}='' OR LOWER(slider_code) LIKE ${`%${search}%`}
        OR LOWER(title) LIKE ${`%${search}%`} OR LOWER(ishop_item) LIKE ${`%${search}%`})
      ORDER BY display_order,slider_code`.execute(getEcommerceDatabase());
    return result.rows.map(toRecord);
  }

  async find(id: number) {
    const result =
      await sql<Row>`SELECT * FROM ecommerce_storefront_sliders WHERE id=${id} LIMIT 1`.execute(
        getEcommerceDatabase()
      );
    return result.rows[0] ? toRecord(result.rows[0]) : null;
  }

  async findByCode(sliderCode: string) {
    const result = await sql<Row>`SELECT * FROM ecommerce_storefront_sliders
      WHERE slider_code=${sliderCode} LIMIT 1`.execute(getEcommerceDatabase());
    return result.rows[0] ? toRecord(result.rows[0]) : null;
  }

  async localItemExists(itemCode: string) {
    const result = await sql<{ id: number }>`SELECT id FROM ecommerce_product_information
      WHERE frappe_item_code=${itemCode} AND status='active' LIMIT 1`.execute(
      getEcommerceDatabase()
    );
    return Boolean(result.rows[0]);
  }

  async create(input: StorefrontSliderSaveInput) {
    const result = await sql`INSERT INTO ecommerce_storefront_sliders
      (uuid,slider_code,eyebrow,title,description,image_url,action_label,action_url,ishop_item,
       display_order,published,starts_at,ends_at,status)
      VALUES (${randomBytes(4).toString("hex")},${input.sliderCode},${input.eyebrow},${input.title},
       ${input.description},${input.imageUrl},${input.actionLabel},${input.actionUrl},${input.ishopItem},
       ${input.displayOrder},${input.published ? 1 : 0},${dateValue(input.startsAt)},${dateValue(input.endsAt)},${input.status})`.execute(
      getEcommerceDatabase()
    );
    return this.find(Number(result.insertId));
  }

  async update(id: number, input: StorefrontSliderSaveInput) {
    await sql`UPDATE ecommerce_storefront_sliders SET slider_code=${input.sliderCode},eyebrow=${input.eyebrow},
      title=${input.title},description=${input.description},image_url=${input.imageUrl},
      action_label=${input.actionLabel},action_url=${input.actionUrl},ishop_item=${input.ishopItem},
      display_order=${input.displayOrder},published=${input.published ? 1 : 0},
      starts_at=${dateValue(input.startsAt)},ends_at=${dateValue(input.endsAt)},status=${input.status},
      updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(getEcommerceDatabase());
    return this.find(id);
  }

  async setActive(id: number, active: boolean) {
    await sql`UPDATE ecommerce_storefront_sliders SET status=${active ? "active" : "inactive"},
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

function toRecord(row: Row): StorefrontSliderRecord {
  return {
    actionLabel: String(row.action_label ?? ""),
    actionUrl: String(row.action_url ?? ""),
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
    published: Boolean(row.published),
    sliderCode: String(row.slider_code),
    startsAt: iso(row.starts_at),
    status: row.status === "inactive" ? "inactive" : "active",
    title: String(row.title),
    updatedAt: iso(row.updated_at) ?? "",
    uuid: String(row.uuid)
  };
}
