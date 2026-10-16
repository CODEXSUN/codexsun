import { sql } from "kysely";
import { getEcommerceDatabase } from "../../database/ecommerce-database.js";

export async function seedStorefrontOrganisation() {
  await sql`INSERT INTO ecommerce_storefront_organisation (uuid,singleton_key,updated_by)
    VALUES ('ec000001',1,'system:seed') ON DUPLICATE KEY UPDATE singleton_key=singleton_key`.execute(
    getEcommerceDatabase()
  );
}
