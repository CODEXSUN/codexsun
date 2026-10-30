import { sql } from "kysely";
import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectContext } from "../../context.js";
import { lockActiveAssociation } from "../association/index.js";
import { createRegisteredCompany, setApprovedCompanyAssociation } from "../company/index.js";
import { MemberRepository } from "./member.repository.js";
import { memberRegistration } from "./member.types.js";
export class MemberService {
  constructor(private context: TconnectContext) {}
  async register(value: unknown) {
    const input = memberRegistration.parse(value);
    if (
      !this.context.corporateId ||
      input.corporateId.toUpperCase() !== this.context.corporateId.toUpperCase()
    )
      throw AppError.validation("Corporate ID does not match this portal.");
    const provision = this.context.provisionIdentity;
    const fingerprint = this.context.registrationFingerprint;
    if (!provision || !fingerprint) throw AppError.forbidden("Registration is unavailable.");
    try {
      return await this.context.database.transaction().execute(async (database) => {
        const repository = new MemberRepository(database);
        if ((await repository.countRecent(fingerprint)) >= 5)
          throw AppError.validation("Registration limit reached. Please try again later.");
        if (
          input.associationUuid &&
          !(await lockActiveAssociation(database, input.associationUuid))
        )
          throw AppError.validation("Select an active association.");
        const userUuid = await provision(database, {
          name: input.name,
          email: input.email,
          password: input.password
        });
        const companyUuid = await createRegisteredCompany(database, {
          name: input.companyName,
          industry: input.industry,
          city: input.city
        });
        const uuid = await repository.create(input, userUuid, companyUuid, fingerprint);
        await sql`INSERT INTO tconnect_activity (uuid,resource,record_uuid,actor,action) VALUES (${randomBytes(4).toString("hex")},'member',${uuid},${input.email},'register')`.execute(
          database
        );
        return { uuid, companyUuid, membershipStatus: input.associationUuid ? "pending" : "none" };
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY")
        throw AppError.conflict(
          "Registration could not complete. If you already have an account, sign in or reset your password."
        );
      throw error;
    }
  }
  async session() {
    if (this.context.buyer) throw AppError.forbidden("Open your buyer workspace to continue.");
    if (this.context.member) {
      await this.context.authorize("tconnect.company.self");
      return {
        mode: "member" as const,
        member: await new MemberRepository(this.context.database).findForUser(
          this.context.userUuid ?? ""
        )
      };
    }
    await this.context.authorize("tconnect.member.manage");
    return { mode: "staff" as const, member: null };
  }
  async list() {
    await this.context.authorize("tconnect.member.manage");
    if (this.context.member || this.context.buyer)
      throw AppError.forbidden("Portal staff access required.");
    return new MemberRepository(this.context.database).list();
  }
  async review(
    uuid: string,
    membershipStatus: "approved" | "rejected",
    status: "active" | "inactive"
  ) {
    await this.context.authorize("tconnect.member.manage");
    if (this.context.member || this.context.buyer)
      throw AppError.forbidden("Portal staff access required.");
    return this.context.database.transaction().execute(async (database) => {
      const found = await new MemberRepository(database).review(uuid, membershipStatus, status);
      if (!found) throw AppError.notFound("Member not found.");
      const association = membershipStatus === "approved" ? found.associationUuid : null;
      if (association && !(await lockActiveAssociation(database, association)))
        throw AppError.validation("The association is inactive.");
      await setApprovedCompanyAssociation(database, found.companyUuid, association);
      await sql`INSERT INTO tconnect_activity (uuid,resource,record_uuid,actor,action) VALUES (${randomBytes(4).toString("hex")},'member',${uuid},${this.context.actor},${`${membershipStatus}:${status}`})`.execute(
        database
      );
      return { uuid, membershipStatus, status };
    });
  }
}
