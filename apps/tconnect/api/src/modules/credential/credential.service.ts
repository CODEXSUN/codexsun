import { sql } from "kysely";
import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectContext } from "../../context.js";
import { lockCompany } from "../company/index.js";
import { CredentialRepository } from "./credential.repository.js";
import { credentialInput, publicCredential } from "./credential.types.js";
export class CredentialService {
  constructor(private context: TconnectContext) {}
  async publicList() {
    const rows = await new CredentialRepository(this.context.database).list(true);
    return rows.map(
      ({
        privateNotes: _notes,
        reviewedBy: _actor,
        status: _status,
        companyName: _name,
        ...fields
      }) => publicCredential.parse(fields)
    );
  }
  async list() {
    await this.staff("view");
    return new CredentialRepository(this.context.database).list();
  }
  async save(value: unknown, uuid?: string) {
    await this.staff();
    const input = credentialInput.parse(value);
    if (
      input.status === "approved" &&
      (!input.reviewConfirmed || input.expiresOn < new Date().toISOString().slice(0, 10))
    )
      throw AppError.validation(
        "Approval requires a confirmed evidence review and an unexpired validity date."
      );
    try {
      return await this.context.database.transaction().execute(async (database) => {
        const repository = new CredentialRepository(database);
        if (uuid && !(await repository.lock(uuid)))
          throw AppError.notFound("Credential not found.");
        if (!(await lockCompany(database, input.companyUuid)))
          throw AppError.validation("Select an existing company.");
        const record = await repository.save(input, this.context.actor, uuid);
        await sql`INSERT INTO tconnect_activity(uuid,resource,record_uuid,actor,action) VALUES (${randomBytes(4).toString("hex")},'credential',${record.uuid},${this.context.actor},${uuid ? "update" : "create"})`.execute(
          database
        );
        return record;
      });
    } catch (error) {
      if ((error as { code?: string }).code === "ER_DUP_ENTRY")
        throw AppError.conflict("This credential reference already exists for the company.");
      throw error;
    }
  }
  private async staff(operation: "view" | "manage" = "manage") {
    if (this.context.member || this.context.buyer)
      throw AppError.forbidden("Only authorized staff can review credentials.");
    await this.context.authorize(`tconnect.credential.${operation}`);
  }
}
