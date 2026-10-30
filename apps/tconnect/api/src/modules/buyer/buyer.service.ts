import { AppError } from "@codexsun/framework/errors";
import { sql } from "kysely";
import { randomBytes } from "node:crypto";
import type { TconnectContext } from "../../context.js";
import { buyerRegistration } from "./buyer.types.js";
import { BuyerRepository } from "./buyer.repository.js";
export class BuyerService {
  constructor(private context: TconnectContext) {}
  async register(value: unknown) {
    const input = buyerRegistration.parse(value);
    if (
      !this.context.corporateId ||
      input.corporateId.toUpperCase() !== this.context.corporateId.toUpperCase()
    )
      throw AppError.validation("Corporate ID does not match this portal.");
    const provision = this.context.provisionBuyerIdentity;
    const fingerprint = this.context.registrationFingerprint;
    if (!provision || !fingerprint) throw AppError.forbidden("Buyer registration is unavailable.");
    try {
      return await this.context.database.transaction().execute(async (database) => {
        const repository = new BuyerRepository(database);
        if ((await repository.countRecent(fingerprint)) >= 5)
          throw AppError.validation("Registration limit reached. Please try again later.");
        const userUuid = await provision(database, {
          name: input.name,
          email: input.email,
          password: input.password
        });
        const uuid = await repository.create(input, userUuid, fingerprint);
        await sql`INSERT INTO tconnect_activity(uuid,resource,record_uuid,actor,action) VALUES (${randomBytes(4).toString("hex")},'buyer',${uuid},${input.email},'register')`.execute(
          database
        );
        return { uuid };
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
    await this.context.authorize("tconnect.buyer.self");
    if (!this.context.buyer || this.context.member)
      throw AppError.forbidden("Sign in with a buyer account.");
    return this.context.buyer;
  }
}
