import { lockBuyerScope } from "../buyer/index.js";
import { lockBuyerRequirement } from "../requirement/index.js";
import { lockPublishedProduct } from "../product/index.js";
import { buyerInquiryInput } from "./inquiry.types.js";
import { lockMemberScope } from "../member/index.js";
import { lockActiveCompany } from "../company/index.js";
import { sql } from "kysely";
import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectContext } from "../../context.js";
import { InquiryRepository } from "./inquiry.repository.js";
import { inquiryInput } from "./inquiry.types.js";
export class InquiryService {
  constructor(private context: TconnectContext) {}

  async sent() {
    const buyer = await this.buyer();
    return new InquiryRepository(this.context.database).sent(buyer.uuid);
  }
  async submitBuyer(value: unknown) {
    const buyer = await this.buyer();
    const input = buyerInquiryInput.parse(value);
    return this.context.database.transaction().execute(async (database) => {
      const current = await lockBuyerScope(database, this.context.userUuid ?? "");
      if (current.uuid !== buyer.uuid) throw AppError.forbidden("Buyer ownership changed.");
      if (input.requirementUuid)
        await lockBuyerRequirement(database, input.requirementUuid, buyer.uuid);
      if (!(await lockActiveCompany(database, input.companyUuid)))
        throw AppError.notFound("This seller is not accepting enquiries.");
      if (input.productUuid)
        await lockPublishedProduct(database, input.productUuid, input.companyUuid);
      const recent = await sql<{
        total: number;
      }>`SELECT COUNT(*) AS total FROM tconnect_inquiries WHERE buyer_uuid=${buyer.uuid} AND created_at>DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 HOUR)`.execute(
        database
      );
      if (Number(recent.rows[0]?.total) >= 20)
        throw AppError.validation(
          "You have reached the hourly enquiry limit. Please try again later."
        );
      const uuid = await new InquiryRepository(database).create(
        { ...input, buyerName: current.name, email: current.email, website: "" },
        buyer.uuid,
        input.productUuid,
        input.requirementUuid
      );
      await sql`INSERT INTO tconnect_activity(uuid,resource,record_uuid,actor,action) VALUES (${randomBytes(4).toString("hex")},'inquiry',${uuid},${this.context.actor},'buyer:create')`.execute(
        database
      );
      return { uuid };
    });
  }
  async submit(value: unknown) {
    const input = inquiryInput.parse(value);
    return this.context.database.transaction().execute(async (database) => {
      if (!(await lockActiveCompany(database, input.companyUuid)))
        throw AppError.notFound("This company is not accepting enquiries.");
      const recent = await sql<{
        total: number;
      }>`SELECT COUNT(*) AS total FROM tconnect_inquiries WHERE email=${input.email} AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 HOUR)`.execute(
        database
      );
      if (Number(recent.rows[0]?.total) >= 5)
        throw AppError.validation(
          "You have reached the hourly enquiry limit. Please try again later."
        );
      const uuid = await new InquiryRepository(database).create(input);
      await sql`INSERT INTO tconnect_activity (uuid,resource,record_uuid,actor,action) VALUES (${randomBytes(4).toString("hex")},'inquiry',${uuid},'public:buyer','create')`.execute(
        database
      );
      return { uuid };
    });
  }
  async list() {
    if (this.context.buyer) throw AppError.forbidden("Seller inbox access required.");
    await this.context.authorize(
      this.context.member ? "tconnect.inquiry.self" : "tconnect.inquiry.view"
    );
    return new InquiryRepository(this.context.database).list(this.context.member?.companyUuid);
  }
  async setStatus(uuid: string, status: "new" | "contacted" | "closed") {
    if (this.context.buyer) throw AppError.forbidden("Seller inbox access required.");
    await this.context.authorize(
      this.context.member ? "tconnect.inquiry.self" : "tconnect.inquiry.manage"
    );
    return this.context.database.transaction().execute(async (database) => {
      if (this.context.member) {
        const current = await lockMemberScope(database, this.context.userUuid ?? "");
        if (current.companyUuid !== this.context.member.companyUuid)
          throw AppError.forbidden("Member ownership changed.");
      }
      const found =
        await sql`SELECT id FROM tconnect_inquiries WHERE uuid=${uuid} AND (${this.context.member?.companyUuid ?? null} IS NULL OR companyUuid=${this.context.member?.companyUuid ?? null}) FOR UPDATE`.execute(
          database
        );
      if (!found.rows.length) throw AppError.notFound("Enquiry was not found.");
      await sql`UPDATE tconnect_inquiries SET status=${status} WHERE uuid=${uuid}`.execute(
        database
      );
      await sql`INSERT INTO tconnect_activity (uuid,resource,record_uuid,actor,action) VALUES (${randomBytes(4).toString("hex")},'inquiry',${uuid},${this.context.actor},${status})`.execute(
        database
      );
      return { uuid, status };
    });
  }
  private async buyer() {
    await this.context.authorize("tconnect.sent.self");
    if (!this.context.buyer || this.context.member)
      throw AppError.forbidden("An active buyer account is required.");
    return this.context.buyer;
  }
}
