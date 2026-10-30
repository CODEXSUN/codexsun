import { BusinessImportRepository } from "../business-import/index.js";
import { CommonBulkRepository } from "./report.repository.js";
import { TransferService } from "../transfer-session/index.js";
import { CommonTableImportService, type CommonTableImportHost } from "../import-review/index.js";
import { commonTableNames } from "../common-tables/index.js";
import { coreMasterTableNames } from "../master-tables/index.js";

export class ReportService {
  constructor(private readonly host: CommonTableImportHost) {}
  async list() {
    const [sessions, reviews, runs, business] = await Promise.all([
      new TransferService(this.host).list(),
      new CommonTableImportService(this.host).listImports(),
      new CommonBulkRepository(this.host.database).listSummaries(),
      new BusinessImportRepository(this.host.database).summaries()
    ]);
    const reports = [
      ...business.map((run) => ({
        id: run.uuid,
        type: "business" as const,
        group: "business",
        sourceDatabase: run.source_database,
        targetDatabase: run.target_database,
        table: `${Number(run.table_count)} business tables`,
        rows: (typeof run.row_counts === "string"
          ? (JSON.parse(run.row_counts) as number[])
          : (run.row_counts ?? [])
        ).reduce((n, c) => n + Number(c), 0),
        status: run.status,
        updatedAt:
          run.updated_at instanceof Date ? run.updated_at.toISOString() : String(run.updated_at),
        stage: 0
      })),
      ...sessions.map((session) => ({
        id: session.id,
        type: "transfer" as const,
        group: session.context?.group ?? this.group(session.targetTable),
        sourceDatabase: session.sourceDatabase,
        targetDatabase: session.targetDatabase,
        table: session.targetTable || "Not selected",
        rows: session.selectedRows ?? 0,
        status: session.status === "completed" && session.warningRows ? "warning" : session.status,
        updatedAt: session.updatedAt,
        stage: session.stage
      })),
      ...reviews.map((review) => ({
        id: review.id,
        type: "review" as const,
        group: this.group(review.table),
        sourceDatabase: review.sourceDatabase,
        targetDatabase: review.targetDatabase,
        table: review.table,
        rows: review.rowCount,
        status: review.status,
        updatedAt: review.updatedAt,
        stage: 0
      })),
      ...runs.rows.map((run) => {
        const counts =
          typeof run.row_counts === "string"
            ? (JSON.parse(run.row_counts) as number[])
            : (run.row_counts ?? []);
        return {
          id: run.uuid,
          type: "bulk" as const,
          group: run.scope ?? "common",
          sourceDatabase: run.source_database,
          targetDatabase: run.target_database,
          table: `${Number(run.table_count)} tables`,
          rows: counts.reduce((sum, count) => sum + Number(count), 0),
          status: run.status,
          updatedAt:
            run.updated_at instanceof Date ? run.updated_at.toISOString() : String(run.updated_at),
          stage: 0
        };
      })
    ];
    return reports.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
  private group(table: string) {
    return commonTableNames.includes(table as never)
      ? "common"
      : coreMasterTableNames.includes(table as never)
        ? "masters"
        : table.startsWith("billing_")
          ? "billing"
          : "legacy";
  }
}
