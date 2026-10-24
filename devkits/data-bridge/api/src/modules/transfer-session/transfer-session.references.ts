import type { RowDataPacket } from "mysql2/promise";
import { AppError } from "@codexsun/framework/errors";
import { identifier, compatibleType, type TransferDatabase } from "./transfer-session.database.js";
import type {
  TransferColumn,
  TransferField,
  TransferParentMapping
} from "./transfer-session.types.js";
export class TransferReferences {
  private readonly cache = new Map<string, number>();
  constructor(
    private readonly database: TransferDatabase,
    private readonly mappings: TransferParentMapping[] = []
  ) {}
  async translate(
    data: Record<string, unknown>,
    fields: TransferField[],
    source: TransferColumn[],
    target: TransferColumn[]
  ) {
    const result = { ...data };
    for (const field of fields) {
      const destination = target.find((column) => column.name === field.target);
      if (field.mode !== "source" || !destination?.parent || result[field.target] === null)
        continue;
      const origin = source.find((column) => column.name === field.source);
      if (!origin?.parent)
        throw AppError.validation(`Choose an existing target parent for ${field.target}.`);
      result[field.target] = await this.resolve(
        origin.parent,
        destination.parent,
        result[field.target],
        new Set()
      );
    }
    return result;
  }
  private async resolve(
    sourceTable: string,
    targetTable: string,
    id: unknown,
    path: Set<string>
  ): Promise<number> {
    const key = `${sourceTable}:${targetTable}:${String(id)}`;
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;
    if (path.has(key) || path.size >= 20)
      throw AppError.validation(
        "Circular or too deep parent mapping. Select a target parent explicitly."
      );
    let schema = await this.database.schema(sourceTable, targetTable);
    if (
      !schema.source.some((c) => c.name === "id" && c.primary) ||
      !schema.target.some((c) => c.name === "id" && c.primary)
    )
      throw AppError.validation("Parent mapping requires primary id fields.");
    const [records] = await this.database.source.query<RowDataPacket[]>(
      `SELECT ${schema.source.map((c) => identifier(c.name)).join(",")} FROM ${identifier(sourceTable)} WHERE id=? LIMIT 1`,
      [id]
    );
    if (!records[0])
      throw AppError.validation(`Source parent ${sourceTable} (${String(id)}) is missing.`);
    const constants = new Set<string>();
    const mapping = this.mappings.find(
      (item) => item.sourceTable === sourceTable && item.targetTable === targetTable
    );
    if (mapping) {
      const columns: TransferColumn[] = [];
      const values: Record<string, unknown> = {};
      for (const field of mapping.fields) {
        const destination = schema.target.find((column) => column.name === field.target);
        const origin = schema.source.find((column) => column.name === field.source);
        if (field.mode === "source" && origin) {
          columns.push({ ...origin, name: field.target });
          values[field.target] = records[0]![field.source!];
        } else if (field.mode === "value" && destination) {
          constants.add(field.target);
          columns.push({ ...destination, parent: null });
          values[field.target] = field.value;
        }
      }
      Object.assign(records[0]!, values);
      schema = { ...schema, source: columns };
    }
    const [indexes] = await this.database.target.query<RowDataPacket[]>(
      `SHOW INDEX FROM ${identifier(targetTable)} WHERE Non_unique=0`
    );
    const groups = new Map<string, string[]>();
    for (const index of indexes) {
      const fields = groups.get(String(index.Key_name)) ?? [];
      fields[Number(index.Seq_in_index) - 1] = String(index.Column_name);
      groups.set(String(index.Key_name), fields);
    }
    if (
      ![...groups.values()].some((fields) =>
        fields.every(
          (name) =>
            !["id", "uuid", "created_by", "created_at", "updated_at"].includes(name) &&
            schema.source.some((column) => column.name === name)
        )
      )
    ) {
      const business = schema.target.filter(
        (column) =>
          !["id", "uuid", "created_by", "created_at", "updated_at"].includes(column.name) &&
          schema.source.some(
            (origin) => origin.name === column.name && compatibleType(origin.type, column.type)
          )
      );
      if (
        schema.target.some(
          (column) => column.parent && !business.some((candidate) => candidate.name === column.name)
        )
      )
        throw AppError.validation(
          `Select ${targetTable} parent explicitly; its relationship fields need mapping.`
        );
      if (business.length)
        groups.set(
          "full_business_record",
          business.map((column) => column.name)
        );
    }
    const matches = new Set<number>();
    for (const fields of groups.values()) {
      if (
        fields.some(
          (name) =>
            ["id", "uuid", "created_by", "created_at", "updated_at"].includes(name) ||
            !schema.source.some((c) => c.name === name) ||
            !schema.target.some(
              (c) =>
                c.name === name &&
                compatibleType(schema.source.find((column) => column.name === name)!.type, c.type)
            ) ||
            (records[0]![name] === null && fields !== groups.get("full_business_record"))
        )
      )
        continue;
      const values: unknown[] = [];
      for (const name of fields) {
        let value: unknown = records[0]![name];
        const from = schema.source.find((c) => c.name === name);
        const to = schema.target.find((c) => c.name === name);
        if (to?.parent && value !== null && !constants.has(name)) {
          if (!from?.parent)
            throw AppError.validation(`Map ${targetTable}.${name} parent explicitly.`);
          value = await this.resolve(from.parent, to.parent, value, new Set([...path, key]));
        }
        values.push(value);
      }
      const [found] = await this.database.target.query<RowDataPacket[]>(
        `SELECT id FROM ${identifier(targetTable)} WHERE ${fields.map((name) => `${identifier(name)} <=> ?`).join(" AND ")} LIMIT 2`,
        values
      );
      for (const row of found) matches.add(Number(row.id));
    }
    if (matches.size !== 1)
      throw AppError.validation(
        matches.size
          ? `Ambiguous target parent in ${targetTable}. Select it explicitly.`
          : `Import the matching ${targetTable} parent first; source parent ${String(id)} has no target match.`
      );
    const result = [...matches][0]!;
    this.cache.set(key, result);
    return result;
  }
}
