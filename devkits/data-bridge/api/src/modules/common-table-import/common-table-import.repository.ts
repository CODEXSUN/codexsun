import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { Kysely } from "kysely";
import type {
  CommonTableImportSummary,
  CommonTableName,
  ImportReport
} from "./common-table-import.types.js";

export class CommonTableImportRepository {
  constructor(private readonly database: Kysely<unknown>) {}

  async withImportLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
    return this.database.connection().execute(async (connection) => {
      const name = `codexsun.bridge:${id}`;
      const locked = await sql<{
        acquired: number;
      }>`SELECT GET_LOCK(${name}, 0) AS acquired`.execute(connection);
      if (Number(locked.rows[0]?.acquired) !== 1)
        throw AppError.validation("This review is being audited or imported. Wait and refresh.");
      try {
        return await operation();
      } finally {
        await sql`SELECT RELEASE_LOCK(${name})`.execute(connection);
      }
    });
  }

  async list(): Promise<CommonTableImportSummary[]> {
    const result = await sql<{
      uuid: string;
      source_id: number;
      target_tenant_id: number;
      table_name: CommonTableName;
      source_database: string;
      target_database: string;
      row_count: number | string;
      imported_rows: number | string;
      skipped_rows: number | string;
      status: string;
      updated_at: Date | string;
    }>`SELECT uuid, source_id, target_tenant_id, table_name, source_database, target_database,
      row_count, imported_rows, skipped_rows, status, updated_at
      FROM data_bridge_common_table_imports ORDER BY updated_at DESC LIMIT 500`.execute(
      this.database
    );
    return result.rows.map((row) => ({
      id: row.uuid,
      sourceId: Number(row.source_id),
      targetTenantId: Number(row.target_tenant_id),
      table: row.table_name,
      sourceDatabase: row.source_database,
      targetDatabase: row.target_database,
      rowCount: Number(row.row_count),
      importedRows: Number(row.imported_rows),
      skippedRows: Number(row.skipped_rows),
      status: row.status === "imported" || row.status === "failed" ? row.status : "reviewed",
      updatedAt: new Date(row.updated_at).toISOString()
    }));
  }

  async get(id: string) {
    const result = await sql<{
      id: number;
      uuid: string;
      source_id: number;
      target_tenant_id: number;
      table_name: CommonTableName;
      source_database: string;
      target_database: string;
      column_names: string[] | string;
      schema_hash: string;
      row_count: number | string;
      imported_rows: number | string;
      skipped_rows: number | string;
      status: string;
      error_message: string | null;
      report_json: ImportReport | string | null;
    }>`SELECT id, uuid, source_id, target_tenant_id, table_name, source_database, target_database,
      column_names, schema_hash, row_count, imported_rows, skipped_rows, status, error_message, report_json
      FROM data_bridge_common_table_imports WHERE uuid = ${id}`.execute(this.database);
    const row = result.rows[0];
    if (!row) throw new Error("Common table import was not found.");
    const samples = await sql<{
      row_no: number | string;
      row_json: Record<string, unknown> | string;
    }>`SELECT row_no, row_json FROM data_bridge_common_table_import_rows
        WHERE import_id = ${row.id} ORDER BY row_no LIMIT 100`.execute(this.database);
    return {
      ...this.toSummary(row),
      columns:
        typeof row.column_names === "string" ? JSON.parse(row.column_names) : row.column_names,
      schemaHash: row.schema_hash,
      error: row.error_message,
      report:
        typeof row.report_json === "string"
          ? (JSON.parse(row.report_json) as ImportReport)
          : row.report_json,
      samples: samples.rows.map((sample) => ({
        rowNumber: Number(sample.row_no),
        data: redactSnapshot(
          typeof sample.row_json === "string"
            ? (JSON.parse(sample.row_json) as Record<string, unknown>)
            : sample.row_json
        )
      }))
    };
  }

  async save(input: {
    uuid: string;
    sourceId: number;
    targetTenantId: number;
    table: CommonTableName;
    sourceDatabase: string;
    targetDatabase: string;
    columns: string[];
    schemaHash: string;
    rows: Array<{ rowNumber: number; data: Record<string, unknown> }>;
    actor: string;
  }) {
    return this.database.transaction().execute(async (transaction) => {
      const current = await sql<{ id: number; status: string }>`SELECT id, status
        FROM data_bridge_common_table_imports WHERE source_id = ${input.sourceId}
          AND target_tenant_id = ${input.targetTenantId} AND table_name = ${input.table}
        FOR UPDATE`.execute(transaction);
      const old = current.rows[0];
      let importId = old?.id;
      if (old) {
        await sql`DELETE FROM data_bridge_common_table_import_rows WHERE import_id = ${old.id}`.execute(
          transaction
        );
        await sql`UPDATE data_bridge_common_table_imports SET uuid = ${input.uuid},
          source_database = ${input.sourceDatabase}, target_database = ${input.targetDatabase},
          column_names = ${JSON.stringify(input.columns)}, schema_hash = ${input.schemaHash},
          row_count = ${input.rows.length}, imported_rows = 0, skipped_rows = 0,
          status = 'reviewed', error_message = NULL, report_json = NULL, updated_by = ${input.actor},
          updated_at = CURRENT_TIMESTAMP WHERE id = ${old.id}`.execute(transaction);
      } else {
        await sql`INSERT INTO data_bridge_common_table_imports
          (uuid, source_id, target_tenant_id, table_name, source_database, target_database,
           column_names, schema_hash, row_count, created_by, updated_by)
          VALUES (${input.uuid}, ${input.sourceId}, ${input.targetTenantId}, ${input.table},
            ${input.sourceDatabase}, ${input.targetDatabase}, ${JSON.stringify(input.columns)},
            ${input.schemaHash}, ${input.rows.length}, ${input.actor}, ${input.actor})`.execute(
          transaction
        );
        const inserted = await sql<{ id: number }>`SELECT id FROM data_bridge_common_table_imports
          WHERE source_id = ${input.sourceId} AND target_tenant_id = ${input.targetTenantId}
            AND table_name = ${input.table}`.execute(transaction);
        importId = inserted.rows[0]?.id;
      }
      if (!importId) throw new Error("The saved import batch could not be found.");
      for (const row of input.rows) {
        await sql`INSERT INTO data_bridge_common_table_import_rows (import_id, row_no, row_json, created_by)
          VALUES (${importId}, ${row.rowNumber}, ${JSON.stringify(row.data)}, ${input.actor})`.execute(
          transaction
        );
      }
      return { id: input.uuid, status: "reviewed" as const, rows: input.rows.length };
    });
  }

  async complete(
    id: string,
    actor: string,
    imported: number,
    skipped: number,
    report: ImportReport
  ) {
    const result = await sql`UPDATE data_bridge_common_table_imports SET status = 'imported',
      imported_rows = ${imported}, skipped_rows = ${skipped}, error_message = NULL, report_json = ${JSON.stringify(report)},
      updated_by = ${actor}, updated_at = CURRENT_TIMESTAMP
      WHERE uuid = ${id} AND status = 'reviewed'`.execute(this.database);
    if (Number(result.numAffectedRows) !== 1) {
      throw new Error("Only a saved and reviewed table import can be completed.");
    }
  }

  async saveReport(id: string, report: ImportReport) {
    await sql`UPDATE data_bridge_common_table_imports SET report_json = ${JSON.stringify(report)},
      updated_by = ${report.actor}, updated_at = CURRENT_TIMESTAMP WHERE uuid = ${id}`.execute(
      this.database
    );
  }

  async fail(id: string, actor: string, error: string) {
    await sql`UPDATE data_bridge_common_table_imports SET status = 'failed',
      error_message = ${error.slice(0, 1000)}, updated_by = ${actor}, updated_at = CURRENT_TIMESTAMP
      WHERE uuid = ${id} AND status = 'reviewed'`.execute(this.database);
  }

  async rows(id: string) {
    const result = await sql<{
      row_no: number | string;
      row_json: Record<string, unknown> | string;
    }>`SELECT row_no, row_json FROM data_bridge_common_table_import_rows
      WHERE import_id = (SELECT id FROM data_bridge_common_table_imports WHERE uuid = ${id})
      ORDER BY row_no`.execute(this.database);
    return result.rows.map((row) => ({
      rowNumber: Number(row.row_no),
      data:
        typeof row.row_json === "string"
          ? (JSON.parse(row.row_json) as Record<string, unknown>)
          : row.row_json
    }));
  }

  async pageRows(id: string, page: number, pageSize: number) {
    const importRow = await sql<{ id: number }>`SELECT id FROM data_bridge_common_table_imports
      WHERE uuid = ${id}`.execute(this.database);
    const importId = importRow.rows[0]?.id;
    if (!importId) throw new Error("Common table import was not found.");
    const result = await sql<{
      row_no: number | string;
      row_json: Record<string, unknown> | string;
    }>`SELECT row_no, row_json FROM data_bridge_common_table_import_rows
      WHERE import_id = ${importId} ORDER BY row_no
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`.execute(this.database);
    return result.rows.map((row) => ({
      rowNumber: Number(row.row_no),
      data: redactSnapshot(
        typeof row.row_json === "string"
          ? (JSON.parse(row.row_json) as Record<string, unknown>)
          : row.row_json
      )
    }));
  }

  private toSummary(row: {
    uuid: string;
    source_id: number;
    target_tenant_id: number;
    table_name: CommonTableName;
    source_database: string;
    target_database: string;
    row_count: number | string;
    imported_rows: number | string;
    skipped_rows: number | string;
    status: string;
    updated_at?: Date | string;
  }): CommonTableImportSummary {
    return {
      id: row.uuid,
      sourceId: Number(row.source_id),
      targetTenantId: Number(row.target_tenant_id),
      table: row.table_name,
      sourceDatabase: row.source_database,
      targetDatabase: row.target_database,
      rowCount: Number(row.row_count),
      importedRows: Number(row.imported_rows),
      skippedRows: Number(row.skipped_rows),
      status: row.status === "imported" || row.status === "failed" ? row.status : "reviewed",
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ""
    };
  }
}

function redactSnapshot(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      /password|secret|token|credential|api.?key|private.?key|cookie|authorization/iu.test(key)
        ? "[redacted]"
        : nested
    ])
  );
}
