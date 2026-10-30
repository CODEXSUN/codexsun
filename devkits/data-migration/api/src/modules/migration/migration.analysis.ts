import type { Connection, RowDataPacket } from "mysql2/promise";
import type { MigrationTenant } from "./migration.types.js";

const identifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/u;
const analysisRowLimit = 10000;
const excludedTables = new Set(["migration_schema"]);

export type MigrationTableAnalysis = {
  table: string;
  sourceRows: number;
  targetRows: number;
  status: "ready" | "already-present" | "blocked" | "mapping-required" | "excluded" | "review";
  schemaCompatible: boolean;
  newRows: number | null;
  exactRows: number | null;
  conflictingRows: number | null;
  reason: string | null;
  dependencies: string[];
  sourceColumns: AnalysisColumn[];
  targetColumns: AnalysisColumn[];
};

export type AnalysisColumn = {
  name: string;
  type: string;
  nullable: boolean;
  required: boolean;
  generated: boolean;
};

export async function analyzeDatabases(
  sourceConnection: Connection,
  targetConnection: Connection,
  source: MigrationTenant,
  target: MigrationTenant
) {
  const sourceTables = await listTables(sourceConnection, source.database);
  const targetTables = new Set(await listTables(targetConnection, target.database));
  const rows: MigrationTableAnalysis[] = [];

  for (const table of sourceTables) {
    if (excludedTables.has(table)) {
      rows.push(excluded(table));
      continue;
    }
    if (!targetTables.has(table)) {
      rows.push(blocked(table, "Destination table is missing.", await count(sourceConnection, table)));
      continue;
    }

    rows.push(await analyzeTable(sourceConnection, targetConnection, source, target, table));
  }

  const byName = new Map(rows.map((row) => [row.table, row]));
  for (const row of rows) {
    if (row.status !== "ready") continue;
    for (const dependency of row.dependencies) {
      const parent = byName.get(dependency);
      if (!parent || parent.status === "excluded") {
        block(row, `Required parent table ${dependency} is outside this migration.`);
      } else if (parent.status === "blocked" || parent.status === "review") {
        block(row, `Required parent table ${dependency} needs conflict review first.`);
      } else if (parent.status === "ready") {
        block(row, `Copy parent table ${dependency} first, then reanalyze.`);
      }
    }
  }

  return {
    source: { label: source.label, database: source.database },
    target: { label: target.label, database: target.database },
    tables: rows,
    summary: {
      sourceTables: sourceTables.length,
      ready: rows.filter((row) => row.status === "ready").length,
      alreadyPresent: rows.filter((row) => row.status === "already-present").length,
      blocked: rows.filter((row) => row.status === "blocked").length,
      mappingRequired: rows.filter((row) => row.status === "mapping-required").length,
      review: rows.filter((row) => row.status === "review").length,
      excluded: rows.filter((row) => row.status === "excluded").length,
      sourceRows: rows.reduce((sum, row) => sum + row.sourceRows, 0),
      newRows: rows.reduce((sum, row) => sum + (row.newRows ?? 0), 0),
      exactRows: rows.reduce((sum, row) => sum + (row.exactRows ?? 0), 0),
      conflictingRows: rows.reduce((sum, row) => sum + (row.conflictingRows ?? 0), 0)
    }
  };
}

async function analyzeTable(
  sourceConnection: Connection,
  targetConnection: Connection,
  source: MigrationTenant,
  target: MigrationTenant,
  table: string
): Promise<MigrationTableAnalysis> {
  const [
    sourceColumns,
    targetColumns,
    sourceRows,
    targetRows,
    dependencies,
    sourceEngine,
    targetEngine
  ] = await Promise.all([
    columns(sourceConnection, source.database, table),
    columns(targetConnection, target.database, table),
    count(sourceConnection, table),
    count(targetConnection, table),
    dependenciesFor(sourceConnection, source.database, table),
    engine(sourceConnection, source.database, table),
    engine(targetConnection, target.database, table)
  ]);
  const compatible = schemasCompatible(sourceColumns, targetColumns);
  if (sourceEngine?.toLowerCase() !== "innodb" || targetEngine?.toLowerCase() !== "innodb") {
    return result(
      table,
      sourceRows,
      targetRows,
      "blocked",
      compatible,
      null,
      null,
      null,
      "Source and destination tables must use InnoDB for consistent reads and atomic rollback.",
      dependencies,
      sourceColumns,
      targetColumns
    );
  }
  if (!sourceRows)
    return result(
      table,
      sourceRows,
      targetRows,
      "already-present",
      compatible,
      0,
      0,
      0,
      null,
      dependencies,
      sourceColumns,
      targetColumns
    );
  if (!compatible) {
    return result(
      table,
      sourceRows,
      targetRows,
      "mapping-required",
      false,
      null,
      null,
      null,
      "Source and destination columns differ. Map every source field and satisfy required target fields before import.",
      dependencies,
      sourceColumns,
      targetColumns
    );
  }
  if (sourceRows > analysisRowLimit || targetRows > analysisRowLimit) {
    return result(
      table,
      sourceRows,
      targetRows,
      "review",
      true,
      null,
      null,
      null,
      `Conflict analysis is limited to ${analysisRowLimit} rows per table.`,
      dependencies,
      sourceColumns,
      targetColumns
    );
  }

  const collision = await inspectUniqueKeys(
    sourceConnection,
    targetConnection,
    source.database,
    target.database,
    table,
    sourceColumns.map((column) => column.name),
    sourceRows,
    targetRows
  );
  if (collision.reason) {
    return result(
      table,
      sourceRows,
      targetRows,
      "review",
      true,
      null,
      null,
      null,
      collision.reason,
      dependencies,
      sourceColumns,
      targetColumns
    );
  }
  if (collision.conflictingRows) {
    return result(
      table,
      sourceRows,
      targetRows,
      "blocked",
      true,
      collision.newRows,
      collision.exactRows,
      collision.conflictingRows,
      "Unique keys match existing rows with different data.",
      dependencies,
      sourceColumns,
      targetColumns
    );
  }
  if (targetRows && collision.newRows) {
    return result(
      table,
      sourceRows,
      targetRows,
      "blocked",
      true,
      collision.newRows,
      collision.exactRows,
      0,
      "Destination contains rows; the current transfer requires an empty table.",
      dependencies,
      sourceColumns,
      targetColumns
    );
  }
  const status = collision.newRows === 0 ? "already-present" : "ready";
  return result(
    table,
    sourceRows,
    targetRows,
    status,
    true,
    collision.newRows,
    collision.exactRows,
    0,
    status === "ready" ? null : "All source rows already match the destination.",
    dependencies,
    sourceColumns,
    targetColumns
  );
}

async function inspectUniqueKeys(
  sourceConnection: Connection,
  targetConnection: Connection,
  sourceDatabase: string,
  targetDatabase: string,
  table: string,
  sourceColumnNames: string[],
  sourceRows: number,
  targetRows: number
) {
  const indexes = await uniqueIndexes(sourceConnection, sourceDatabase, table);
  if (!indexes.length)
    return {
      newRows: 0,
      exactRows: 0,
      conflictingRows: sourceRows,
      reason: "Table has no primary or unique key."
    };
  const keyColumns = [...new Set(indexes.flat())];
  const selectColumns = [...new Set([...sourceColumnNames, ...keyColumns])];
  const select = selectColumns.map(quote).join(", ");
  const [sourceData, targetData] = await Promise.all([
    sourceConnection.query<RowDataPacket[]>(`SELECT ${select} FROM ${quote(table)}`),
    targetRows
      ? targetConnection.query<RowDataPacket[]>(`SELECT ${select} FROM ${quote(table)}`)
      : Promise.resolve([[] as RowDataPacket[], []])
  ]);
  const sourceRecords = sourceData[0];
  const targetRecords = targetData[0];
  if (sourceRecords.length !== sourceRows || targetRecords.length !== targetRows) {
    return {
      newRows: 0,
      exactRows: 0,
      conflictingRows: 0,
      reason: "Row count changed during analysis. Reanalyze."
    };
  }
  const uniqueMaps = indexes.map((key) => ({
    key,
    values: new Set(
      targetRecords
        .map((row) => signature(row, key))
        .filter((value): value is string => value !== null)
    )
  }));
  const targetRowsByValue = new Set(
    targetRecords.map((row) => signature(row, sourceColumnNames)).filter(Boolean)
  );
  let newRows = 0;
  let exactRows = 0;
  let conflictingRows = 0;
  for (const row of sourceRecords) {
    const hasKeyCollision = uniqueMaps.some(({ key, values }) => {
      const value = signature(row, key);
      return value !== null && values.has(value);
    });
    if (!hasKeyCollision) newRows += 1;
    else if (targetRowsByValue.has(signature(row, sourceColumnNames))) exactRows += 1;
    else conflictingRows += 1;
  }
  return { newRows, exactRows, conflictingRows, reason: null };
}

async function uniqueIndexes(connection: Connection, database: string, table: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT INDEX_NAME AS name, SEQ_IN_INDEX AS position, COLUMN_NAME AS columnName
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND NON_UNIQUE = 0 AND COLUMN_NAME IS NOT NULL
     ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
    [database, table]
  );
  const groups = new Map<string, string[]>();
  for (const row of rows) {
    const name = String(row.name);
    const columns = groups.get(name) ?? [];
    columns.push(String(row.columnName));
    groups.set(name, columns);
  }
  return [...groups.values()];
}

async function dependenciesFor(connection: Connection, database: string, table: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT DISTINCT REFERENCED_TABLE_NAME AS name
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
     ORDER BY REFERENCED_TABLE_NAME`,
    [database, table]
  );
  return rows.map((row) => String(row.name));
}

async function columns(connection: Connection, database: string, table: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type, IS_NULLABLE AS nullable,
       COLUMN_DEFAULT AS defaultValue, EXTRA AS extra, ORDINAL_POSITION AS position
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
    [database, table]
  );
  return rows.map((row) => ({
    name: String(row.name),
    type: String(row.type),
    nullable: String(row.nullable),
    defaultValue: row.defaultValue,
    extra: String(row.extra),
    position: Number(row.position)
  }));
}

function schemasCompatible(
  source: Awaited<ReturnType<typeof columns>>,
  target: Awaited<ReturnType<typeof columns>>
) {
  const targetByName = new Map(target.map((column) => [column.name, column]));
  if (
    source.some((column) => {
      const matching = targetByName.get(column.name);
      return (
        !matching ||
        matching.type !== column.type ||
        matching.nullable !== column.nullable ||
        column.extra.toLowerCase().includes("generated")
      );
    })
  )
    return false;
  const sourceNames = new Set(source.map((column) => column.name));
  return target.every((column) => {
    if (sourceNames.has(column.name)) return true;
    return (
      column.nullable === "YES" ||
      column.defaultValue !== null ||
      /auto_increment|generated/iu.test(column.extra)
    );
  });
}

async function listTables(connection: Connection, database: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT TABLE_NAME AS name FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`,
    [database]
  );
  return rows.map((row) => String(row.name));
}

async function count(connection: Connection, table: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM ${quote(table)}`
  );
  return Number(rows[0]?.count ?? 0);
}

async function engine(connection: Connection, database: string, table: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT ENGINE AS engine FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND TABLE_TYPE = 'BASE TABLE'`,
    [database, table]
  );
  return rows[0]?.engine == null ? null : String(rows[0].engine);
}

function signature(row: RowDataPacket, columns: string[]): string | null {
  const values = columns.map((column) => normalize(row[column]));
  if (values.some((value) => value === null)) return null;
  return JSON.stringify(values);
}

function normalize(value: unknown): unknown {
  if (Buffer.isBuffer(value)) return { buffer: value.toString("hex") };
  if (value instanceof Date) return { date: value.toISOString() };
  if (typeof value === "bigint") return value.toString();
  return value;
}

function quote(value: string) {
  if (!identifierPattern.test(value)) throw new Error("Invalid database identifier.");
  return `\`${value}\``;
}

function excluded(table: string): MigrationTableAnalysis {
  return result(
    table,
    0,
    0,
    "excluded",
    true,
    0,
    0,
    0,
    "Migration ledger is local schema metadata.",
    []
  );
}

function blocked(table: string, reason: string, sourceRows = 0): MigrationTableAnalysis {
  return result(table, sourceRows, 0, "blocked", false, null, null, null, reason, []);
}

function result(
  table: string,
  sourceRows: number,
  targetRows: number,
  status: MigrationTableAnalysis["status"],
  schemaCompatible: boolean,
  newRows: number | null,
  exactRows: number | null,
  conflictingRows: number | null,
  reason: string | null,
  dependencies: string[],
  sourceColumns: Awaited<ReturnType<typeof columns>> = [],
  targetColumns: Awaited<ReturnType<typeof columns>> = []
): MigrationTableAnalysis {
  return {
    table,
    sourceRows,
    targetRows,
    status,
    schemaCompatible,
    newRows,
    exactRows,
    conflictingRows,
    reason,
    dependencies,
    sourceColumns: analysisColumns(sourceColumns),
    targetColumns: analysisColumns(targetColumns)
  };
}

type DatabaseColumn = Awaited<ReturnType<typeof columns>>[number];

function analysisColumns(input: DatabaseColumn[]): AnalysisColumn[] {
  return input.map((column) => ({
    name: column.name,
    type: column.type,
    nullable: column.nullable === "YES",
    required:
      column.nullable !== "YES" &&
      column.defaultValue === null &&
      !/auto_increment|generated/iu.test(column.extra),
    generated: /generated/iu.test(column.extra)
  }));
}

function block(row: MigrationTableAnalysis, reason: string) {
  row.status = "blocked";
  row.reason = row.reason ? `${row.reason} ${reason}` : reason;
}
