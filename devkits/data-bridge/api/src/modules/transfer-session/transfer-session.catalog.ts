import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { TransferDatabase, compatibleType, identifier } from "./transfer-session.database.js";
import { withConnections } from "../import-review/index.js";
import type { CommonTableImportHost } from "../import-review/index.js";
import type { RowDataPacket } from "mysql2/promise";

export const connectionPair = z
  .object({
    sourceId: z.coerce.number().int().positive(),
    targetTenantId: z.coerce.number().int().positive()
  })
  .strict();
export const tableCatalogSchema = z.array(
  z
    .object({
      table: z.string(),
      sourceRows: z.number().int().nullable(),
      targetRows: z.number().int().nullable(),
      sourceAvailable: z.boolean(),
      targetAvailable: z.boolean(),
      issues: z.array(z.string())
    })
    .strict()
);

export async function readTableCatalog(
  host: CommonTableImportHost,
  sourceId: number,
  targetTenantId: number,
  select: (names: string[]) => readonly string[]
) {
  const [source, target] = await Promise.all([
    host.dataMigration.resolveSource(sourceId),
    host.resolveTenant(targetTenantId)
  ]);
  return withConnections(source, target, async (from, to) => {
    const database = new TransferDatabase(from, to);
    const tables = await database.tables();
    const [relations] = await to.query<RowDataPacket[]>(
      "SELECT TABLE_NAME AS child, REFERENCED_TABLE_NAME AS parent FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL"
    );
    const names = [...select(tables.target)];
    const ordered: string[] = [];
    while (names.length) {
      const next = names.findIndex(
        (name) =>
          !relations.some(
            (relation) =>
              relation.child === name &&
              relation.parent !== name &&
              names.includes(String(relation.parent))
          )
      );
      if (next < 0)
        throw AppError.validation("Table dependencies contain a cycle. Verify the mapping order.");
      ordered.push(names.splice(next, 1)[0]!);
    }
    const output = [];
    for (const table of ordered) {
      const sourceAvailable = tables.source.includes(table),
        targetAvailable = tables.target.includes(table);
      const origin = sourceAvailable ? await database.columns(from, table) : [];
      const destination = targetAvailable ? await database.columns(to, table) : [];
      const count = async (db: typeof from, exists: boolean) => {
        if (!exists) return null;
        const [rows] = await db.query<RowDataPacket[]>(
          `SELECT COUNT(*) AS total FROM ${identifier(table)}`
        );
        return Number(rows[0]!.total);
      };
      output.push({
        table,
        sourceAvailable,
        targetAvailable,
        sourceRows: await count(from, sourceAvailable),
        targetRows: await count(to, targetAvailable),
        issues: destination
          .filter(
            (column) =>
              !column.generated &&
              column.required &&
              !origin.some(
                (candidate) =>
                  candidate.name === column.name && compatibleType(candidate.type, column.type)
              )
          )
          .map((column) => column.name)
      });
    }
    return output;
  });
}
