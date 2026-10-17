import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
import { BuyerRepository } from "./buyer.repository.js";
export async function resolveBuyerScope(database: Kysely<TconnectDatabase>, userUuid: string) {
  const buyer = await new BuyerRepository(database).findForUser(userUuid);
  if (buyer?.status === "inactive") throw AppError.forbidden("Your buyer account is inactive.");
  return buyer;
}
export async function lockBuyerScope(database: Kysely<TconnectDatabase>, userUuid: string) {
  const buyer = await new BuyerRepository(database).findForUser(userUuid, true);
  if (!buyer || buyer.status !== "active")
    throw AppError.forbidden("An active buyer account is required.");
  return buyer;
}

export async function lockActiveBuyer(database: Kysely<TconnectDatabase>, uuid: string) {
  const result =
    await sql`SELECT id FROM tconnect_buyers WHERE uuid=${uuid} AND status='active' FOR UPDATE`.execute(
      database
    );
  if (!result.rows.length) throw AppError.notFound("The buyer account is unavailable.");
}
