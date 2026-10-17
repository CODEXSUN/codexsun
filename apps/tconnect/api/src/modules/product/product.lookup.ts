import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectDatabase } from "../../context.js";
export async function lockPublishedProduct(
  database: Kysely<TconnectDatabase>,
  uuid: string,
  companyUuid: string
) {
  const result =
    await sql`SELECT id FROM tconnect_products WHERE uuid=${uuid} AND company_uuid=${companyUuid} AND status='active' FOR UPDATE`.execute(
      database
    );
  if (!result.rows.length)
    throw AppError.notFound("This product is not available from the selected seller.");
}
