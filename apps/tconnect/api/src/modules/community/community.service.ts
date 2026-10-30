import { lockActiveAssociation } from "../association/index.js";
import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectContext } from "../../context.js";
import { CommunityRepository } from "./community.repository.js";
import { communityInput } from "./community.types.js";
export class CommunityService {
  constructor(private context: TconnectContext) {}
  list(publicOnly: boolean) {
    return new CommunityRepository(this.context.database).list(publicOnly);
  }
  async save(value: unknown, uuid?: string) {
    await this.context.authorize("tconnect.community.manage");
    const input = communityInput.parse(value);
    return this.context.database.transaction().execute(async (database) => {
      const context = { ...this.context, database };
      return new CommunityService(context).saveTransaction(input, uuid);
    });
  }
  private async saveTransaction(input: ReturnType<typeof communityInput.parse>, uuid?: string) {
    if (uuid) {
      const found =
        await sql`SELECT id FROM tconnect_community WHERE uuid=${uuid} FOR UPDATE`.execute(
          this.context.database
        );
      if (!found.rows.length) throw AppError.notFound("Community was not found.");
    }
    if (input.associationUuid) {
      if (!(await lockActiveAssociation(this.context.database, input.associationUuid)))
        throw AppError.validation("Select an active association.");
    }
    try {
      const record = await new CommunityRepository(this.context.database).save(input, uuid);
      await sql`INSERT INTO tconnect_activity (uuid, resource, record_uuid, actor, action)
        VALUES (${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}, 'community', ${record.uuid}, ${this.context.actor}, ${uuid ? "update" : "create"})`.execute(
        this.context.database
      );
      return record;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY")
        throw AppError.validation("This community address already exists.");
      throw error;
    }
  }
}
