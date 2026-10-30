import type { Kysely } from "kysely";
import type { EcommerceDatabase } from "../../database/ecommerce-database.js";

export async function seedPromotionCardModule(_database: Kysely<EcommerceDatabase>) {
  // Promotion content is managed locally or imported from Frappe; no demo row is authoritative.
}
