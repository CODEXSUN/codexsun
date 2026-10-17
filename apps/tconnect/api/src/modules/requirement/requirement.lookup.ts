import { lockActiveBuyer } from "../buyer/index.js";
import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectDatabase } from "../../context.js";
export async function lockBuyerRequirement(
  database: Kysely<TconnectDatabase>,
  uuid: string,
  buyerUuid: string
) {
  const rows =
    await sql`SELECT id FROM tconnect_requirements WHERE uuid=${uuid} AND buyer_uuid=${buyerUuid} FOR UPDATE`.execute(
      database
    );
  if (!rows.rows.length) throw AppError.notFound("Requirement was not found.");
}

export async function lockOpenRequirement(database: Kysely<TconnectDatabase>, uuid: string) {
  const parent = (
    await sql<{
      buyerUuid: string;
    }>`SELECT buyer_uuid AS buyerUuid FROM tconnect_requirements WHERE uuid=${uuid}`.execute(
      database
    )
  ).rows[0];
  if (!parent) throw AppError.notFound("This requirement is no longer open.");
  await lockActiveBuyer(database, parent.buyerUuid);
  const result = await sql<{
    buyerUuid: string;
    title: string;
  }>`SELECT buyer_uuid AS buyerUuid,title FROM tconnect_requirements WHERE uuid=${uuid} AND buyer_uuid=${parent.buyerUuid} AND status='open' FOR UPDATE`.execute(
    database
  );
  if (!result.rows[0]) throw AppError.notFound("This requirement is no longer open.");
  return result.rows[0];
}
