import { lockMemberScope } from "../member/index.js";
import { sql } from "kysely";
import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectContext } from "../../context.js";
import { lockCompany } from "../company/index.js";
import { ProductRepository } from "./product.repository.js";
import { productInput } from "./product.types.js";
export class ProductService {
  constructor(private context: TconnectContext) {}
  async search(q: string) {
    await this.context.authorize("tconnect.catalog.self");
    if (!this.context.buyer || this.context.member)
      throw AppError.forbidden("Buyer access required.");
    return new ProductRepository(this.context.database).search(q);
  }
  async list(companyUuid?: string, publicOnly = false) {
    if (!publicOnly && this.context.buyer) throw AppError.forbidden("Seller access required.");
    if (!publicOnly)
      await this.context.authorize(
        this.context.member ? "tconnect.product.self" : "tconnect.product.view"
      );
    if (
      !publicOnly &&
      this.context.member &&
      companyUuid &&
      companyUuid !== this.context.member.companyUuid
    )
      throw AppError.forbidden("You can view only your own products.");
    return new ProductRepository(this.context.database).list(
      publicOnly
        ? (companyUuid ?? null)
        : (this.context.member?.companyUuid ?? companyUuid ?? null),
      publicOnly
    );
  }
  async save(value: unknown, uuid?: string) {
    if (this.context.buyer) throw AppError.forbidden("Seller access required.");
    await this.context.authorize(
      this.context.member ? "tconnect.product.self" : "tconnect.product.manage"
    );
    const input = productInput.parse(value);
    if (this.context.member && input.companyUuid !== this.context.member.companyUuid)
      throw AppError.forbidden("You can manage only your own products.");
    return this.context.database.transaction().execute(async (database) => {
      if (this.context.member) {
        const current = await lockMemberScope(database, this.context.userUuid ?? "");
        if (current.companyUuid !== input.companyUuid)
          throw AppError.forbidden("Member ownership changed.");
      }
      const repository = new ProductRepository(database);
      if (uuid && !(await repository.lock(uuid, this.context.member?.companyUuid ?? null)))
        throw AppError.notFound("Product not found.");
      if (!(await lockCompany(database, input.companyUuid)))
        throw AppError.validation("Select an existing company.");
      const record = await repository.save(input, uuid);
      await sql`INSERT INTO tconnect_activity (uuid,resource,record_uuid,actor,action) VALUES (${randomBytes(4).toString("hex")},'product',${record.uuid},${this.context.actor},${uuid ? "update" : "create"})`.execute(
        database
      );
      return record;
    });
  }
}
