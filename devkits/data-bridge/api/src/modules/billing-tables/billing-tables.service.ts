import { readTableCatalog, TransferService } from "../transfer-session/index.js";
import type { CommonTableImportHost } from "../import-review/index.js";
import { billingTableNames } from "./billing-tables.policy.js";
export class BillingTablesService {
  constructor(private readonly host: CommonTableImportHost) {}
  catalog(sourceId: number, targetTenantId: number) {
    return readTableCatalog(this.host, sourceId, targetTenantId, billingTableNames);
  }
  async list() {
    return (await new TransferService(this.host).list()).filter((session) =>
      session.context
        ? session.context.group === "billing"
        : session.targetTable.startsWith("billing_")
    );
  }
  async create(sourceId: number, targetTenantId: number, actor: string) {
    return new TransferService(this.host).create(sourceId, targetTenantId, actor, {
      group: "billing",
      targetTables: [...(await this.catalog(sourceId, targetTenantId)).map((row) => row.table)]
    });
  }
}
