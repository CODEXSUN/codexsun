import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { MarketingContext } from "../../context.js";
import { ConnectionRepository } from "./connection.repository.js";
import type { ConnectionInput } from "./connection.types.js";
export class ConnectionService {
  private readonly repository: ConnectionRepository;
  constructor(
    private readonly context: MarketingContext,
    private readonly validateParent: (input: ConnectionInput) => Promise<void> = async () => {}
  ) {
    this.repository = new ConnectionRepository(context);
  }
  async list(search: string, limit: number, offset: number, status = "all") {
    await this.context.authorize("marketing.connection.record.view");
    return this.repository.list(search, limit, offset, status);
  }
  async count(search: string, status = "all") {
    await this.context.authorize("marketing.connection.record.view");
    return this.repository.count(search, status);
  }
  async get(uuid: string) {
    await this.context.authorize("marketing.connection.record.view");
    const record = await this.repository.get(uuid);
    if (!record) throw AppError.notFound("Connection was not found.");
    return record;
  }
  async save(input: ConnectionInput, uuid?: string) {
    await this.context.authorize("marketing.connection.record." + (uuid ? "update" : "create"));
    if (uuid) {
      const previous = await this.get(uuid);
      if (previous.brandUuid !== input.brandUuid)
        throw AppError.validation("The parent brand cannot be changed.");
    }
    if (uuid) {
      const previous = await this.get(uuid);
      const grant = (
        await sql`SELECT id FROM marketing_connection_grants WHERE connection_uuid=${uuid} AND company_id=${this.context.companyId}`.execute(
          this.context.database
        )
      ).rows[0];
      if (
        grant &&
        (input.provider !== previous.provider ||
          input.externalAccountId !== previous.externalAccountId ||
          input.status !== "active")
      )
        throw AppError.conflict(
          "Disconnect the provider before changing its identity or deactivating the connection."
        );
    }
    await this.validateParent(input);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.get(await this.repository.save(input, uuid));
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "ER_DUP_ENTRY"
        ) {
          if (!uuid && attempt < 2) continue;
          throw AppError.conflict(
            "Connection name or identity already exists. Retry new records with a different name."
          );
        }
        throw error;
      }
    }
    throw AppError.conflict("Unable to reserve a record identity. Retry the request.");
  }
  async activity(uuid: string) {
    await this.get(uuid);
    return this.repository.activity(uuid);
  }
}
export async function lookupConnection(context: MarketingContext, uuid: string) {
  return new ConnectionService(context).get(uuid);
}
