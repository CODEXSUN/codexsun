import type { Kysely } from "kysely";
import type { EcommerceDatabase } from "../../database/ecommerce-database.js";

export async function seedStorefrontSliderModule(_database: Kysely<EcommerceDatabase>) {
  // Slider content is managed locally or imported from Frappe; no demo row is authoritative.
}
