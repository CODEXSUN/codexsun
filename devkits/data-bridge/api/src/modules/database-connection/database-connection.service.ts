import { AppError } from "@codexsun/framework/errors";
import { withConnections, type CommonTableImportHost } from "../import-review/index.js";

export class DatabaseConnectionService {
  constructor(private readonly host: CommonTableImportHost) {}
  async verify(sourceId: number, targetTenantId: number) {
    const [source, target] = await Promise.all([
      this.host.dataMigration.resolveSource(sourceId),
      this.host.resolveTenant(targetTenantId)
    ]);
    if (
      source.database === target.database &&
      source.host === target.host &&
      source.port === target.port
    )
      throw AppError.validation("Source and destination must be different databases.");
    await withConnections(source, target, async (from, to) => {
      await from.query("SELECT 1");
      await to.query("SELECT 1");
    });
    return {
      sourceId,
      targetTenantId,
      sourceDatabase: source.database,
      targetDatabase: target.database,
      verifiedAt: new Date().toISOString()
    };
  }
}
