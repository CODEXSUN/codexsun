import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import type { DataMigrationHost } from "./migration.types.js";
import { decryptPassword, encryptPassword } from "./migration.secrets.js";
import type { MigrationSourceInput, MigrationTenant } from "./migration.types.js";
import type { MigrationColumnMapping } from "./migration.types.js";
import type {
  MigrationAuditQueueItem,
  MigrationAuditQueueSample,
  MigrationAuditQueueSummary,
  MigrationAuditTableDump,
  MigrationQueryPlan
} from "./migration.types.js";

export class MigrationRepository {
  constructor(private readonly database: DataMigrationHost["database"]) {}

  async listJobs() {
    const result = await sql<{
      uuid: string;
      session_name: string;
      source_id: number;
      source_database: string;
      source_tenant_id: number | null;
      target_tenant_id: number;
      target_database: string;
      status: string;
      created_by: string;
      created_at: Date;
      table_count: number | string;
    }>`SELECT j.uuid, j.session_name, j.source_id, j.source_database, j.source_tenant_id,
      j.target_tenant_id, j.target_database, j.status,
      j.created_by, j.created_at, COUNT(t.id) AS table_count
      FROM data_migration_jobs j LEFT JOIN data_migration_job_tables t ON t.job_id = j.id
      GROUP BY j.id ORDER BY j.id DESC LIMIT 100`.execute(this.database);
    return result.rows.map((row) => ({
      id: row.uuid,
      sessionName: row.session_name,
      sourceId: Number(row.source_id),
      sourceDatabase: row.source_database,
      sourceTenantId: row.source_tenant_id === null ? null : Number(row.source_tenant_id),
      targetTenantId: Number(row.target_tenant_id),
      targetDatabase: row.target_database,
      status: row.status,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at).toISOString(),
      tableCount: Number(row.table_count)
    }));
  }

  async createJob(
    input: {
      sessionName: string;
      sourceId: number;
      sourceDatabase: string;
      sourceTenantId: number | null;
      targetTenantId: number;
      targetDatabase: string;
    },
    actor: string
  ) {
    const uuid = randomUUID();
    await sql`INSERT INTO data_migration_jobs
      (uuid, session_name, source_id, source_database, source_tenant_id, target_tenant_id,
       target_database, created_by, updated_by)
      VALUES (${uuid}, ${input.sessionName}, ${input.sourceId}, ${input.sourceDatabase},
       ${input.sourceTenantId}, ${input.targetTenantId}, ${input.targetDatabase}, ${actor}, ${actor})`.execute(
      this.database
    );
    return { id: uuid };
  }

  async renameJob(uuid: string, sessionName: string, actor: string) {
    const result = await sql`UPDATE data_migration_jobs
      SET session_name = ${sessionName}, updated_by = ${actor}
      WHERE uuid = ${uuid}`.execute(this.database);
    if (Number(result.numAffectedRows) === 0) throw new Error("Migration session was not found.");
    return { id: uuid, sessionName };
  }

  async deleteJob(uuid: string) {
    const job = await this.resolveJob(uuid);
    if (job.status !== "draft") {
      throw new Error("Only an unrun draft migration can be deleted. Run history is retained.");
    }
    await sql`DELETE FROM data_migration_jobs WHERE id = ${job.id}`.execute(this.database);
    return { deleted: true as const };
  }

  async resolveJob(uuid: string) {
    const result = await sql<{
      id: number;
      uuid: string;
      session_name: string;
      source_id: number;
      source_database: string;
      source_tenant_id: number | null;
      target_tenant_id: number;
      target_database: string;
      status: string;
    }>`SELECT id, uuid, session_name, source_id, source_database, source_tenant_id,
      target_tenant_id, target_database, status
      FROM data_migration_jobs WHERE uuid = ${uuid}`.execute(this.database);
    const row = result.rows[0];
    if (!row) throw new Error("Migration session was not found.");
    return {
      id: Number(row.id),
      uuid: row.uuid,
      sessionName: row.session_name,
      sourceId: Number(row.source_id),
      sourceDatabase: row.source_database,
      sourceTenantId: row.source_tenant_id === null ? null : Number(row.source_tenant_id),
      targetTenantId: Number(row.target_tenant_id),
      targetDatabase: row.target_database,
      status: row.status
    };
  }

  async getJobTables(uuid: string) {
    const job = await this.resolveJob(uuid);
    const result = await sql<{
      id: number;
      table_name: string;
      source_table_name: string;
      target_table_name: string;
      source_rows: number | string;
      target_rows: number | string;
      mapping_status: string;
      migration_status: string;
      column_mappings: MigrationColumnMapping[] | string | null;
    }>`SELECT id, table_name, source_table_name, target_table_name, source_rows, target_rows,
      mapping_status, migration_status, column_mappings FROM data_migration_job_tables
      WHERE job_id = ${job.id} ORDER BY table_name`.execute(this.database);
    return Promise.all(
      result.rows.map(async (row) => {
        const fields = await sql<{
          id: number;
          source_field: string;
          destination_field: string;
          status: string;
          mapped_by: string;
        }>`SELECT id, source_field, destination_field, status, mapped_by FROM data_migration_job_fields
        WHERE job_table_id = ${row.id} AND status = 'mapped' ORDER BY id`.execute(this.database);
        const legacy =
          typeof row.column_mappings === "string"
            ? (JSON.parse(row.column_mappings) as MigrationColumnMapping[])
            : (row.column_mappings ?? []);
        return {
          id: Number(row.id),
          table: row.source_table_name || row.table_name,
          sourceTable: row.source_table_name || row.table_name,
          targetTable: row.target_table_name || row.table_name,
          sourceRows: Number(row.source_rows),
          targetRows: Number(row.target_rows),
          mappingStatus: row.mapping_status,
          migrationStatus: row.migration_status,
          columnMappings: fields.rows.length
            ? fields.rows.map((field) => ({
                id: Number(field.id),
                sourceColumn: field.source_field,
                targetColumn: field.destination_field,
                status: field.status,
                by: field.mapped_by
              }))
            : legacy
        };
      })
    );
  }

  async saveJobTable(
    uuid: string,
    input: {
      sourceTable: string;
      targetTable: string;
      sourceRows: number;
      targetRows: number;
      mappings: MigrationColumnMapping[];
    },
    actor: string
  ) {
    const job = await this.resolveJob(uuid);
    await this.database.transaction().execute(async (transaction) => {
      const lockedJob = await sql<{ status: string }>`SELECT status FROM data_migration_jobs
        WHERE id = ${job.id} FOR UPDATE`.execute(transaction);
      if (lockedJob.rows[0]?.status === "running") {
        throw new Error("This migration is running. Table mappings are locked until it finishes.");
      }
      await sql`INSERT INTO data_migration_job_tables
        (job_id, table_name, source_table_name, target_table_name, source_rows, target_rows,
         mapping_status, migration_status, column_mappings, updated_by)
        VALUES (${job.id}, ${input.sourceTable}, ${input.sourceTable}, ${input.targetTable},
         ${input.sourceRows}, ${input.targetRows}, 'mapped', 'pending', NULL, ${actor})
        ON DUPLICATE KEY UPDATE target_table_name = VALUES(target_table_name),
          source_rows = VALUES(source_rows), target_rows = VALUES(target_rows),
          mapping_status = 'mapped', migration_status = 'pending',
          column_mappings = NULL, updated_by = VALUES(updated_by),
          updated_at = CURRENT_TIMESTAMP`.execute(transaction);
      const child = await sql<{ id: number }>`SELECT id FROM data_migration_job_tables
        WHERE job_id = ${job.id} AND source_table_name = ${input.sourceTable}`.execute(transaction);
      const childId = Number(child.rows[0]?.id);
      await sql`DELETE FROM data_migration_job_fields WHERE job_table_id = ${childId}`.execute(
        transaction
      );
      for (const field of input.mappings) {
        await sql`INSERT INTO data_migration_job_fields
          (job_table_id, source_field, destination_field, status, mapped_by)
          VALUES (${childId}, ${field.sourceColumn}, ${field.targetColumn}, 'mapped', ${actor})`.execute(
          transaction
        );
      }
      await sql`UPDATE data_migration_jobs SET updated_by = ${actor}, status = 'draft'
        WHERE id = ${job.id}`.execute(transaction);
      await sql`UPDATE data_migration_job_query_plans
        SET status = 'stale', finalized_by = NULL, finalized_at = NULL
        WHERE job_id = ${job.id}`.execute(transaction);
      await sql`UPDATE data_migration_audit_queue SET status = 'stale', updated_at = CURRENT_TIMESTAMP
        WHERE job_id = ${job.id} AND source_table = ${input.sourceTable}
          AND status IN ('queued', 'reviewed')`.execute(transaction);
    });
  }

  async deleteJobTable(uuid: string, sourceTable: string) {
    const job = await this.resolveJob(uuid);
    if (job.status !== "draft") {
      throw new Error("Table mappings are locked after a migration has started.");
    }
    await this.database.transaction().execute(async (transaction) => {
      const table = await sql<{ id: number }>`SELECT id FROM data_migration_job_tables
        WHERE job_id = ${job.id} AND source_table_name = ${sourceTable} FOR UPDATE`.execute(
        transaction
      );
      const tableId = table.rows[0]?.id;
      if (!tableId) throw new Error("Saved table mapping was not found.");
      await sql`DELETE FROM data_migration_audit_queue
        WHERE job_id = ${job.id} AND source_table = ${sourceTable}`.execute(transaction);
      await sql`DELETE FROM data_migration_query_batch_rows
        WHERE batch_id IN (SELECT id FROM data_migration_query_batches WHERE job_id = ${job.id})
          AND source_table = ${sourceTable}`.execute(transaction);
      await sql`DELETE FROM data_migration_job_fields WHERE job_table_id = ${tableId}`.execute(
        transaction
      );
      await sql`DELETE FROM data_migration_job_tables WHERE id = ${tableId}`.execute(transaction);
      await sql`UPDATE data_migration_job_query_plans SET status = 'stale', finalized_by = NULL,
        finalized_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE job_id = ${job.id}`.execute(
        transaction
      );
    });
    return { deleted: true as const };
  }

  async saveJobQueryPlan(uuid: string, plan: MigrationQueryPlan, actor: string) {
    const job = await this.resolveJob(uuid);
    await this.database.transaction().execute(async (transaction) => {
      const lockedJob = await sql<{ status: string }>`SELECT status FROM data_migration_jobs
        WHERE id = ${job.id} FOR UPDATE`.execute(transaction);
      if (lockedJob.rows[0]?.status === "running") {
        throw new Error("A query plan cannot be changed while this migration is running.");
      }
      await sql`INSERT INTO data_migration_job_query_plans
        (uuid, job_id, plan_hash, plan_json, status, created_by, created_at, generated_by, generated_at,
         finalized_by, finalized_at)
        VALUES (${plan.id}, ${job.id}, ${plan.hash}, ${JSON.stringify(plan)}, 'generated',
          ${actor}, CURRENT_TIMESTAMP, ${actor}, CURRENT_TIMESTAMP, NULL, NULL)
        ON DUPLICATE KEY UPDATE uuid = VALUES(uuid), plan_hash = VALUES(plan_hash),
          plan_json = VALUES(plan_json), status = 'generated', generated_by = VALUES(generated_by),
          generated_at = CURRENT_TIMESTAMP, finalized_by = NULL, finalized_at = NULL,
          updated_at = CURRENT_TIMESTAMP`.execute(transaction);
    });
    return plan;
  }

  async saveQueryBatch(
    input: {
      jobId: number;
      sourceId: number;
      sourceLabel: string;
      sourceHost: string;
      sourceDatabase: string;
      sourceUser: string;
      rows: Array<{
        sourceTable: string;
        targetTable: string;
        rowNumber: number;
        rowData: Record<string, unknown>;
      }>;
      fieldValues: Record<string, { mode: "default" | "custom" | "foreign"; value: unknown }>;
    },
    actor: string
  ) {
    const uuid = randomUUID();
    await this.database.transaction().execute(async (transaction) => {
      await sql`INSERT INTO data_migration_query_batches
        (uuid, job_id, source_id, source_label, source_host, source_database, source_user, status, created_by)
        VALUES (${uuid}, ${input.jobId}, ${input.sourceId}, ${input.sourceLabel}, ${input.sourceHost},
          ${input.sourceDatabase}, ${input.sourceUser}, 'draft', ${actor})
        ON DUPLICATE KEY UPDATE uuid = VALUES(uuid), source_id = VALUES(source_id),
          source_label = VALUES(source_label),
          source_host = VALUES(source_host), source_database = VALUES(source_database),
          source_user = VALUES(source_user), status = 'draft', created_by = VALUES(created_by),
          updated_at = CURRENT_TIMESTAMP`.execute(transaction);
      const batch = await sql<{ id: number }>`SELECT id FROM data_migration_query_batches
        WHERE job_id = ${input.jobId} FOR UPDATE`.execute(transaction);
      const batchId = Number(batch.rows[0]?.id);
      await sql`DELETE FROM data_migration_query_batch_rows WHERE batch_id = ${batchId}`.execute(
        transaction
      );
      for (const row of input.rows) {
        await sql`INSERT INTO data_migration_query_batch_rows
          (batch_id, source_table, target_table, row_no, row_json, field_values, status, created_by)
          VALUES (${batchId}, ${row.sourceTable}, ${row.targetTable}, ${row.rowNumber},
            ${JSON.stringify(row.rowData)}, ${JSON.stringify(input.fieldValues)}, 'selected', ${actor})`.execute(
          transaction
        );
      }
      await sql`UPDATE data_migration_audit_queue SET status = 'stale', updated_at = CURRENT_TIMESTAMP
        WHERE job_id = ${input.jobId} AND source_table = ${input.rows[0]!.sourceTable}
          AND status IN ('queued', 'reviewed')`.execute(transaction);
    });
    return { id: uuid, savedRows: input.rows.length, status: "draft" as const };
  }

  async getQueryBatch(jobUuid: string) {
    const result = await sql<{
      batch_uuid: string;
      source_id: number;
      source_label: string;
      source_host: string;
      source_database: string;
      source_user: string;
      batch_status: string;
      row_id: number | null;
      source_table: string | null;
      target_table: string | null;
      row_no: number | null;
      row_json: Record<string, unknown> | string | null;
      field_values:
        Record<string, { mode: "default" | "custom" | "foreign"; value: unknown }> | string | null;
      row_status: string | null;
    }>`SELECT b.uuid AS batch_uuid, b.source_id, b.source_host, b.source_database,
      b.source_user, b.source_label, b.status AS batch_status, r.id AS row_id, r.source_table, r.target_table,
      r.row_no, r.row_json, r.field_values, r.status AS row_status
      FROM data_migration_query_batches b
      JOIN data_migration_jobs j ON j.id = b.job_id
      LEFT JOIN data_migration_query_batch_rows r ON r.batch_id = b.id
      WHERE j.uuid = ${jobUuid} ORDER BY r.id`.execute(this.database);
    const first = result.rows[0];
    if (!first) return null;
    const parseJson = <T>(value: T | string | null): T | null =>
      typeof value === "string" ? (JSON.parse(value) as T) : value;
    return {
      id: first.batch_uuid,
      sourceId: Number(first.source_id),
      sourceLabel: first.source_label,
      sourceHost: first.source_host,
      sourceDatabase: first.source_database,
      sourceUser: first.source_user,
      passwordStored: true,
      status: first.batch_status,
      rows: result.rows.flatMap((row) =>
        row.row_id === null
          ? []
          : [
              {
                id: Number(row.row_id),
                sourceTable: row.source_table ?? "",
                targetTable: row.target_table ?? "",
                rowNumber: Number(row.row_no),
                rowData: parseJson(row.row_json) ?? {},
                fieldValues: parseJson(row.field_values) ?? {},
                status: row.row_status ?? "selected"
              }
            ]
      )
    };
  }

  async deleteQueryBatch(jobUuid: string) {
    const job = await this.resolveJob(jobUuid);
    if (job.status !== "draft") {
      throw new Error("Saved samples cannot be deleted after a migration has started.");
    }
    const result = await this.database.transaction().execute(async (transaction) => {
      const count = await sql<{ total: number | string }>`SELECT COUNT(*) AS total
        FROM data_migration_query_batch_rows r
        JOIN data_migration_query_batches b ON b.id = r.batch_id WHERE b.job_id = ${job.id}`.execute(
        transaction
      );
      await sql`DELETE FROM data_migration_audit_queue WHERE job_id = ${job.id}`.execute(
        transaction
      );
      await sql`DELETE FROM data_migration_query_batches WHERE job_id = ${job.id}`.execute(
        transaction
      );
      return Number(count.rows[0]?.total ?? 0);
    });
    return { deletedRows: result };
  }

  async getJobQueryPlan(uuid: string): Promise<MigrationQueryPlan | null> {
    const job = await this.resolveJob(uuid);
    const result = await sql<{
      plan_json: MigrationQueryPlan | string;
      status: MigrationQueryPlan["status"];
      finalized_by: string | null;
      finalized_at: Date | null;
    }>`SELECT plan_json, status, finalized_by, finalized_at
      FROM data_migration_job_query_plans WHERE job_id = ${job.id}`.execute(this.database);
    const row = result.rows[0];
    if (!row) return null;
    const plan =
      typeof row.plan_json === "string"
        ? (JSON.parse(row.plan_json) as MigrationQueryPlan)
        : row.plan_json;
    return {
      ...plan,
      status: row.status,
      finalizedBy: row.finalized_by,
      finalizedAt: row.finalized_at ? new Date(row.finalized_at).toISOString() : null
    };
  }

  async saveAuditQueueItem(
    jobUuid: string,
    audit: {
      hash: string;
      sourceDatabase: string;
      targetDatabase: string;
      tables: MigrationAuditTableDump[];
    },
    actor: string
  ) {
    const job = await this.resolveJob(jobUuid);
    const sourceResult = await sql<{
      label: string;
    }>`SELECT label FROM data_migration_sources WHERE id = ${job.sourceId}`.execute(this.database);
    const sourceLabel = sourceResult.rows[0]?.label ?? "Source";
    const queryDump = [
      `-- CODEXSUN migration SQL review dump`,
      `-- Session: ${sqlCommentValue(job.sessionName)}`,
      `-- Source: ${sqlCommentValue(sourceLabel)}.${sqlCommentValue(audit.sourceDatabase)}`,
      `-- Target: ${sqlCommentValue(audit.targetDatabase)}`,
      `-- Audit snapshot SHA-256: ${audit.hash}`,
      `-- Selected sample rows are review context only, not stable record identifiers.`,
      `-- INSERT placeholders require server-side parameter binding.`,
      `-- No credentials or row values are included.`,
      ...audit.tables.flatMap((table) => [
        "",
        `-- ${table.sourceTable} -> ${table.targetTable}; ${table.selectedRowNumbers.length} selected sample rows`,
        `-- Sample positions: ${table.selectedRowNumbers.join(", ")}`,
        table.selectSql.endsWith(";") ? table.selectSql : `${table.selectSql};`,
        table.insertSqlTemplate.endsWith(";")
          ? table.insertSqlTemplate
          : `${table.insertSqlTemplate};`
      ])
    ].join("\n");
    const uuid = randomUUID();
    const table = audit.tables[0];
    if (!table || audit.tables.length !== 1) {
      throw new Error("Queue one mapped table at a time for migration audit.");
    }
    await this.database.transaction().execute(async (transaction) => {
      await sql`INSERT INTO data_migration_audit_queue
        (uuid, job_id, plan_hash, session_name, source_table, target_table, selected_rows,
         source_database, target_database, query_dump, status, queued_by)
        VALUES (${uuid}, ${job.id}, ${audit.hash}, ${job.sessionName}, ${table.sourceTable},
          ${table.targetTable}, ${table.selectedRowNumbers.length}, ${audit.sourceDatabase},
          ${audit.targetDatabase}, ${queryDump}, 'queued', ${actor})`.execute(transaction);
      const queueId = await sql<{ id: number }>`SELECT id FROM data_migration_audit_queue
        WHERE uuid = ${uuid}`.execute(transaction);
      const auditQueueId = queueId.rows[0]?.id;
      if (!auditQueueId) throw new Error("Could not resolve the saved audit queue item.");
      for (const sample of table.samples) {
        await sql`INSERT INTO data_migration_audit_queue_rows
          (audit_queue_id, row_no, row_json)
          VALUES (${auditQueueId}, ${sample.rowNumber},
            ${JSON.stringify(sample.rowData)})`.execute(transaction);
      }
    });
    return this.getAuditQueueItem(uuid);
  }

  async listAuditQueue(): Promise<MigrationAuditQueueSummary[]> {
    const result =
      await sql<AuditQueueRow>`SELECT q.uuid, j.uuid AS job_uuid, q.plan_hash, q.session_name,
      q.source_table, q.target_table, q.selected_rows,
      q.source_database, q.target_database, q.status, q.queued_by, q.queued_at,
      q.reviewed_by, q.reviewed_at, p.status AS plan_status, j.status AS migration_status
      FROM data_migration_audit_queue q
      JOIN data_migration_jobs j ON j.id = q.job_id
      LEFT JOIN data_migration_job_query_plans p ON p.job_id = j.id
      ORDER BY q.queued_at DESC LIMIT 200`.execute(this.database);
    return result.rows.map(mapAuditQueueSummary);
  }

  async getAuditQueueItem(uuid: string): Promise<MigrationAuditQueueItem> {
    const result =
      await sql<AuditQueueRow>`SELECT q.uuid, j.uuid AS job_uuid, q.plan_hash, q.session_name,
      q.source_table, q.target_table, q.selected_rows,
      q.source_database, q.target_database, q.query_dump, q.status, q.queued_by, q.queued_at,
      q.reviewed_by, q.reviewed_at, p.status AS plan_status, j.status AS migration_status
      FROM data_migration_audit_queue q
      JOIN data_migration_jobs j ON j.id = q.job_id
      LEFT JOIN data_migration_job_query_plans p ON p.job_id = j.id
      WHERE q.uuid = ${uuid}`.execute(this.database);
    const row = result.rows[0];
    if (!row) throw new Error("Migration audit queue item was not found.");
    const sampleResult = await sql<{
      row_no: number;
      row_json: Record<string, unknown> | string;
    }>`SELECT row_no, row_json FROM data_migration_audit_queue_rows
      WHERE audit_queue_id = (SELECT id FROM data_migration_audit_queue WHERE uuid = ${uuid})
      ORDER BY row_no`.execute(this.database);
    const samples: MigrationAuditQueueSample[] = sampleResult.rows.map((sample) => ({
      rowNumber: Number(sample.row_no),
      rowData:
        typeof sample.row_json === "string"
          ? (JSON.parse(sample.row_json) as Record<string, unknown>)
          : sample.row_json
    }));
    return { ...mapAuditQueueSummary(row), queryDump: row.query_dump, samples };
  }

  async markAuditQueueReviewed(uuid: string, actor: string) {
    const result = await sql`UPDATE data_migration_audit_queue SET status = 'reviewed',
      reviewed_by = ${actor}, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE uuid = ${uuid} AND status = 'queued'`.execute(this.database);
    if (Number(result.numAffectedRows) !== 1) {
      throw new Error("This queued SQL dump is no longer awaiting audit review.");
    }
    return this.getAuditQueueItem(uuid);
  }

  async deleteAuditQueueItem(uuid: string) {
    await this.database.transaction().execute(async (transaction) => {
      const item = await sql<{
        id: number;
        job_status: string;
      }>`SELECT queue.id, jobs.status AS job_status
        FROM data_migration_audit_queue queue
        INNER JOIN data_migration_jobs jobs ON jobs.id = queue.job_id
        WHERE queue.uuid = ${uuid} FOR UPDATE`.execute(transaction);
      const row = item.rows[0];
      if (!row) throw new Error("Migration audit item was not found.");
      if (row.job_status !== "draft") {
        throw new Error("Audit items for a started migration are retained with its run history.");
      }
      await sql`DELETE FROM data_migration_audit_queue WHERE id = ${row.id}`.execute(transaction);
    });
    return { deleted: true as const };
  }

  async finalizeJobQueryPlan(uuid: string, hash: string, actor: string) {
    const job = await this.resolveJob(uuid);
    const result = await sql`UPDATE data_migration_job_query_plans
      SET status = 'finalized', finalized_by = ${actor}, finalized_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE job_id = ${job.id} AND plan_hash = ${hash} AND status = 'generated'`.execute(
      this.database
    );
    if (Number(result.numAffectedRows) !== 1) {
      throw new Error(
        "The generated query plan changed. Generate and review it again before finalizing."
      );
    }
    return this.getJobQueryPlan(uuid);
  }

  async setJobQueryPlanStatus(uuid: string, status: MigrationQueryPlan["status"]) {
    const job = await this.resolveJob(uuid);
    await sql`UPDATE data_migration_job_query_plans SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE job_id = ${job.id}`.execute(this.database);
    if (status === "stale") {
      await sql`UPDATE data_migration_audit_queue SET status = 'stale', updated_at = CURRENT_TIMESTAMP
        WHERE job_id = ${job.id} AND status IN ('queued', 'reviewed')`.execute(this.database);
    }
  }

  async beginFinalizedJob(uuid: string, hash: string, actor: string) {
    const job = await this.resolveJob(uuid);
    await this.database.transaction().execute(async (transaction) => {
      const lockedJob = await sql<{ status: string }>`SELECT status FROM data_migration_jobs
        WHERE id = ${job.id} FOR UPDATE`.execute(transaction);
      if (!lockedJob.rows[0] || lockedJob.rows[0].status === "running") {
        throw new Error("This migration is already running or no longer available.");
      }
      const plan = await sql<{ plan_hash: string; status: string }>`SELECT plan_hash, status
        FROM data_migration_job_query_plans WHERE job_id = ${job.id} FOR UPDATE`.execute(
        transaction
      );
      if (plan.rows[0]?.status !== "finalized" || plan.rows[0].plan_hash !== hash) {
        throw new Error("The finalized query plan changed before execution. Review it again.");
      }
      await sql`UPDATE data_migration_jobs SET status = 'running', updated_by = ${actor}
        WHERE id = ${job.id}`.execute(transaction);
    });
  }

  async markJobStatus(
    uuid: string,
    status: "draft" | "running" | "completed" | "failed",
    actor: string
  ) {
    const job = await this.resolveJob(uuid);
    await sql`UPDATE data_migration_jobs SET status = ${status}, updated_by = ${actor}
      WHERE id = ${job.id}`.execute(this.database);
  }

  async markJobTableStatus(
    uuid: string,
    sourceTable: string,
    status: "pending" | "running" | "completed" | "failed",
    actor: string
  ) {
    const job = await this.resolveJob(uuid);
    await sql`UPDATE data_migration_job_tables SET migration_status = ${status}, updated_by = ${actor}
      WHERE job_id = ${job.id} AND source_table_name = ${sourceTable}`.execute(this.database);
  }

  async list() {
    const result = await sql<{
      uuid: string;
      source_id: number;
      target_tenant_id: number;
      table_name: string;
      source_rows: number;
      copied_rows: number;
      status: string;
      error_text: string | null;
      created_by: string;
      created_at: Date;
    }>`SELECT uuid, source_id, target_tenant_id, table_name, source_rows,
      copied_rows, status, error_text, created_by, created_at
      FROM data_migration_runs ORDER BY id DESC LIMIT 100`.execute(this.database);
    return result.rows.map((row) => ({
      id: row.uuid,
      sourceId: row.source_id,
      targetTenantId: row.target_tenant_id,
      table: row.table_name,
      sourceRows: Number(row.source_rows),
      copiedRows: Number(row.copied_rows),
      status: row.status,
      error: row.error_text,
      actor: row.created_by,
      createdAt: new Date(row.created_at).toISOString()
    }));
  }

  async start(sourceId: number, targetId: number, table: string, rows: number, actor: string) {
    const id = randomUUID();
    await sql`INSERT INTO data_migration_runs
      (uuid, source_id, target_tenant_id, table_name, source_rows, created_by)
      VALUES (${id}, ${sourceId}, ${targetId}, ${table}, ${rows}, ${actor})`.execute(this.database);
    return id;
  }

  async finish(id: string, status: "completed" | "failed", rows: number, error: string | null) {
    await sql`UPDATE data_migration_runs SET status = ${status}, copied_rows = ${rows},
      error_text = ${error} WHERE uuid = ${id}`.execute(this.database);
  }

  async listSources() {
    const result = await sql<{
      id: number;
      label: string;
      host: string;
      port: number;
      database_name: string;
      user_name: string;
      tls_mode: "required" | "disabled";
      status: string;
      verified_at: Date | null;
    }>`SELECT id, label, host, port, database_name, user_name, tls_mode, status, verified_at
      FROM data_migration_sources WHERE status = 'active' ORDER BY label`.execute(this.database);
    return result.rows.map((row) => ({
      id: row.id,
      label: row.label,
      host: row.host,
      port: row.port,
      database: row.database_name,
      user: row.user_name,
      tlsMode: row.tls_mode,
      verifiedAt: row.verified_at ? new Date(row.verified_at).toISOString() : null
    }));
  }

  async createSource(input: MigrationSourceInput, actor: string, secretKey: string) {
    const encrypted = encryptPassword(input.password, secretKey);
    const result = await sql`INSERT INTO data_migration_sources
      (uuid, label, host, port, database_name, user_name, password_ciphertext, tls_mode, created_by, updated_by, verified_at)
      VALUES (${randomUUID()}, ${input.label}, ${input.host}, ${input.port}, ${input.database},
        ${input.user}, ${encrypted}, ${input.tlsMode}, ${actor}, ${actor}, CURRENT_TIMESTAMP)`.execute(
      this.database
    );
    return Number(result.insertId);
  }

  async upsertCurrentSource(input: MigrationSourceInput, actor: string, secretKey: string) {
    const uuid = "f1dcb1e3-38ee-5c9a-8b10-e93d4561511e";
    const encrypted = encryptPassword(input.password, secretKey);
    await sql`INSERT INTO data_migration_sources
      (uuid, label, host, port, database_name, user_name, password_ciphertext, tls_mode, status, created_by, updated_by, verified_at)
      VALUES (${uuid}, ${input.label}, ${input.host}, ${input.port}, ${input.database},
        ${input.user}, ${encrypted}, ${input.tlsMode}, 'active', ${actor}, ${actor}, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE label = VALUES(label), host = VALUES(host), port = VALUES(port),
        database_name = VALUES(database_name), user_name = VALUES(user_name),
        password_ciphertext = VALUES(password_ciphertext), tls_mode = VALUES(tls_mode),
        status = 'active', verified_at = CURRENT_TIMESTAMP, updated_by = VALUES(updated_by)`.execute(
      this.database
    );
    const result = await sql<{
      id: number;
    }>`SELECT id FROM data_migration_sources WHERE uuid = ${uuid}`.execute(this.database);
    const id = result.rows[0]?.id;
    if (!id) throw new Error("Current CODEXSUN MariaDB source could not be saved.");
    return id;
  }

  async updateSource(id: number, input: MigrationSourceInput, actor: string, secretKey: string) {
    const encrypted = encryptPassword(input.password, secretKey);
    const result = await sql`UPDATE data_migration_sources SET label = ${input.label},
      host = ${input.host}, port = ${input.port}, database_name = ${input.database},
      user_name = ${input.user}, password_ciphertext = ${encrypted}, tls_mode = ${input.tlsMode},
      verified_at = CURRENT_TIMESTAMP, updated_by = ${actor}
      WHERE id = ${id} AND status = 'active'`.execute(this.database);
    if (!Number(result.numAffectedRows)) {
      throw new Error("External source connection was not found.");
    }
  }

  async resolveSource(id: number, secretKey: string): Promise<MigrationTenant> {
    const result = await sql<{
      id: number;
      label: string;
      host: string;
      port: number;
      database_name: string;
      user_name: string;
      password_ciphertext: string;
      tls_mode: "required" | "disabled";
    }>`SELECT id, label, host, port, database_name, user_name, password_ciphertext, tls_mode
      FROM data_migration_sources WHERE id = ${id} AND status = 'active'`.execute(this.database);
    const row = result.rows[0];
    if (!row) throw new Error("External source connection was not found.");
    return {
      id: row.id,
      label: row.label,
      host: row.host,
      port: row.port,
      database: row.database_name,
      user: row.user_name,
      password: decryptPassword(row.password_ciphertext, secretKey),
      tlsMode: row.tls_mode
    };
  }

  async markVerified(id: number, actor: string) {
    await sql`UPDATE data_migration_sources SET verified_at = CURRENT_TIMESTAMP,
      updated_by = ${actor} WHERE id = ${id} AND status = 'active'`.execute(this.database);
  }

  async deactivateSource(id: number, actor: string) {
    const result = await sql`UPDATE data_migration_sources SET status = 'inactive',
      updated_by = ${actor} WHERE id = ${id} AND status = 'active'`.execute(this.database);
    if (!Number(result.numAffectedRows))
      throw new Error("External source connection was not found.");
  }

  async removeSource(id: number, actor: string) {
    const result = await sql`UPDATE data_migration_sources SET status = 'inactive',
      password_ciphertext = '', updated_by = ${actor}
      WHERE id = ${id} AND status = 'active'`.execute(this.database);
    if (!Number(result.numAffectedRows))
      throw new Error("External source connection was not found.");
  }
}

type AuditQueueRow = {
  uuid: string;
  job_uuid: string;
  plan_hash: string;
  session_name: string;
  source_table: string;
  target_table: string;
  selected_rows: number;
  source_database: string;
  target_database: string;
  query_dump: string;
  status: string;
  plan_status: string | null;
  migration_status: string;
  queued_by: string;
  queued_at: Date | string;
  reviewed_by: string | null;
  reviewed_at: Date | string | null;
};

function mapAuditQueueSummary(row: AuditQueueRow): MigrationAuditQueueSummary {
  return {
    id: row.uuid,
    jobId: row.job_uuid,
    planHash: row.plan_hash,
    sessionName: row.session_name,
    sourceTable: row.source_table,
    targetTable: row.target_table,
    selectedRows: Number(row.selected_rows),
    sourceDatabase: row.source_database,
    targetDatabase: row.target_database,
    status: row.status === "reviewed" || row.status === "stale" ? row.status : "queued",
    planStatus:
      row.plan_status === "generated" ||
      row.plan_status === "finalized" ||
      row.plan_status === "completed" ||
      row.plan_status === "stale"
        ? row.plan_status
        : null,
    migrationStatus:
      row.migration_status === "running" ||
      row.migration_status === "completed" ||
      row.migration_status === "failed"
        ? row.migration_status
        : "draft",
    queuedBy: row.queued_by,
    queuedAt: new Date(row.queued_at).toISOString(),
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null
  };
}

function sqlCommentValue(value: string) {
  return value.replace(/[\r\n]+/gu, " ").trim();
}
