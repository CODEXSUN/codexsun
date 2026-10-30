import { readTableCatalog, TransferService } from "../transfer-session/index.js";
import type { CommonTableImportHost } from "../import-review/index.js";
import { commonTableNames } from "./common-tables.policy.js";
export class CommonTablesService {
  constructor(private readonly host: CommonTableImportHost) {}
  catalog(sourceId: number, targetTenantId: number) {
    return readTableCatalog(this.host, sourceId, targetTenantId, () => commonTableNames);
  }
  async list() {
    return (await new TransferService(this.host).list()).filter((session) =>
      session.context
        ? session.context.group === "common"
        : commonTableNames.includes(session.targetTable as never)
    );
  }
  async create(sourceId: number, targetTenantId: number, actor: string) {
    return new TransferService(this.host).create(sourceId, targetTenantId, actor, {
      group: "common",
      targetTables: [...commonTableNames]
    });
  }
}
