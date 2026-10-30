import type { Kysely } from "kysely";
import type { EcommerceDatabase } from "../../database/ecommerce-database.js";

export async function seedFeaturedCardModule(_database: Kysely<EcommerceDatabase>) {
  // Featured content is managed locally or imported from Frappe; no demo row is authoritative.
}
