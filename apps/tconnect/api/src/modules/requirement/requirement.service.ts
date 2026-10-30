import { sql } from "kysely";
import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectContext } from "../../context.js";
import { lockBuyerScope } from "../buyer/index.js";
import { lockBuyerRequirement } from "./requirement.lookup.js";
import { requirementInput } from "./requirement.types.js";
import { RequirementRepository } from "./requirement.repository.js";
export class RequirementService {
  constructor(private context: TconnectContext) {}

  async list() {
    const buyer = await this.buyer();
    return new RequirementRepository(this.context.database).list(buyer.uuid);
  }
  async board() {
    await this.context.authorize("tconnect.opportunity.self");
    if (!this.context.member || this.context.buyer)
      throw AppError.forbidden("Seller access required.");
    return new RequirementRepository(this.context.database).list(null);
  }
  async save(value: unknown, uuid?: string) {
    const buyer = await this.buyer();
    const input = requirementInput.parse(value);
    return this.context.database.transaction().execute(async (database) => {
      const current = await lockBuyerScope(database, this.context.userUuid ?? "");
      if (current.uuid !== buyer.uuid) throw AppError.forbidden("Buyer ownership changed.");
      if (uuid) await lockBuyerRequirement(database, uuid, buyer.uuid);
      const record = await new RequirementRepository(database).save(buyer.uuid, input, uuid);
      await sql`INSERT INTO tconnect_activity(uuid,resource,record_uuid,actor,action) VALUES (${randomBytes(4).toString("hex")},'requirement',${record.uuid},${this.context.actor},${uuid ? "update" : "create"})`.execute(
        database
      );
      return record;
    });
  }
  private async buyer() {
    await this.context.authorize("tconnect.requirement.self");
    if (!this.context.buyer || this.context.member)
      throw AppError.forbidden("An active buyer account is required.");
    return this.context.buyer;
  }
}
