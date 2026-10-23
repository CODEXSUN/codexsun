import type { Connection, RowDataPacket } from "mysql2/promise";
import { AppError } from "@codexsun/framework/errors";
import { commonTableNames, type CommonTableName } from "./common-table-import.types.js";

export class CommonTableReferences {
  private readonly ids = new Map<string, number>();
  private readonly relations = new Map<string, Array<{ field: string; parent: CommonTableName }>>();

  constructor(
    private readonly source: Connection,
    private readonly target: Connection
  ) {}

  async translate(table: CommonTableName, data: Record<string, unknown>, path = new Set<string>()) {
    const translated = { ...data };
    for (const relation of await this.foreignKeys(table)) {
      if (!(relation.field in translated) || translated[relation.field] === null) continue;
      translated[relation.field] = await this.parentId(
        relation.parent,
        translated[relation.field],
        path
      );
    }
    return translated;
  }

  private async parentId(
    table: CommonTableName,
    sourceId: unknown,
    path: Set<string>
  ): Promise<number> {
    const key = `${table}:${String(sourceId)}`;
    const cached = this.ids.get(key);
    if (cached !== undefined) return cached;
    if (path.has(key)) throw AppError.validation(`Circular parent reference in ${table}.`);
    const [rows] = await this.source.query<RowDataPacket[]>(
      `SELECT * FROM \`${table}\` WHERE id = ? LIMIT 1`,
      [sourceId]
    );
    if (!rows[0])
      throw AppError.validation(`Source parent ${table} (${String(sourceId)}) is missing.`);
    const data = await this.translate(table, rows[0], new Set([...path, key]));
    const [indexes] = await this.target.query<RowDataPacket[]>(
      `SHOW INDEX FROM \`${table}\` WHERE Non_unique = 0`
    );
    const keys = new Map<string, string[]>();
    for (const index of indexes) {
      const fields = keys.get(String(index.Key_name)) ?? [];
      fields[Number(index.Seq_in_index) - 1] = String(index.Column_name);
      keys.set(String(index.Key_name), fields);
    }
    const matches = new Set<number>();
    for (const fields of keys.values()) {
      if (
        fields.some(
          (field) =>
            field === "id" || field === "uuid" || data[field] === undefined || data[field] === null
        )
      )
        continue;
      const [found] = await this.target.query<RowDataPacket[]>(
        `SELECT id FROM \`${table}\` WHERE ${fields.map((field) => `\`${field}\` <=> ?`).join(" AND ")} LIMIT 2`,
        fields.map((field) => data[field])
      );
      for (const row of found) matches.add(Number(row.id));
    }
    if (matches.size !== 1)
      throw AppError.validation(
        matches.size
          ? `Ambiguous target parent in ${table}. Resolve its business keys before import.`
          : `Import the matching ${table} parent before this table; source parent ${String(sourceId)} has no target match.`
      );
    const id = [...matches][0]!;
    this.ids.set(key, id);
    return id;
  }

  private async foreignKeys(table: CommonTableName) {
    const cached = this.relations.get(table);
    if (cached) return cached;
    const [rows] = await this.target.query<RowDataPacket[]>(
      "SELECT COLUMN_NAME AS field, REFERENCED_TABLE_NAME AS parent, REFERENCED_COLUMN_NAME AS parentField FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL",
      [table]
    );
    const relations = rows.map((row) => {
      if (
        !commonTableNames.includes(row.parent as CommonTableName) ||
        row.parentField !== "id" ||
        !/^[a-z_][a-z0-9_]*$/u.test(String(row.field))
      ) {
        throw AppError.validation(`Unsupported parent relationship for ${table}.`);
      }
      return { field: String(row.field), parent: row.parent as CommonTableName };
    });
    this.relations.set(table, relations);
    return relations;
  }
}
