import type { Connection, RowDataPacket } from "mysql2/promise";
import { TransferService, TransferDatabase, identifier } from "../transfer-session/index.js";
import type { CommonTableImportHost } from "../import-review/index.js";
import { sourceFingerprint } from "./business-import.values.js";
import type { BusinessRun } from "./business-import.types.js";
export class BusinessIntegrity {
  constructor(
    private readonly host: CommonTableImportHost,
    private readonly source: Connection,
    private readonly target: Connection
  ) {}
  async verify(run: BusinessRun, progress: () => Promise<void>) {
    const database = new TransferDatabase(this.source, this.target),
      transfers = new TransferService(this.host);
    for (const entry of run.tables) {
      if (entry.status === "skipped" || entry.blocked) continue;
      entry.verificationIssues = [];
      try {
        const schema = await database.schema(entry.sourceTable, entry.table);
        if (schema.hash !== entry.schemaHash)
          throw new Error("Schema changed after import. Re-map and audit this table.");
        const fingerprint = await sourceFingerprint(this.source, entry);
        entry.sourceChanged =
          fingerprint.hash !== entry.sourceHash || fingerprint.count !== entry.sourceRows;
        for (const id of entry.sessions) {
          const session = await transfers.get(id);
          for (const saved of session.rows) {
            if (saved.status === "warning") continue;
            const checked = { ...saved, data: { ...saved.data } };
            await database.audit(entry.table, checked, entry.fields);
            if (checked.status !== "existing")
              entry.verificationIssues.push({
                sourceId: saved.sourceId,
                message: "Saved target values changed or are missing after import."
              });
          }
        }
        const [counts] = await this.target.query<RowDataPacket[]>(
          `SELECT COUNT(*) total FROM ${identifier(entry.table)}`
        );
        entry.targetRows = Number(counts[0]!.total);
        entry.verified =
          !entry.sourceChanged && !entry.verificationIssues.length && !entry.warnings;
        entry.warnings =
          new Set([...entry.warningIds, ...entry.verificationIssues.map((r) => r.sourceId)]).size +
          (entry.sourceChanged ? 1 : 0);
        if (entry.warnings) {
          entry.status = "warning";
          if (entry.sourceChanged)
            entry.message = "Source data changed during this run. Start a fresh audit.";
        }
      } catch (error) {
        entry.status = "warning";
        entry.warnings = Math.max(1, entry.warnings);
        entry.message =
          error instanceof Error && !("code" in error)
            ? error.message
            : "Post-import verification failed.";
      }
      await progress();
    }
    const [relations] = await this.target.query<RowDataPacket[]>(
      "SELECT TABLE_NAME child,COLUMN_NAME field,REFERENCED_TABLE_NAME parent,REFERENCED_COLUMN_NAME parent_field FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL"
    );
    run.relationships = 0;
    run.orphans = 0;
    for (const relation of relations.filter((r) =>
      run.tables.some((t) => t.table === r.child && t.status !== "skipped")
    )) {
      const [counts] = await this.target.query<RowDataPacket[]>(
        `SELECT COUNT(*) total FROM ${identifier(String(relation.child))} c LEFT JOIN ${identifier(String(relation.parent))} p ON c.${identifier(String(relation.field))}=p.${identifier(String(relation.parent_field))} WHERE c.${identifier(String(relation.field))} IS NOT NULL AND p.${identifier(String(relation.parent_field))} IS NULL`
      );
      run.relationships++;
      run.orphans += Number(counts[0]!.total);
    }
  }
}
