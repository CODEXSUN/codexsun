import { BusinessChildAudit } from "./business-import.children.js";
import type { Connection, RowDataPacket } from "mysql2/promise";
import { TransferDatabase, TransferReferences, identifier } from "../transfer-session/index.js";
import { CommonTableRowAudit } from "../import-review/index.js";
import { billingInvoiceTables } from "../billing-tables/index.js";
import {
  businessFields,
  canonical,
  prepareBusinessRow,
  sourceColumns
} from "./business-import.values.js";
import { BusinessImportRepository } from "./business-import.repository.js";
import type { BusinessRun, InvoiceVerification } from "./business-import.types.js";
export class BusinessInvoiceAudit {
  private readonly database: TransferDatabase;
  private readonly references: TransferReferences;
  constructor(
    private readonly source: Connection,
    private readonly target: Connection,
    private readonly reports: BusinessImportRepository,
    private readonly run: BusinessRun
  ) {
    this.database = new TransferDatabase(source, target);
    this.references = new TransferReferences(
      this.database,
      run.tables.map((t) => ({
        sourceTable: t.sourceTable,
        targetTable: t.table,
        fields: t.fields
      }))
    );
  }
  async verify(progress: () => Promise<void>) {
    const [relations] = await this.target.query<RowDataPacket[]>(
      "SELECT TABLE_NAME child,COLUMN_NAME field,REFERENCED_TABLE_NAME parent FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL"
    );
    for (const entry of this.run.tables.filter(
      (t) => (billingInvoiceTables as readonly string[]).includes(t.table) && t.blocked
    )) {
      const issue = `Invoice verification unavailable for ${entry.table}: ${entry.message}`;
      if (!this.run.issues.includes(issue)) this.run.issues.push(issue);
    }
    for (const entry of this.run.tables.filter(
      (t) =>
        (billingInvoiceTables as readonly string[]).includes(t.table) &&
        t.status !== "skipped" &&
        !t.blocked
    )) {
      let cursor = 0;
      while (true) {
        const [rows] = await this.source.query<RowDataPacket[]>(
          `SELECT ${sourceColumns(entry)} FROM ${identifier(entry.sourceTable)} WHERE id>? AND id<=? ORDER BY id LIMIT 100`,
          [cursor, entry.upperId]
        );
        if (!rows.length) break;
        for (const row of rows) {
          const result: InvoiceVerification = {
            table: entry.table,
            sourceId: Number(row.id),
            targetId: null,
            identity: String(row.id),
            status: "success",
            deleted: Boolean(row.deleted_at),
            message: "Header and included business children match.",
            children: []
          };
          try {
            const prepared = await prepareBusinessRow(this.database, this.references, entry, row);
            result.deleted = Boolean(prepared.deleted_at);
            const fields = businessFields(entry.fields);
            const audit = new CommonTableRowAudit(this.target, entry.table, fields);
            const keys = await audit.uniqueKeys();
            const candidates = [
              fields,
              ...keys.filter(
                (k) => !k.some((name) => prepared[name] === null || prepared[name] === undefined)
              )
            ];
            let target: RowDataPacket | undefined;
            for (const key of candidates) {
              if (!key.length) continue;
              const [found] = await this.target.query<RowDataPacket[]>(
                `SELECT id,${fields.map(identifier).join(",")} FROM ${identifier(entry.table)} WHERE ${key.map((name) => `${identifier(name)} <=> ?`).join(" AND ")} LIMIT 2`,
                key.map((name) =>
                  typeof prepared[name] === "object" && prepared[name] !== null
                    ? JSON.stringify(prepared[name])
                    : prepared[name]
                )
              );
              if (found.length === 1) {
                target = found[0];
                break;
              }
            }
            result.identity = canonical(
              Object.fromEntries((keys[0] ?? fields.slice(0, 2)).map((key) => [key, prepared[key]]))
            );
            if (!target) {
              result.status = "warning";
              result.message = "Target invoice is missing or its identity is ambiguous.";
            } else {
              result.targetId = Number(target.id);
              if (
                canonical(Object.fromEntries(fields.map((f) => [f, prepared[f]]))) !==
                canonical(Object.fromEntries(fields.map((f) => [f, target![f]])))
              ) {
                result.status = "warning";
                result.message = "Existing invoice header differs. Target was preserved.";
              }
              await new BusinessChildAudit(
                this.source,
                this.target,
                this.database,
                this.references,
                this.run,
                relations
              ).walk(entry.table, entry.table, Number(row.id), Number(target.id), result);
              if (result.children.some((c) => c.differences || c.extra)) {
                result.status = "warning";
                result.message =
                  "One or more child rows are missing, different, extra, or blocked. Target data was preserved.";
              }
            }
          } catch (error) {
            result.status = "warning";
            result.message =
              error instanceof Error && !("code" in error)
                ? error.message
                : "Invoice verification failed.";
          }
          await this.reports.saveInvoice(this.run.id, result);
          cursor = Number(row.id);
        }
        const counts = await this.reports.invoiceCounts(this.run.id);
        this.run.invoiceCount = Number(counts.total);
        this.run.invoiceMatched = Number(counts.matched);
        this.run.invoiceWarnings = Number(counts.warnings);
        await progress();
      }
    }
  }
}
