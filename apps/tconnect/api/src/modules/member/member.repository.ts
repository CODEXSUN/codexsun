import { sql, type Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import type { TconnectDatabase } from "../../context.js";
import type { MemberRegistration, MemberRecord } from "./member.types.js";
export class MemberRepository {
  constructor(private database: Kysely<TconnectDatabase>) {}
  async findForUser(userUuid: string, forUpdate = false) {
    return (
      (
        await sql<MemberRecord>`SELECT uuid,user_uuid AS userUuid,company_uuid AS companyUuid,name,email,account_type AS accountType,requested_association_uuid AS requestedAssociationUuid,membership_number AS membershipNumber,membership_status AS membershipStatus,status FROM tconnect_members WHERE user_uuid=${userUuid} LIMIT 1 ${forUpdate ? sql`FOR UPDATE` : sql``}`.execute(
          this.database
        )
      ).rows[0] ?? null
    );
  }
  async list() {
    return (
      await sql<MemberRecord>`SELECT uuid,user_uuid AS userUuid,company_uuid AS companyUuid,name,email,account_type AS accountType,requested_association_uuid AS requestedAssociationUuid,membership_number AS membershipNumber,membership_status AS membershipStatus,status FROM tconnect_members ORDER BY id DESC LIMIT 500`.execute(
        this.database
      )
    ).rows;
  }
  async countRecent(fingerprint: string) {
    const result = await sql<{
      total: number;
    }>`SELECT COUNT(*) AS total FROM tconnect_members WHERE registration_fingerprint=${fingerprint} AND created_at>DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 HOUR)`.execute(
      this.database
    );
    return Number(result.rows[0]?.total ?? 0);
  }
  async create(
    input: MemberRegistration,
    userUuid: string,
    companyUuid: string,
    fingerprint: string
  ) {
    const uuid = randomBytes(4).toString("hex");
    await sql`INSERT INTO tconnect_members (uuid,user_uuid,company_uuid,name,email,account_type,requested_association_uuid,membership_number,membership_status,registration_fingerprint)
 VALUES (${uuid},${userUuid},${companyUuid},${input.name},${input.email},${input.accountType},${input.associationUuid},${input.membershipNumber},${input.associationUuid ? "pending" : "none"},${fingerprint})`.execute(
      this.database
    );
    return uuid;
  }
  async review(
    uuid: string,
    membershipStatus: "approved" | "rejected",
    status: "active" | "inactive"
  ) {
    const found = (
      await sql<{
        companyUuid: string;
        associationUuid: string | null;
      }>`SELECT company_uuid AS companyUuid,requested_association_uuid AS associationUuid FROM tconnect_members WHERE uuid=${uuid} FOR UPDATE`.execute(
        this.database
      )
    ).rows[0];
    if (!found) return null;
    await sql`UPDATE tconnect_members SET membership_status=${membershipStatus},status=${status} WHERE uuid=${uuid}`.execute(
      this.database
    );
    return found;
  }
}
