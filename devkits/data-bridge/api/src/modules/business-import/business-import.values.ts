import { createHash } from "node:crypto";
import type { Connection, RowDataPacket } from "mysql2/promise";
import {
  identifier,
  type TransferDatabase,
  type TransferReferences,
  type TransferField
} from "../transfer-session/index.js";
import type { BusinessTable } from "./business-import.types.js";
export function businessFields(fields: TransferField[]) {
  return fields
    .filter(
      (f) =>
        f.mode !== "default" &&
        !["id", "uuid", "created_at", "updated_at"].includes(f.target) &&
        !/_by$/u.test(f.target)
    )
    .map((f) => f.target);
}
export function canonical(value: unknown): string {
  const normalize = (input: unknown): unknown =>
    Array.isArray(input)
      ? input.map(normalize)
      : input && typeof input === "object"
        ? Object.fromEntries(
            Object.entries(input)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => [k, normalize(v)])
          )
        : input;
  return JSON.stringify(normalize(value));
}
export function mappedValues(fields: TransferField[], source: Record<string, unknown>) {
  return Object.fromEntries(
    fields
      .filter((f) => f.mode === "source" || f.mode === "value")
      .map((f) => [f.target, f.mode === "source" ? source[f.source!] : f.value])
  );
}
export async function sourceFingerprint(connection: Connection, entry: BusinessTable) {
  const columns = [
    ...new Set(["id", ...entry.fields.filter((f) => f.mode === "source").map((f) => f.source!)])
  ];
  const hash = createHash("sha256");
  let cursor = 0,
    count = 0;
  while (true) {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT ${columns.map(identifier).join(",")} FROM ${identifier(entry.sourceTable)} WHERE id>? ORDER BY id LIMIT 500`,
      [cursor]
    );
    if (!rows.length) break;
    for (const row of rows) {
      hash.update(canonical({ ...row }));
      count++;
      cursor = Number(row.id);
    }
  }
  return { hash: hash.digest("hex"), count };
}

export async function prepareBusinessRow(
  database: TransferDatabase,
  references: TransferReferences,
  entry: BusinessTable,
  row: Record<string, unknown>
) {
  const schema = await database.schema(entry.sourceTable, entry.table);
  return references.translate(
    mappedValues(entry.fields, row),
    entry.fields,
    schema.source,
    schema.target
  );
}
export function sourceColumns(entry: BusinessTable) {
  return [
    ...new Set(["id", ...entry.fields.filter((f) => f.mode === "source").map((f) => f.source!)])
  ]
    .map(identifier)
    .join(",");
}
