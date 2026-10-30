import type { Connection, RowDataPacket } from "mysql2/promise";
import { TransferDatabase, identifier, sensitive } from "../transfer-session/index.js";
import { TransferReferences } from "../transfer-session/index.js";
import type { CommonTableName } from "./import-review.types.js";

export class CommonTableReferences {
  private readonly database: TransferDatabase;
  private readonly references: TransferReferences;
  private readonly labels = new Map<string, Record<string, unknown>>();
  constructor(source: Connection, target: Connection) {
    this.database = new TransferDatabase(source, target);
    this.references = new TransferReferences(this.database);
  }
  async translate(table: CommonTableName, data: Record<string, unknown>) {
    const schema = await this.database.schema(table, table);
    return this.references.translate(
      data,
      Object.keys(data).map((name) => ({
        target: name,
        source: name,
        mode: "source" as const,
        value: null
      })),
      schema.source,
      schema.target
    );
  }

  async prepare(table: CommonTableName, source: Record<string, unknown>) {
    const schema = await this.database.schema(table, table);
    const data = await this.translate(table, source);
    const collection = { ...source };
    const references = [];
    for (const column of schema.target) {
      if (!column.parent || !(column.name in source) || source[column.name] === null) continue;
      const sourceParent =
        schema.source.find((origin) => origin.name === column.name)?.parent ?? column.parent;
      const from = await this.identity(
        this.database.source,
        sourceParent,
        source[column.name],
        "source"
      );
      const to = await this.identity(
        this.database.target,
        column.parent,
        data[column.name],
        "target"
      );
      const sourceValue =
        from.name ?? from.label ?? from.code ?? from.rate_percent ?? from.value ?? from;
      const targetValue = to.name ?? to.label ?? to.code ?? to.rate_percent ?? to.value ?? to;
      delete collection[column.name];
      collection[column.name.replace(/_id$/u, "_name")] = sourceValue;
      references.push({
        field: column.name,
        parentTable: column.parent,
        sourceId: Number(source[column.name]),
        targetId: Number(data[column.name]),
        sourceValue,
        targetValue,
        sourceKey: from,
        targetKey: to
      });
    }
    return { data, collection, references };
  }

  private async identity(database: Connection, table: string, id: unknown, side: string) {
    const key = `${side}:${table}:${String(id)}`;
    const cached = this.labels.get(key);
    if (cached) return cached;
    const [rows] = await database.query<RowDataPacket[]>(
      `SELECT * FROM ${identifier(table)} WHERE id=?`,
      [id]
    );
    const record = Object.fromEntries(
      Object.entries(rows[0] ?? {}).filter(
        ([name]) =>
          !/^(id|uuid|created_by|created_at|updated_at|deleted_at)$/u.test(name) &&
          !name.endsWith("_id") &&
          !sensitive.test(name)
      )
    );
    this.labels.set(key, record);
    return record;
  }
}
