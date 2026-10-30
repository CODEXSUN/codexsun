import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectContext } from "../../context.js";
import { AssociationRepository } from "./association.repository.js";
import { associationInput } from "./association.types.js";
export class AssociationService {
  constructor(private context: TconnectContext) {}
  list(publicOnly: boolean) {
    return new AssociationRepository(this.context.database).list(publicOnly);
  }
  async save(value: unknown, uuid?: string) {
    await this.context.authorize("tconnect.association.manage");
    const input = associationInput.parse(value);
    return this.context.database.transaction().execute(async (database) => {
      const context = { ...this.context, database };
      return new AssociationService(context).saveTransaction(input, uuid);
    });
  }
  private async saveTransaction(input: ReturnType<typeof associationInput.parse>, uuid?: string) {
    if (uuid) {
      const found =
        await sql`SELECT id FROM tconnect_associations WHERE uuid=${uuid} FOR UPDATE`.execute(
          this.context.database
        );
      if (!found.rows.length) throw AppError.notFound("Association was not found.");
    }
    if (uuid && input.status === "inactive") {
      const children =
        await sql`SELECT id FROM tconnect_companies WHERE associationUuid=${uuid} AND status='active'
        UNION ALL SELECT id FROM tconnect_community WHERE associationUuid=${uuid} AND status='active' LIMIT 1`.execute(
          this.context.database
        );
      if (children.rows.length)
        throw AppError.validation(
          "Suspend active members and community posts before suspending this association."
        );
    }
    try {
      const record = await new AssociationRepository(this.context.database).save(input, uuid);
      await sql`INSERT INTO tconnect_activity (uuid, resource, record_uuid, actor, action)
        VALUES (${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}, 'association', ${record.uuid}, ${this.context.actor}, ${uuid ? "update" : "create"})`.execute(
        this.context.database
      );
      return record;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY")
        throw AppError.validation("This association address already exists.");
      throw error;
    }
  }
}
