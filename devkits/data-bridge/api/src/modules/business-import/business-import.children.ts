import type { Connection, RowDataPacket } from "mysql2/promise";
import { TransferDatabase, TransferReferences, identifier } from "../transfer-session/index.js";
import {
  businessFields,
  canonical,
  prepareBusinessRow,
  sourceColumns
} from "./business-import.values.js";
import type { BusinessRun, BusinessTable, InvoiceVerification } from "./business-import.types.js";
export class BusinessChildAudit {
  constructor(
    private readonly source: Connection,
    private readonly target: Connection,
    private readonly database: TransferDatabase,
    private readonly references: TransferReferences,
    private readonly run: BusinessRun,
    private readonly relations: RowDataPacket[]
  ) {}
  async walk(
    root: string,
    parent: string,
    sourceId: number,
    targetId: number,
    result: InvoiceVerification,
    visited = new Set<string>()
  ) {
    const key = `${parent}:${sourceId}:${targetId}`;
    if (visited.has(key)) return;
    visited.add(key);
    for (const relation of this.relations.filter(
      (r) => r.parent === parent && r.child !== parent
    )) {
      const entry = this.run.tables.find((t) => t.table === relation.child);
      if (!entry || entry.status === "skipped") continue;
      if (
        parent !== root &&
        this.relations.some((r) => r.child === entry.table && r.parent === root)
      )
        continue;
      const checked = await this.compare(entry, String(relation.field), sourceId, targetId);
      const previous = result.children.find((c) => c.table === entry.table);
      if (previous) {
        previous.sourceIds.push(...checked.summary.sourceIds);
        for (const name of ["sourceRows", "targetRows", "matched", "differences", "extra"] as const)
          previous[name] += checked.summary[name];
        if (previous.differences || previous.extra)
          previous.message = "Review unmatched source or extra target children.";
      } else result.children.push(checked.summary);
      for (const match of checked.matches)
        await this.walk(root, entry.table, match.sourceId, match.targetId, result, visited);
    }
  }
  private async compare(
    entry: BusinessTable,
    targetField: string,
    sourceId: number,
    targetId: number
  ) {
    const relation = entry.fields.find((f) => f.target === targetField && f.mode === "source");
    const summary = {
      table: entry.table,
      sourceIds: [] as number[],
      sourceRows: 0,
      targetRows: 0,
      matched: 0,
      differences: 0,
      extra: 0,
      message: "All child values match."
    };
    const matches: Array<{ sourceId: number; targetId: number }> = [];
    if (!relation?.source || entry.blocked) {
      summary.differences = 1;
      summary.message = "Child mapping requires review.";
      return { summary, matches };
    }
    const [sourceRows] = await this.source.query<RowDataPacket[]>(
      `SELECT ${sourceColumns(entry)} FROM ${identifier(entry.sourceTable)} WHERE ${identifier(relation.source)}=?`,
      [sourceId]
    );
    const fields = businessFields(entry.fields);
    const [targetRows] = await this.target.query<RowDataPacket[]>(
      `SELECT id,${fields.map(identifier).join(",")} FROM ${identifier(entry.table)} WHERE ${identifier(targetField)}=?`,
      [targetId]
    );
    const candidates = new Map<string, RowDataPacket[]>();
    for (const row of targetRows) {
      const key = canonical(Object.fromEntries(fields.map((f) => [f, row[f]])));
      const values = candidates.get(key) ?? [];
      values.push(row);
      candidates.set(key, values);
    }
    for (const row of sourceRows) {
      try {
        const data = await prepareBusinessRow(this.database, this.references, entry, row);
        const key = canonical(Object.fromEntries(fields.map((f) => [f, data[f]])));
        const match = candidates.get(key)?.shift();
        if (match) matches.push({ sourceId: Number(row.id), targetId: Number(match.id) });
      } catch {
        // Unresolved source values count as unmatched children below.
      }
    }
    summary.sourceIds = sourceRows.map((row) => Number(row.id));
    summary.sourceRows = sourceRows.length;
    summary.targetRows = targetRows.length;
    summary.matched = matches.length;
    summary.differences = sourceRows.length - matches.length;
    summary.extra = [...candidates.values()].reduce((n, rows) => n + rows.length, 0);
    if (summary.differences || summary.extra)
      summary.message = "Review unmatched source or extra target children.";
    return { summary, matches };
  }
}
