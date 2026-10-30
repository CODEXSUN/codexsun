import { sql, type Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import type { TconnectDatabase } from "../../context.js";
import { buyerRegistration, type BuyerRecord } from "./buyer.types.js";
export class BuyerRepository {
  constructor(private database: Kysely<TconnectDatabase>) {}
  async findForUser(userUuid: string, lock = false) {
    return (
      (
        await sql<BuyerRecord>`SELECT uuid,name,email,business_name AS businessName,city,phone,status FROM tconnect_buyers WHERE user_uuid=${userUuid} ${lock ? sql`FOR UPDATE` : sql``}`.execute(
          this.database
        )
      ).rows[0] ?? null
    );
  }
  async countRecent(fingerprint: string) {
    return Number(
      (
        await sql<{
          total: number;
        }>`SELECT COUNT(*) AS total FROM tconnect_buyers WHERE registration_fingerprint=${fingerprint} AND created_at>DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 HOUR)`.execute(
          this.database
        )
      ).rows[0]?.total ?? 0
    );
  }
  async create(
    input: ReturnType<typeof buyerRegistration.parse>,
    userUuid: string,
    fingerprint: string
  ) {
    const uuid = randomBytes(4).toString("hex");
    await sql`INSERT INTO tconnect_buyers(uuid,user_uuid,name,email,business_name,city,phone,registration_fingerprint) VALUES (${uuid},${userUuid},${input.name},${input.email},${input.businessName},${input.city},${input.phone},${fingerprint})`.execute(
      this.database
    );
    return uuid;
  }
}
