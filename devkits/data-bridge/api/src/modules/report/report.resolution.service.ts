import { createHash, randomUUID } from "node:crypto";
import type { Connection, RowDataPacket } from "mysql2/promise";
import { AppError } from "@codexsun/framework/errors";
import { CommonBulkRepository } from "./report.repository.js";
import { DatabaseImportLock } from "../database-connection/index.js";
import { CommonTableReferences } from "../import-review/index.js";
import { CommonTableRowAudit } from "../import-review/index.js";
import { identifier, sensitive, TransferDatabase } from "../transfer-session/index.js";
import { withConnections } from "../import-review/index.js";
import type { CommonTableImportHost, CommonTableName } from "../import-review/index.js";
import type { BulkImportReport } from "./report.types.js";
import type { ConflictResolution } from "./report.resolution.types.js";

export class ConflictResolutionService {
  private readonly reports: CommonBulkRepository;
  private readonly locks: DatabaseImportLock;
  constructor(private readonly host: CommonTableImportHost) {
    this.reports = new CommonBulkRepository(host.database);
    this.locks = new DatabaseImportLock(host.database);
  }

  async prepare(runId: string, table: CommonTableName, sourceId: number, actor: string) {
    return this.locks.withImportLock(`resolution:${runId}`, async () => {
      const report = await this.reports.get(runId);
      if (report.scope !== "masters" || !["warning", "success"].includes(report.status))
        throw AppError.validation("Complete a Core Masters audit first.");
      const row = report.tables
        .find((entry) => entry.table === table)
        ?.rows?.find((row) => row.rowId === sourceId);
      if (!row || row.status !== "warning" || !row.target)
        throw AppError.validation("Choose a conflicting row with an existing target match.");
      const plan = await this.connect(report, (source, target) =>
        this.current(source, target, table, sourceId, Object.keys(row.source), actor)
      );
      if (!plan.changes.length)
        throw AppError.validation("This record already matches. Run a fresh audit.");
      report.resolutions = [
        ...(report.resolutions ?? []).filter(
          (item) =>
            item.status === "committed" || item.table !== table || item.sourceId !== sourceId
        ),
        plan
      ];
      if (report.resolutions.length > 100)
        throw AppError.validation("Start a new audit before preparing more corrections.");
      await this.reports.update(report);
      return plan;
    });
  }

  async commit(runId: string, planId: string, fingerprint: string, actor: string) {
    return this.locks.withImportLock(`resolution:${runId}`, async () => {
      const report = await this.reports.get(runId);
      const plan = report.resolutions?.find((item) => item.id === planId);
      if (!plan || plan.fingerprint !== fingerprint)
        throw AppError.validation("Prepare and verify this correction first.");
      if (plan.status === "committed") return plan;
      await this.connect(report, async (source, target) => {
        const lock = `codexsun.bridge.table:${createHash("sha256").update(`${report.targetDatabase}.${plan.table}`).digest("hex").slice(0, 32)}`;
        const [acquired] = await target.query<RowDataPacket[]>(
          "SELECT GET_LOCK(?,30) AS acquired",
          [lock]
        );
        if (Number(acquired[0]?.acquired) !== 1)
          throw AppError.validation("Another import is using this target table.");
        try {
          await target.beginTransaction();
          try {
            await target.query(`SELECT id FROM ${identifier(plan.table)} WHERE id=? FOR UPDATE`, [
              plan.targetId
            ]);
            const fresh = await this.current(
              source,
              target,
              plan.table,
              plan.sourceId,
              Object.keys(plan.source),
              actor
            );
            const recovered =
              !fresh.changes.length &&
              fresh.targetId === plan.targetId &&
              fresh.targetUuid === plan.targetUuid &&
              JSON.stringify(fresh.source) === JSON.stringify(plan.source) &&
              JSON.stringify(fresh.prepared) === JSON.stringify(plan.prepared) &&
              JSON.stringify(fresh.references) === JSON.stringify(plan.references);
            if (fresh.fingerprint !== plan.fingerprint && !recovered)
              throw AppError.validation(
                "Source, parents, or target changed. Prepare the correction again."
              );
            if (!recovered)
              await target.execute(
                `UPDATE ${identifier(plan.table)} SET ${plan.changes.map((name) => `${identifier(name)}=?`).join(",")} WHERE id=?`,
                [...plan.changes.map((name) => this.bind(plan.prepared[name])), plan.targetId]
              );
            const checked = await new CommonTableRowAudit(
              target,
              plan.table,
              Object.keys(plan.prepared)
            ).row({ rowNumber: plan.sourceId, data: plan.prepared }, []);
            if (checked.status !== "existing")
              throw AppError.validation(
                "Saved values did not match the prepared data. Correction rolled back."
              );
            await target.commit();
          } catch (error) {
            await target.rollback();
            throw error;
          }
        } finally {
          await target.query("SELECT RELEASE_LOCK(?)", [lock]);
        }
      });
      plan.status = "committed";
      plan.actor = actor;
      plan.committedAt = new Date().toISOString();
      await this.reports.update(report);
      return plan;
    });
  }

  private async current(
    source: Connection,
    target: Connection,
    table: CommonTableName,
    sourceId: number,
    columns: string[],
    actor: string
  ): Promise<ConflictResolution> {
    const database = new TransferDatabase(source, target);
    const schema = await database.schema(table, table);
    if (
      !columns.length ||
      columns.some(
        (name) =>
          /^(id|uuid|created_by|created_at|updated_at|deleted_at)$/u.test(name) ||
          sensitive.test(name) ||
          !schema.source.some((column) => column.name === name) ||
          !schema.target.some((column) => column.name === name && !column.generated)
      )
    )
      throw AppError.validation("Only verified business fields can be corrected.");
    const verified = await database.verify(
      table,
      table,
      schema.target.map((column) => ({
        target: column.name,
        source: columns.includes(column.name) ? column.name : null,
        mode: columns.includes(column.name) ? "source" : "default",
        value: null
      }))
    );
    const [rows] = await source.query<RowDataPacket[]>(
      `SELECT ${columns.map(identifier).join(",")} FROM ${identifier(table)} WHERE id=?`,
      [sourceId]
    );
    if (!rows[0]) throw AppError.validation("The selected source record no longer exists.");
    const origin = Object.fromEntries(columns.map((name) => [name, rows[0]![name]]));
    const prepared = await new CommonTableReferences(source, target).prepare(table, origin);
    const audit = new CommonTableRowAudit(target, table, columns);
    const keys = await audit.uniqueKeys();
    const matches = new Set<number>();
    for (const names of keys) {
      if (names.some((name) => prepared.data[name] === null)) continue;
      const [found] = await target.query<RowDataPacket[]>(
        `SELECT id FROM ${identifier(table)} WHERE ${names.map((name) => `${identifier(name)} <=> ?`).join(" AND ")} LIMIT 2`,
        names.map((name) => this.bind(prepared.data[name]))
      );
      for (const row of found) matches.add(Number(row.id));
    }
    if (matches.size !== 1)
      throw AppError.validation("Correction requires one unambiguous target business-key match.");
    const targetId = [...matches][0]!;
    const [targets] = await target.query<RowDataPacket[]>(
      `SELECT * FROM ${identifier(table)} WHERE id=?`,
      [targetId]
    );
    const targetUuid = targets[0]!.uuid == null ? null : String(targets[0]!.uuid);
    const before = Object.fromEntries(columns.map((name) => [name, targets[0]![name]]));
    const changes = columns.filter(
      (name) => JSON.stringify(before[name]) !== JSON.stringify(prepared.data[name])
    );
    return {
      id: randomUUID(),
      table,
      sourceId,
      targetId,
      targetUuid,
      status: "prepared",
      source: origin,
      collection: prepared.collection,
      references: prepared.references,
      prepared: prepared.data,
      before,
      changes,
      fingerprint: createHash("sha256")
        .update(
          JSON.stringify({
            origin,
            prepared: prepared.data,
            references: prepared.references,
            before,
            targetId,
            targetUuid,
            schema: verified.hash
          })
        )
        .digest("hex"),
      actor,
      preparedAt: new Date().toISOString(),
      committedAt: null
    };
  }

  private async connect<T>(
    report: BulkImportReport,
    action: (source: Connection, target: Connection) => Promise<T>
  ) {
    const [source, target] = await Promise.all([
      this.host.dataMigration.resolveSource(report.sourceId),
      this.host.resolveTenant(report.targetTenantId)
    ]);
    if (source.database !== report.sourceDatabase || target.database !== report.targetDatabase)
      throw AppError.validation("The saved connection pair changed. Run a fresh audit.");
    return withConnections(source, target, action);
  }
  private bind(value: unknown) {
    return value !== null && typeof value === "object"
      ? JSON.stringify(value)
      : value === undefined
        ? null
        : (value as string | number | boolean | null);
  }
}
