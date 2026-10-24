import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { AppError } from "@codexsun/framework/errors";
import { CommonBulkRepository } from "./report.repository.js";
import { DatabaseImportLock } from "../database-connection/index.js";
import { CommonTableImportService, withConnections } from "../import-review/index.js";
import { CommonBulkEngine } from "./report.bulk.engine.js";
import { parentOrder } from "./report.bulk.order.js";
import {
  commonTableNames,
  coreTableNames,
  type CommonTableImportHost
} from "../import-review/index.js";
import type { BulkImportReport } from "./report.types.js";

export class CommonBulkService {
  private readonly reports: CommonBulkRepository;
  private readonly locks: DatabaseImportLock;
  constructor(private readonly host: CommonTableImportHost) {
    this.reports = new CommonBulkRepository(host.database);
    this.locks = new DatabaseImportLock(host.database);
  }
  latest(sourceId: number, targetTenantId: number, scope: "common" | "masters" = "common") {
    return this.reports.latest(sourceId, targetTenantId, scope);
  }
  get(id: string) {
    return this.reports.get(id);
  }

  async start(
    sourceId: number,
    targetTenantId: number,
    actor: string,
    correlationId: string,
    scope: "common" | "masters" = "common"
  ) {
    if (!this.host.enqueueBulk)
      throw AppError.validation("The Data Bridge import worker is unavailable.");
    return this.locks.withImportLock(`bulk:${sourceId}:${targetTenantId}`, async () => {
      const previous = await this.reports.latest(sourceId, targetTenantId, scope);
      if (previous && ["queued", "running"].includes(previous.status)) return previous;
      const [source, target] = await Promise.all([
        this.host.dataMigration.resolveSource(sourceId),
        this.host.resolveTenant(targetTenantId)
      ]);
      this.checkPair(source, target);
      const at = new Date().toISOString();
      const report: BulkImportReport = {
        id: randomUUID(),
        scope,
        sourceId,
        targetTenantId,
        sourceDatabase: source.database,
        targetDatabase: target.database,
        actor,
        at,
        updatedAt: at,
        status: "queued",
        message: "Queued for audit and import in parent order.",
        tables: []
      };
      await this.reports.create(report);
      try {
        await this.host.enqueueBulk!({ runId: report.id, targetTenantId, actor, correlationId });
      } catch (error) {
        report.status = "failed";
        report.message = "The import could not be queued. Try again.";
        await this.reports.update(report);
        throw error;
      }
      return report;
    });
  }

  async run(id: string, targetTenantId: number) {
    const report = await this.reports.get(id);
    if (report.targetTenantId !== targetTenantId)
      throw AppError.forbidden("The import job target does not match its report.");
    if (["success", "warning"].includes(report.status)) return report;
    return this.locks.withImportLock(
      `bulk:${report.sourceId}:${report.targetTenantId}`,
      async () => {
        report.status = "running";
        await this.reports.update(report);
        try {
          const [source, target] = await Promise.all([
            this.host.dataMigration.resolveSource(report.sourceId),
            this.host.resolveTenant(report.targetTenantId)
          ]);
          this.checkPair(source, target);
          await withConnections(source, target, async (sourceDb, targetDb) => {
            const [foreignKeys] = await targetDb.query<RowDataPacket[]>(
              "SELECT TABLE_NAME AS child, REFERENCED_TABLE_NAME AS parent FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL"
            );
            const dependencies = new Map<string, string[]>();
            for (const row of foreignKeys) {
              const parents = dependencies.get(String(row.child)) ?? [];
              parents.push(String(row.parent));
              dependencies.set(String(row.child), parents);
            }
            const ordered = parentOrder(
              report.scope === "masters" ? coreTableNames : commonTableNames,
              dependencies
            );
            if (!report.tables.length)
              report.tables = ordered.map((table) => ({
                table,
                status: "pending",
                sourceRows: 0,
                existing: 0,
                inserted: 0,
                message: "",
                importId: null,
                attention: []
              }));
            const engine = new CommonBulkEngine(
              sourceDb,
              targetDb,
              new CommonTableImportService(this.host)
            );
            for (const table of report.tables) {
              if (["success", "warning"].includes(table.status)) continue;
              await engine.table(report, table, () => this.reports.update(report));
            }
          });
          report.status = report.tables.some((table) => table.status === "warning")
            ? "warning"
            : "success";
          report.message =
            report.status === "success"
              ? report.scope === "masters"
                ? "All Core masters and common parents audited successfully."
                : "All common tables audited successfully."
              : "Import completed with records or tables needing attention.";
        } catch (error) {
          report.status = "failed";
          report.message =
            error instanceof Error && (error instanceof AppError || !("code" in error))
              ? error.message
              : "Import interrupted. Retry the queue job or review the connection.";
          await this.reports.update(report);
          throw error;
        }
        await this.reports.update(report);
        return report;
      }
    );
  }

  private checkPair(
    source: { host: string; port: number; database: string },
    target: { host: string; port: number; database: string }
  ) {
    const normalize = (host: string) =>
      ["127.0.0.1", "localhost", "::1"].includes(host.toLowerCase()) ? "local" : host.toLowerCase();
    if (
      source.database === target.database &&
      source.port === target.port &&
      normalize(source.host) === normalize(target.host)
    )
      throw AppError.validation("Choose different source and target databases.");
  }
}
