import { lockMemberScope } from "../member/index.js";
import { lockActiveAssociation } from "../association/index.js";
import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectContext } from "../../context.js";
import { CompanyRepository } from "./company.repository.js";
import { companyInput } from "./company.types.js";
export class CompanyService {
  constructor(private context: TconnectContext) {}
  async list(publicOnly: boolean) {
    if (!publicOnly && this.context.buyer) throw AppError.forbidden("Seller access required.");
    if (!publicOnly)
      await this.context.authorize(
        this.context.member ? "tconnect.company.self" : "tconnect.company.view"
      );
    return new CompanyRepository(this.context.database).list(
      publicOnly,
      publicOnly ? undefined : this.context.member?.companyUuid
    );
  }
  async save(value: unknown, uuid?: string) {
    if (this.context.buyer) throw AppError.forbidden("Seller access required.");
    await this.context.authorize(
      this.context.member ? "tconnect.company.self" : "tconnect.company.manage"
    );
    if (this.context.member && uuid !== this.context.member.companyUuid)
      throw AppError.forbidden("You can edit only your own company.");
    const input = companyInput.parse(value);
    if (this.context.member && input.associationUuid !== this.context.member.associationUuid)
      throw AppError.forbidden("Association affiliation requires staff approval.");
    return this.context.database.transaction().execute(async (database) => {
      const member = this.context.member
        ? await lockMemberScope(database, this.context.userUuid ?? "")
        : null;
      if (
        member &&
        (member.companyUuid !== uuid || input.associationUuid !== member.associationUuid)
      )
        throw AppError.forbidden(
          "Company ownership or association approval changed. Reload your profile."
        );
      const context = { ...this.context, database, member };
      return new CompanyService(context).saveTransaction(input, uuid);
    });
  }
  private async saveTransaction(input: ReturnType<typeof companyInput.parse>, uuid?: string) {
    if (uuid) {
      const found =
        await sql`SELECT id FROM tconnect_companies WHERE uuid=${uuid} FOR UPDATE`.execute(
          this.context.database
        );
      if (!found.rows.length) throw AppError.notFound("Company was not found.");
    }
    if (input.associationUuid) {
      if (!(await lockActiveAssociation(this.context.database, input.associationUuid)))
        throw AppError.validation("Select an active association.");
    }
    try {
      const record = await new CompanyRepository(this.context.database).save(input, uuid);
      await sql`INSERT INTO tconnect_activity (uuid, resource, record_uuid, actor, action)
        VALUES (${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}, 'company', ${record.uuid}, ${this.context.actor}, ${uuid ? "update" : "create"})`.execute(
        this.context.database
      );
      return record;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY")
        throw AppError.validation("This company address already exists.");
      throw error;
    }
  }
}
