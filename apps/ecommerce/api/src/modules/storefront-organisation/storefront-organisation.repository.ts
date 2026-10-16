import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { getEcommerceDatabase } from "../../database/ecommerce-database.js";
import type {
  StorefrontOrganisation,
  StorefrontOrganisationInput
} from "./storefront-organisation.types.js";

export class StorefrontOrganisationRepository {
  async get(): Promise<StorefrontOrganisation | null> {
    const result = await sql<{
      company_id: number | null;
      financial_year_id: number | null;
      display_name: string;
      logo_file_name: string | null;
    }>`
      SELECT company_id,financial_year_id,display_name,logo_file_name FROM ecommerce_storefront_organisation WHERE singleton_key=1
    `.execute(getEcommerceDatabase());
    const row = result.rows[0];
    return row
      ? {
          companyId: row.company_id == null ? null : Number(row.company_id),
          financialYearId: row.financial_year_id == null ? null : Number(row.financial_year_id),
          displayName: row.display_name,
          logoFileName: row.logo_file_name
        }
      : null;
  }

  async save(input: StorefrontOrganisationInput, actorEmail: string) {
    await getEcommerceDatabase()
      .transaction()
      .execute(async (transaction) => {
        await sql`INSERT INTO ecommerce_storefront_organisation (uuid,singleton_key,company_id,financial_year_id,display_name,logo_file_name,updated_by)
        VALUES (${randomBytes(4).toString("hex")},1,${input.companyId},${input.financialYearId},${input.displayName},${input.logoFileName},${actorEmail})
        ON DUPLICATE KEY UPDATE company_id=VALUES(company_id),financial_year_id=VALUES(financial_year_id),display_name=VALUES(display_name),logo_file_name=VALUES(logo_file_name),updated_by=VALUES(updated_by),updated_at=CURRENT_TIMESTAMP`.execute(
          transaction
        );
        await sql`INSERT INTO ecommerce_storefront_organisation_activity (uuid,company_id,financial_year_id,display_name,logo_file_name,actor_email)
        VALUES (${randomBytes(4).toString("hex")},${input.companyId},${input.financialYearId},${input.displayName},${input.logoFileName},${actorEmail})`.execute(
          transaction
        );
      });
    return input;
  }
}
