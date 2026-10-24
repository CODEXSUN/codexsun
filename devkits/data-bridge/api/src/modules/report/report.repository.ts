import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { BulkImportReport } from "./report.types.js";

export class CommonBulkRepository {
  constructor(private readonly database: Kysely<unknown>) {}

  listSummaries() {
    return sql<{
      uuid: string;
      source_database: string;
      target_database: string;
      scope: string | null;
      status: string;
      updated_at: Date | string;
      row_counts: string | number[] | null;
      table_count: number;
    }>`SELECT uuid,status,updated_at,JSON_VALUE(report_json,'$.sourceDatabase') AS source_database,JSON_VALUE(report_json,'$.targetDatabase') AS target_database,JSON_VALUE(report_json,'$.scope') AS scope,JSON_EXTRACT(report_json,'$.tables[*].sourceRows') AS row_counts,JSON_LENGTH(JSON_EXTRACT(report_json,'$.tables')) AS table_count FROM data_bridge_common_import_runs ORDER BY id DESC LIMIT 100`.execute(
      this.database
    );
  }

  async create(report: BulkImportReport) {
    await sql`INSERT INTO data_bridge_common_import_runs (uuid, source_id, target_tenant_id, status, report_json, created_by)
      VALUES (${report.id}, ${report.sourceId}, ${report.targetTenantId}, ${report.status}, ${JSON.stringify(report)}, ${report.actor})`.execute(
      this.database
    );
  }

  async update(report: BulkImportReport) {
    report.updatedAt = new Date().toISOString();
    await sql`UPDATE data_bridge_common_import_runs SET status=${report.status}, report_json=${JSON.stringify(report)}, updated_at=CURRENT_TIMESTAMP WHERE uuid=${report.id}`.execute(
      this.database
    );
  }

  async get(id: string) {
    const result = await sql<{
      report_json: string | BulkImportReport;
    }>`SELECT report_json FROM data_bridge_common_import_runs WHERE uuid=${id}`.execute(
      this.database
    );
    const value = result.rows[0]?.report_json;
    if (!value) throw AppError.validation("The combined import report was not found.");
    return typeof value === "string" ? (JSON.parse(value) as BulkImportReport) : value;
  }

  async latest(sourceId: number, targetTenantId: number, scope: "common" | "masters" = "common") {
    const result = await sql<{
      uuid: string;
    }>`SELECT uuid FROM data_bridge_common_import_runs WHERE source_id=${sourceId} AND target_tenant_id=${targetTenantId} AND COALESCE(JSON_VALUE(report_json, '$.scope'), 'common')=${scope} ORDER BY id DESC LIMIT 1`.execute(
      this.database
    );
    return result.rows[0] ? this.get(result.rows[0].uuid) : null;
  }
}
